const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./config/database");

const bookingRoutes = require("./routes/bookingRoutes");
const authRoutes = require("./routes/authRoutes");
const branchRoutes = require("./routes/branchRoutes");
const serviceRoutes = require("./routes/serviceRoutes");

const app = express();

const PORT = 5000;


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(
    cors({
        origin: true,
        credentials: true
    })
);

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);


// =====================================================
// HOME / SERVER TEST
// =====================================================

app.get("/", (req, res) => {

    res.json({
        success: true,
        message: "The Beauty Salon Local Backend is running!",
        server: `http://localhost:${PORT}`,
        database: "salon_booking",
        environment: "LOCAL"
    });

});


// =====================================================
// DATABASE TEST
// =====================================================

app.get("/api/test-db", async (req, res) => {

    try {

        const [rows] = await pool.promise().query(
            "SELECT 1 AS connected"
        );

        res.json({
            success: true,
            message: "Local MySQL Database Connected Successfully!",
            data: rows
        });

    } catch (error) {

        console.error("DATABASE TEST ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Database connection failed.",
            error: error.message
        });

    }

});


// =====================================================
// BRANCHES API
// =====================================================

app.use("/api/branches", branchRoutes);


// =====================================================
// SERVICES API
// =====================================================

app.use("/api/services", serviceRoutes);


// =====================================================
// STAFF API
// =====================================================


// GET ALL STAFF

app.get("/api/staff", async (req, res) => {

    try {

        const [rows] = await pool.promise().query(`
            SELECT
                st.id,
                st.name,
                st.role,
                st.branch_id,
                st.phone,
                st.email,
                st.is_active,
                b.name AS branch
            FROM staff st
            INNER JOIN branches b
                ON st.branch_id = b.id
            WHERE st.is_active = 1
            ORDER BY st.id ASC
        `);

        res.json({
            success: true,
            count: rows.length,
            data: rows
        });

    } catch (error) {

        console.error("GET STAFF ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch staff.",
            error: error.message
        });

    }

});


// GET STAFF BY BRANCH

app.get("/api/staff/branch/:branchId", async (req, res) => {

    try {

        const [rows] = await pool.promise().query(
            `
            SELECT
                id,
                name,
                role,
                branch_id,
                phone,
                email
            FROM staff
            WHERE branch_id = ?
            AND is_active = 1
            ORDER BY id ASC
            `,
            [req.params.branchId]
        );

        res.json({
            success: true,
            count: rows.length,
            data: rows
        });

    } catch (error) {

        console.error("GET BRANCH STAFF ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch branch staff.",
            error: error.message
        });

    }

});


// =====================================================
// CUSTOMERS API
// =====================================================


// GET ALL CUSTOMERS

app.get("/api/customers", async (req, res) => {

    try {

        const [rows] = await pool.promise().query(`
            SELECT
                id,
                name,
                phone,
                email,
                created_at,
                updated_at
            FROM customers
            ORDER BY id DESC
        `);

        res.json({
            success: true,
            count: rows.length,
            data: rows
        });

    } catch (error) {

        console.error("GET CUSTOMERS ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch customers.",
            error: error.message
        });

    }

});


// GET SINGLE CUSTOMER

app.get("/api/customers/:id", async (req, res) => {

    try {

        const [rows] = await pool.promise().query(
            `
            SELECT
                id,
                name,
                phone,
                email,
                created_at,
                updated_at
            FROM customers
            WHERE id = ?
            LIMIT 1
            `,
            [req.params.id]
        );

        if (rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Customer not found."
            });

        }

        res.json({
            success: true,
            data: rows[0]
        });

    } catch (error) {

        console.error("GET CUSTOMER ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch customer.",
            error: error.message
        });

    }

});


// =====================================================
// BOOKINGS API
// =====================================================

app.use("/api/bookings", bookingRoutes);


// =====================================================
// AUTH API
// =====================================================

app.use("/api/auth", authRoutes);


// =====================================================
// DASHBOARD STATISTICS
// =====================================================

app.get("/api/dashboard/stats", async (req, res) => {

    try {

        const [customers] = await pool.promise().query(
            `
            SELECT COUNT(*) AS total
            FROM customers
            `
        );

        const [bookings] = await pool.promise().query(
            `
            SELECT COUNT(*) AS total
            FROM bookings
            `
        );

        const [services] = await pool.promise().query(
            `
            SELECT COUNT(*) AS total
            FROM services
            WHERE is_active = 1
            `
        );

        const [staff] = await pool.promise().query(
            `
            SELECT COUNT(*) AS total
            FROM staff
            WHERE is_active = 1
            `
        );

        const [confirmed] = await pool.promise().query(
            `
            SELECT COUNT(*) AS total
            FROM bookings
            WHERE status = 'CONFIRMED'
            `
        );

        const [completed] = await pool.promise().query(
            `
            SELECT COUNT(*) AS total
            FROM bookings
            WHERE status = 'COMPLETED'
            `
        );

        const [cancelled] = await pool.promise().query(
            `
            SELECT COUNT(*) AS total
            FROM bookings
            WHERE status = 'CANCELLED'
            `
        );

        res.json({
            success: true,
            data: {
                totalCustomers: customers[0].total,
                totalBookings: bookings[0].total,
                totalServices: services[0].total,
                activeStaff: staff[0].total,
                confirmedBookings: confirmed[0].total,
                completedBookings: completed[0].total,
                cancelledBookings: cancelled[0].total
            }
        });

    } catch (error) {

        console.error("DASHBOARD ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard statistics.",
            error: error.message
        });

    }

});


// =====================================================
// 404 HANDLER
// =====================================================

app.use((req, res) => {

    res.status(404).json({
        success: false,
        message: "API endpoint not found."
    });

});


// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {

    console.error("SERVER ERROR:", err);

    res.status(500).json({
        success: false,
        message: "Internal server error.",
        error: err.message
    });

});


// =====================================================
// START LOCAL SERVER
// =====================================================

app.listen(PORT, () => {

    console.log("==============================================");
    console.log("       THE BEAUTY SALON BACKEND");
    console.log("==============================================");
    console.log(`Server: http://localhost:${PORT}`);
    console.log("Database: salon_booking");
    console.log("Environment: LOCAL");
    console.log("Status: Running");
    console.log("==============================================");

});