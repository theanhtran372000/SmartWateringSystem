var database = require('../database')
var utils = require('../utils')

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
}