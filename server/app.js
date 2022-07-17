// Công việc:
// - Phần giao diện và điều khiển cho web client
// - Giao diện Web
//      + Thiết kế giao diện (HTML, CSS)
//      + Chuyển sang EJS
// - Backend (APIs)

// Import module
const express = require('express')
const path = require('path')
const logger = require('morgan')
const mqttUtils = require('./mqtt_utils')
const mqttInfo = require('./config.json').MQTTBrokerInfo
const cookieParser = require('cookie-parser')
const database = require('./database')
const utils = require('./utils')

// Constant
const water_time = 15 // minutes

// Import HTTP route
const indexController = require('./routes/index')
const userController = require('./routes/user')

// Khởi tạo app
const app = express()
const port = process.env.PORT || '9999'

// Tạo MQTT Client
const mqttClient = mqttUtils.getMQTTClient()

// View engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

// Middleware
app.use(logger('tiny'))
app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(cookieParser())
app.use('/public', express.static(path.join(__dirname, 'public')))

// HTTP route
indexController(app, mqttClient)
userController(app, mqttClient)

// MQTT connection
// Thông tin topic
const dataTopic = mqttInfo.dataTopic
const commandTopic = mqttInfo.commandTopic
const stateTopic = mqttInfo.stateTopic

// Đăng ký nhận dữ liệu từ sensor
mqttClient.on('connect',  () => {
    console.log(`Connected to Broker ${mqttInfo.host}:${mqttInfo.port}`)
    mqttClient.subscribe([dataTopic, stateTopic], () => {
        console.log(`Subscribed to topic ${dataTopic} and ${stateTopic}`)
    })
})

// Xử lý dữ liệu gửi tới
mqttClient.on('message', function(topic, payload){
    // Nếu là dữ liệu gửi lên
    if (topic == dataTopic){

        // Bóc tách dữ liệu
        const data = JSON.parse(payload.toString())
        const id = data['id']
        const humi = + data['doam']
        const level =  + data['mucnuoc']

        console.log(`Recieve data from system ${id}: \n\t- Soil humi: ${humi}%\n\t- Water level: ${level}\n `)

        const conn = database.createConnection()

        // Lấy thông tin hệ thống phù hợp
        conn.query("select * from watering_system where device_id = ?", [id], function(err, results){
            if (err) throw err

            const system_id = results[0]['id']
            const humi_threshold = results[0]['humi_threshold']
            const last_watering = new Date(results[0]['last_watering'])
            const pump_duration = results[0]['pump_duration']

            // Xử lý tưới
            // Nếu độ ẩm hiện tại nhỏ hơn độ ẩm ngưỡng
            if (humi <= humi_threshold){

                // Nếu lần tưới gần nhất là hơn 15p trước
                if (utils.getDateDiffInSec(new Date(), last_watering) > water_time * 60){
                    console.log(`Current humi ${humi} is smaller than threshold ${humi_threshold}. Start watering!`)

                    // Gửi tín hiệu bật máy bơm
                    const command = {}

                    command['id'] = id
                    command['duration'] = pump_duration

                    mqttUtils.publish(mqttClient, commandTopic, JSON.stringify(command))
                }

                // Nếu chưa đủ 15p -> Đợi đủ 15p (chờ nước ngấm vào đất)
                else{
                    console.log(`Current humi ${humi} is smaller than threshold ${humi_threshold}. Wait 15m to watering!`)
                }
            }

            // Lưu dữ liệu vào db
            conn.query("insert into system_stats(system_id, soil_humi, water_level, read_time) values (?, ?, ?, ?)", [system_id, humi, level, utils.getCurrentDateString()], function (err, results){
                if (err) throw err

                console.log("Saved data to database!")
                conn.end()
            })
        })

    }

    // Nếu là báo cáo trạng thái máy bơm
    else if (topic == stateTopic){

        // Bóc tách dữ liệu báo cáo
        const stateJSON = JSON.parse(payload.toString())
        const id = stateJSON['id']
        const state = stateJSON['state']
        const duration = stateJSON['duration']

        // Nếu là bật lên
        if (state == 1){
            // Cập nhật trạng thái trên MySQL
            const conn = database.createConnection()

            // Lấy thông tin hệ thống
            conn.query('select * from watering_system where device_id = ?', [id], function(err, results){
                if (err) throw err

                system_id = results[0]['id']
                
                // Update thông tin về trạng thái tưới, thời gian tưới
                const now  = utils.getCurrentDateString()
                conn.query('update watering_system set pump_state = ?, last_watering = ? where id = ?; insert into watering(system_id, water_time, duration) values (?, ?, ?)',
                    [state, now, system_id,
                    system_id, now, duration], 
                    function(err, results){
                    if (err) throw err
                    
                    console.log(`Update system ${id} pump state to ON`)
                    console.log(`Pumping in ${duration}ms`)
                    conn.end()
                })

            })
            
        }
        else{
            const conn = database.createConnection()

            conn.query('update watering_system set pump_state = ? where device_id = ?', [state, id], function(err, results){
                if (err) throw err

                console.log(`Update system ${id} pump state to OFF`)
                conn.end()
            })
        } 
    }
})

// Chạy hệ thống
app.listen(port, function() {
    console.log(`Listening on port ${port}`)
})