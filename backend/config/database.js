const mysql = require("mysql2");


// =====================================================
// LOCAL MYSQL DATABASE CONNECTION
// =====================================================

const pool = mysql.createPool({

    host: process.env.DB_HOST || "localhost",

    port: Number(
        process.env.DB_PORT || 3306
    ),

    user:
        process.env.DB_USER || "root",

    password:
        process.env.DB_PASSWORD || "root123",

    database:
        process.env.DB_NAME || "salon_booking",

    waitForConnections: true,

    connectionLimit: 10,

    queueLimit: 0

});


// =====================================================
// TEST DATABASE CONNECTION
// =====================================================

pool.getConnection((err, connection) => {

    if (err) {

        console.error(
            "❌ Local MySQL Database Connection Failed"
        );

        console.error(
            err.message
        );

        return;
    }


    console.log(
        "✅ Local MySQL Database Connected Successfully"
    );


    connection.release();

});


// =====================================================
// EXPORT DATABASE POOL
// =====================================================

module.exports = pool;