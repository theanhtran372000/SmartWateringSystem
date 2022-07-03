const mysql = require('mysql')
const dbConfig = require('../config.json').databaseInfo

module.exports = {
    createConnection: function () {
        const conn = mysql.createConnection(
            {
                host: dbConfig.host,
                user: dbConfig.user,
                password: dbConfig.password,
                database: dbConfig.database,
                multipleStatements: true // Chạy nhiều SQL cùng lúc
            }
        )

        conn.connect()

        return conn
    }
}