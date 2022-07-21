const database = require('../database')
const multer = require('multer')
const utils = require('../utils')

// Lưu dữ liệu người dùng
const userStorage = multer.diskStorage({
    destination: function (req, file, cb){
        cb(null, 'public/upload/user')
    },
    filename: function (req, file, cb){
        cb(null, utils.getSaveString())
    }
})

const userUpload = multer({storage: userStorage})

module.exports = function (app, mqttClient){
    app.get('/', function(req, res, next){
        res.render('index')
    })

    app.get('/home', function(req, res, next){
        res.render('home')
    })

    app.get('/detail', function(req, res, next){
        res.render('detail')
    })

    // Xử lý request đăng nhập
    app.post('/login', function (req, res){
        // Dữ liệu gửi lên trong body
        const username = req.body.username
        const password = req.body.password

        console.log(username, password)

        // Kết nối tới CSDL
        const conn = database.createConnection()

        // Truy vấn
        conn.query('select * from account where username = ? and password = ?', [username, password], function (err, results){
            if (err) throw err
            
            // Nếu có kết quả
            if (results.length > 0){
                res.send({
                    status: 'success',
                    message: 'Đăng nhập thành công!',
                    userInfo: {
                        id: results[0].id,
                        name: results[0].name
                    }
                })
            }

            else{
                res.send({
                    status: 'fail',
                    message: 'Tài khoản không tồn tại!'
                  })
            }

            conn.end()
        })
    })

    // Xử lý request đăng ký
    app.post('/register', userUpload.single('avatar'), function(req, res){
        // Thông tin người dùng
        const username = req.body.username
        const password = req.body.password
        const name = req.body.name
        const avatar = '/' + req.file.path.replace(/\\/g, '/')

        // Tạo kết nối tới DB
        const conn = database.createConnection()

        // Kiểm tra tài khoản tồn tại
        conn.query('select *  from account where username = ?', [username], function(err, results){
            if (err) throw err

            // Nếu đã tồn tại tài khoản
            if (results.length > 0){
                res.send({
                    status: 'fail',
                    message: 'Tài khoản đã tồn tại!'
                })

                console.log('Đăng ký thất bại!')
                conn.end()
            }

            // Chưa tồn tại tài khoản
            else{
                // Thêm tài khoản
                conn.query('insert into account(username, password, name, avatar) values (?, ?, ?, ?)', [username, password, name, avatar], function (err, results){
                    if (err) throw err

                    res.send({
                        status: 'success',
                        message: 'Đăng ký thành công!'
                    })

                    console.log('Đăng ký thành công!')
                    conn.end()
                })
            }
        })
    })
}