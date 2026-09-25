const mysql = require("mysql2");


// =====================================================
// DATABASE CONNECTION
// Local MySQL + TiDB Cloud / Render compatible
// =====================================================

const pool = mysql.createPool({

    host:
        process.env.DB_HOST || "localhost",

    port:
        Number(process.env.DB_PORT || 3306),

    user:
        process.env.DB_USER || "root",

    password:
        process.env.DB_PASSWORD || "root123",

    database:
        process.env.DB_NAME || "salon_booking",

    // TiDB Cloud requires TLS for public endpoint
    ssl:
        process.env.DB_SSL === "true"
            ? {
                minVersion: "TLSv1.2"
            }
            : undefined,

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
            "❌ Database Connection Failed"
        );

        console.error(
            err.message
        );

        return;
    }


    console.log(
        "✅ Database Connected Successfully"
    );


    connection.release();

});


// =====================================================
// EXPORT DATABASE POOL
// =====================================================

module.exports = pool;