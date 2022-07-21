const database = require('../database')
const multer = require('multer')
const utils = require('../utils')
const mqttUtils = require('../mqtt_utils')
const mqttConfig = require('../config.json').MQTTBrokerInfo


// Lưu dữ liệu người dùng
const treeStorage = multer.diskStorage({
    destination: function (req, file, cb){
        cb(null, 'public/upload/tree')
    },
    filename: function (req, file, cb){
        cb(null, utils.getSaveString())
    }
})

const treeUpload = multer({storage: treeStorage})

module.exports = function (app, mqttClient){
    // Lấy thông tin trang chủ người dùng
    app.get('/user/:uid/home', function(req, res){
        const uid = req.params.uid
        
        // Tạo kết nối tới cơ sở dữ liệu
        const conn = database.createConnection()

        // Lấy thông tin user
        conn.query('select * from account where id = ?', [uid], function (err, results){
            if (err) throw err

            const userid = results[0].id
            const name = results[0].name
            const avatar = results[0].avatar
            
            // Lấy thông tin những hệ thống thuộc quyền quản lý của User
            conn.query('select * from watering_system where acc_id = ? order by device_id asc', [userid], function(err, results){
                if (err) throw err

                const arr = []

                results.forEach(element => {
                    arr.push({
                        type: element.tree_type,
                        id: element.device_id,
                        image: element.image,
                        description: element.description
                    })
                })

                res.render('home', {
                    userid: userid,
                    name: name,
                    avatar: avatar,
                    listTree: arr
                })

                conn.end()
            })
        })
    })

    // Thêm mới cây
    app.post('/addTree', treeUpload.single('image'), function(req, res) {
        const userid = req.body.userid
        const type = req.body.type
        const id = req.body.id
        const image = '/' + req.file.path.replace(/\\/g, '/')
        const description = req.body.description

        // Tạo kết nối tới cơ sở dữ liệu
        const conn = database.createConnection()

        // Kiểm tra tồn tại
        conn.query('select * from watering_system where device_id = ?', [id], function (err, results) {
            if (err) throw err

            // Nếu đã hệ thống đã được thêm trước đây
            if (results.length > 0){
                res.send({
                    status: 'fail',
                    message: 'Id đã tồn tại trong hệ thống!'
                })

                console.log('Thêm mới thất bại!')
                conn.end()
            }

            else{
                conn.query('insert into watering_system(acc_id, device_id, tree_type, image, description) values (?, ?, ?, ?, ?)', [userid, id, type, image, description], function (err, results){
                    if (err) throw err

                    res.send({
                        status: 'success',
                        message: 'Thêm mới thành công!'
                    })

                    console.log('Thêm mới thành công!')
                    conn.end()
                })
            }
        })
    })

    // Lấy danh sách cây
    app.post('/getTreeList', function (req, res) {
        const userid = req.body.userid

        // Tạo kết nối tới CSDL
        const conn = database.createConnection()

        // Lấy tất cả cây thuộc sở hữu của user đó
        conn.query('select * from watering_system where acc_id = ?', [userid], function (err, results) {
            if(err) throw err

            const ans = []

            results.forEach(function (element) {
                ans.push({
                    id: element.device_id,
                    type: element.tree_type,
                    image: element.image,
                    description: element.description
                })
            })

            res.send({
                status: 'success',
                data: ans
            })

            conn.end()
        })
    })

    // Xóa cây
    app.post('/deleteTree', function (req, res){
        const treeId = req.body.treeId

        const conn = database.createConnection()

        conn.query('delete from system_stats where device_id = ?; delete from watering where device_id = ?', [treeId, treeId], function (err, results){
            if (err) throw err

            conn.query('delete from watering_system where device_id = ?', [treeId], function(err, results){
                if (err) throw err

                res.send({
                    status: 'success'
                })

                conn.end()
            })
        })
    })

    // Lấy thông tin chi tiết cây
    app.get('/user/:uid/tree/:treeid', function(req, res){
        const userid = req.params.uid
        const treeid = req.params.treeid

        const arr = []
        arr.push('select * from system_stats where device_id = ? order by read_time desc limit 1')
        arr.push('select * from watering_system where device_id = ?')
        arr.push('select * from watering where device_id = ? order by water_time desc')

        const conn = database.createConnection()

        conn.query(arr.join('; '), [treeid, treeid, treeid], function(err, results){
            if (err) throw err

            const arr = []

            results[2].forEach(function (e) {
                const datetime = new Date(e.water_time)

                arr.push({
                    date: utils.getDate(datetime),
                    time: utils.getTime(datetime),
                    duration: e.duration
                })
            })

            res.render('detail', {
                humi: (results[0].length > 0) ? results[0][0].soil_humi : 0,
                water: (results[0].length > 0) ? results[0][0].water_level : 0,
                type: results[1][0].tree_type,
                id: results[1][0].device_id,
                image: results[1][0].image,
                description: results[1][0].description,
                state: results[1][0].pump_state,
                duration: results[1][0].pump_duration,
                threshold: results[1][0].humi_threshold,
                history: arr
            })

            conn.end()
        })
    })

    // Cập nhật thông số mặc định của hệ thống
    app.post('/updateDefault', function (req, res) {
        const treeid = req.body.treeid
        const duration = req.body.duration
        const threshold = req.body.threshold

        const conn = database.createConnection()

        conn.query('update watering_system set pump_duration = ?, humi_threshold = ? where device_id = ?', [duration, threshold, treeid], function(err, results){
            if (err) throw err

            res.send({
                status: 'success'
            })

            conn.end()
        })
    })

    // Lấy lịch sử tưới của cây
    app.post('/getHistory', function(req, res){
        const treeid = req.body.treeid

        const conn = database.createConnection()

        conn.query('select * from watering where device_id = ? order by water_time desc', [treeid], function(err, results){
            if (err) throw err

            const arr = []
            results.forEach(function (e){
                arr.push({
                    date: utils.getDate(e.water_time),
                    time: utils.getTime(e.water_time),
                    duration: e.duration
                })
            })

            res.send({
                status: 'success',
                data: arr
            })

            conn.end()
        })
    })

    // Tưới cây
    app.post('/watering', function (req, res){
        const treeid = req.body.treeid
        const duration = req.body.duration

        // Gửi tín hiệu tưới
        const command = {
            id: treeid,
            duration: duration
        }
        mqttUtils.publish(mqttClient, mqttConfig.commandTopic, JSON.stringify(command))

        // Thêm vào lịch sử tưới
        const conn = database.createConnection()

        conn.query('select * from watering_system where device_id = ?', [treeid], function(err, results){
            if (err) throw err

            const systemId = results[0].id
            const currentState = results[0].pump_state

            conn.query('insert into watering (system_id, device_id, water_time, duration) values (?, ?, ?, ?)', [systemId, treeid, utils.getCurrentDateString(), duration], function(err, results){
                if(err) throw err

                res.send({
                    status: 'success',
                    pumpState: currentState
                })
            })

            conn.end()
        })
    })

    // Lấy dữ liệu mới nhất
    app.post('/getLatestData', function(req, res){
        const treeid = req.body.treeid

        const conn = database.createConnection()

        const arr = []
        arr.push('select * from system_stats where device_id = ? order by read_time desc limit 1')
        arr.push('select * from watering_system where device_id = ?')

        conn.query(arr.join('; '), [treeid, treeid], function(err, results){
            if(err) throw err

            res.send({
                status: 'success',
                humi: (results[0].length > 0) ? results[0][0].soil_humi : 0,
                water: (results[0].length > 0) ? results[0][0].water_level : 0,
                pumpState: results[1][0].pump_state
            })

            conn.end()
        })
    })
}