const crypto = require("crypto");
const pool = require("../config/database");

const db = pool.promise();


const adminLogin = async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        const adminEmail = String(
            email || ""
        )
            .trim()
            .toLowerCase();

        const adminPassword = String(
            password || ""
        );


        if (!adminEmail) {
            return res.status(400).json({
                success: false,
                message: "Email is required."
            });
        }


        if (!adminPassword) {
            return res.status(400).json({
                success: false,
                message: "Password is required."
            });
        }


        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                adminEmail
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });
        }


        const [rows] = await db.query(
            `
            SELECT
                id,
                email,
                password
            FROM admins
            WHERE email = ?
            LIMIT 1
            `,
            [adminEmail]
        );


        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }


        const admin = rows[0];


        if (admin.password !== adminPassword) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }


        const adminToken = crypto
            .randomBytes(48)
            .toString("hex");


        return res.status(200).json({
            success: true,
            message: "Admin login successful.",
            token: adminToken,
            admin: {
                id: admin.id,
                email: admin.email
            }
        });


    } catch (error) {

        console.error(
            "❌ Admin Login Error:",
            error
        );


        return res.status(500).json({
            success: false,
            message: "Admin login failed. Please try again."
        });
    }
};


module.exports = {
    adminLogin
};