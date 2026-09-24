const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const pool = require("../config/database");


/* ============================================
   HELPER FUNCTIONS
============================================ */

function normalizePhone(value) {
    return String(value || "")
        .replace(/\D/g, "")
        .replace(/^91/, "")
        .replace(/^0/, "");
}


function normalizeEmail(value) {
    return String(value || "")
        .trim()
        .toLowerCase();
}


/* ============================================
   CUSTOMER REGISTRATION
============================================ */

async function registerCustomer(req, res) {

    const connection = await pool.promise().getConnection();

    try {

        const {
            fullName,
            name,
            mobile,
            phone,
            email,
            password
        } = req.body;


        const customerName = String(
            fullName || name || ""
        ).trim();

        const rawPhone = mobile || phone;

        const normalizedPhone = normalizePhone(rawPhone);

        const customerEmail = normalizeEmail(email);

        const customerPassword = String(password || "");


        /* ---------- VALIDATION ---------- */

        if (!customerName) {

            return res.status(400).json({
                success: false,
                message: "Full name is required."
            });

        }


        if (customerName.length < 2) {

            return res.status(400).json({
                success: false,
                message: "Please enter a valid full name."
            });

        }


        if (!normalizedPhone) {

            return res.status(400).json({
                success: false,
                message: "Mobile number is required."
            });

        }


        if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {

            return res.status(400).json({
                success: false,
                message: "Please enter a valid 10-digit Indian mobile number."
            });

        }


        if (!customerEmail) {

            return res.status(400).json({
                success: false,
                message: "Email is required."
            });

        }


        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {

            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });

        }


        if (customerPassword.length < 6) {

            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters."
            });

        }


        const formattedPhone = `+91 ${normalizedPhone}`;


        await connection.beginTransaction();


        /* ---------- CHECK MOBILE ---------- */

        const [phoneRows] = await connection.query(
            `
            SELECT *
            FROM customers
            WHERE phone = ?
            LIMIT 1
            `,
            [formattedPhone]
        );


        /* ---------- CHECK EMAIL ---------- */

        const [emailRows] = await connection.query(
            `
            SELECT *
            FROM customers
            WHERE email = ?
            LIMIT 1
            `,
            [customerEmail]
        );


        /* ---------- DUPLICATE EMAIL ---------- */

        if (
            emailRows.length > 0 &&
            phoneRows.length === 0
        ) {

            await connection.rollback();

            return res.status(409).json({
                success: false,
                message: "Email is already registered."
            });

        }


        /* ---------- EXISTING CUSTOMER ---------- */

        if (phoneRows.length > 0) {

            const existingCustomer = phoneRows[0];


            if (
                existingCustomer.email &&
                existingCustomer.email !== customerEmail
            ) {

                await connection.rollback();

                return res.status(409).json({
                    success: false,
                    message: "Mobile number is already registered with another email."
                });

            }


            const hashedPassword = await bcrypt.hash(
                customerPassword,
                12
            );


            await connection.query(
                `
                UPDATE customers
                SET
                    name = ?,
                    email = ?,
                    password = ?
                WHERE id = ?
                `,
                [
                    customerName,
                    customerEmail,
                    hashedPassword,
                    existingCustomer.id
                ]
            );


            await connection.commit();


            const [updatedRows] = await connection.query(
                `
                SELECT
                    id,
                    name,
                    phone,
                    email,
                    created_at
                FROM customers
                WHERE id = ?
                LIMIT 1
                `,
                [existingCustomer.id]
            );


            return res.status(200).json({
                success: true,
                message: "Registration successful.",
                customer: updatedRows[0]
            });

        }


        /* ---------- CREATE NEW CUSTOMER ---------- */

        const hashedPassword = await bcrypt.hash(
            customerPassword,
            12
        );


        const [result] = await connection.query(
            `
            INSERT INTO customers
            (
                name,
                phone,
                email,
                password
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                customerName,
                formattedPhone,
                customerEmail,
                hashedPassword
            ]
        );


        await connection.commit();


        const [newCustomerRows] = await pool.promise().query(
            `
            SELECT
                id,
                name,
                phone,
                email,
                created_at
            FROM customers
            WHERE id = ?
            LIMIT 1
            `,
            [result.insertId]
        );


        return res.status(201).json({
            success: true,
            message: "Registration successful.",
            customer: newCustomerRows[0]
        });


    } catch (error) {

        try {
            await connection.rollback();
        } catch (_) {}


        console.error(
            "❌ Customer Registration Error:",
            error
        );


        if (error.code === "ER_DUP_ENTRY") {

            return res.status(409).json({
                success: false,
                message: "Mobile number or email is already registered."
            });

        }


        return res.status(500).json({
            success: false,
            message: "Registration failed. Please try again."
        });


    } finally {

        connection.release();

    }

}


/* ============================================
   CUSTOMER LOGIN
============================================ */

async function loginCustomer(req, res) {

    try {

        const {
            identifier,
            mobile,
            phone,
            email,
            password
        } = req.body;


        const loginIdentifier = String(
            identifier || mobile || phone || email || ""
        ).trim();


        const loginPassword = String(
            password || ""
        );


        if (!loginIdentifier) {

            return res.status(400).json({
                success: false,
                message: "Email or mobile number is required."
            });

        }


        if (!loginPassword) {

            return res.status(400).json({
                success: false,
                message: "Password is required."
            });

        }


        const normalizedEmail = normalizeEmail(
            loginIdentifier
        );


        const normalizedMobile = normalizePhone(
            loginIdentifier
        );


        let rows = [];


        /* ---------- EMAIL LOGIN ---------- */

        if (
            loginIdentifier.includes("@") &&
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
        ) {

            [rows] = await pool.promise().query(
                `
                SELECT
                    id,
                    name,
                    phone,
                    email,
                    password,
                    created_at
                FROM customers
                WHERE email = ?
                LIMIT 1
                `,
                [normalizedEmail]
            );

        }


        /* ---------- MOBILE LOGIN ---------- */

        else {

            if (!/^[6-9]\d{9}$/.test(normalizedMobile)) {

                return res.status(400).json({
                    success: false,
                    message: "Please enter a valid email or 10-digit mobile number."
                });

            }


            const formattedPhone = `+91 ${normalizedMobile}`;


            [rows] = await pool.promise().query(
                `
                SELECT
                    id,
                    name,
                    phone,
                    email,
                    password,
                    created_at
                FROM customers
                WHERE phone = ?
                LIMIT 1
                `,
                [formattedPhone]
            );

        }


        if (rows.length === 0) {

            return res.status(401).json({
                success: false,
                message: "Invalid email/mobile or password."
            });

        }


        const customer = rows[0];


        if (!customer.password) {

            return res.status(401).json({
                success: false,
                message: "This account does not have a password. Please register again."
            });

        }


        const passwordMatch = await bcrypt.compare(
            loginPassword,
            customer.password
        );


        if (!passwordMatch) {

            return res.status(401).json({
                success: false,
                message: "Invalid email/mobile or password."
            });

        }


        /* ---------- CREATE SESSION TOKEN ---------- */

        const sessionToken = crypto.randomBytes(48).toString("hex");


        const expiresAt = new Date(
            Date.now() + (7 * 24 * 60 * 60 * 1000)
        );


        await pool.promise().query(
            `
            INSERT INTO customer_sessions
            (
                customer_id,
                session_token,
                expires_at
            )
            VALUES (?, ?, ?)
            `,
            [
                customer.id,
                sessionToken,
                expiresAt
            ]
        );


        return res.status(200).json({

            success: true,

            message: "Login successful.",

            token: sessionToken,

            customer: {
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                email: customer.email,
                created_at: customer.created_at
            }

        });


    } catch (error) {

        console.error(
            "❌ Customer Login Error:",
            error
        );


        return res.status(500).json({
            success: false,
            message: "Login failed. Please try again."
        });

    }

}


/* ============================================
   FORGOT PASSWORD
============================================ */

async function forgotPassword(req, res) {

    try {

        const {
            email,
            newPassword,
            confirmPassword
        } = req.body;


        const customerEmail = normalizeEmail(email);

        const password = String(newPassword || "");

        const confirm = String(confirmPassword || "");


        /* ---------- EMAIL VALIDATION ---------- */

        if (!customerEmail) {

            return res.status(400).json({
                success: false,
                message: "Email is required."
            });

        }


        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)
        ) {

            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });

        }


        /* ---------- PASSWORD VALIDATION ---------- */

        if (!password) {

            return res.status(400).json({
                success: false,
                message: "New password is required."
            });

        }


        if (password.length < 6) {

            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters."
            });

        }


        if (password !== confirm) {

            return res.status(400).json({
                success: false,
                message: "Passwords do not match."
            });

        }


        /* ---------- FIND CUSTOMER ---------- */

        const [rows] = await pool.promise().query(
            `
            SELECT
                id,
                email
            FROM customers
            WHERE email = ?
            LIMIT 1
            `,
            [customerEmail]
        );


        if (rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "No customer account found with this email."
            });

        }


        const customer = rows[0];


        /* ---------- HASH NEW PASSWORD ---------- */

        const hashedPassword = await bcrypt.hash(
            password,
            12
        );


        /* ---------- UPDATE PASSWORD ---------- */

        await pool.promise().query(
            `
            UPDATE customers
            SET password = ?
            WHERE id = ?
            `,
            [
                hashedPassword,
                customer.id
            ]
        );


        /* ---------- INVALIDATE OLD SESSIONS ---------- */

        await pool.promise().query(
            `
            DELETE FROM customer_sessions
            WHERE customer_id = ?
            `,
            [customer.id]
        );


        return res.status(200).json({
            success: true,
            message: "Password reset successfully. Please login with your new password."
        });


    } catch (error) {

        console.error(
            "❌ Forgot Password Error:",
            error
        );


        return res.status(500).json({
            success: false,
            message: "Password reset failed. Please try again."
        });

    }

}


/* ============================================
   GET CUSTOMER FROM SESSION TOKEN
============================================ */

async function getCustomerFromToken(token) {

    if (!token) {
        return null;
    }


    const [rows] = await pool.promise().query(
        `
        SELECT
            c.id,
            c.name,
            c.phone,
            c.email,
            c.created_at
        FROM customer_sessions s
        INNER JOIN customers c
            ON c.id = s.customer_id
        WHERE
            s.session_token = ?
            AND s.expires_at > NOW()
        LIMIT 1
        `,
        [token]
    );


    if (rows.length === 0) {
        return null;
    }


    return rows[0];

}


/* ============================================
   CUSTOMER PROFILE UPDATE
============================================ */

async function updateCustomerProfile(req, res) {

    try {

        /* ---------- GET AUTHORIZATION HEADER ---------- */

        const authorization =
            req.headers.authorization || "";


        if (!authorization.startsWith("Bearer ")) {

            return res.status(401).json({
                success: false,
                message: "Authentication token is required."
            });

        }


        const token =
            authorization.substring(7).trim();


        if (!token) {

            return res.status(401).json({
                success: false,
                message: "Authentication token is required."
            });

        }


        /* ---------- FIND CUSTOMER ---------- */

        const customer =
            await getCustomerFromToken(token);


        if (!customer) {

            return res.status(401).json({
                success: false,
                message: "Session expired or invalid. Please login again."
            });

        }


        /* ---------- GET UPDATED DATA ---------- */

        const {
            fullName,
            name,
            email
        } = req.body;


        const updatedName = String(
            fullName || name || ""
        ).trim();


        const updatedEmail = normalizeEmail(
            email
        );


        /* ---------- VALIDATE NAME ---------- */

        if (!updatedName) {

            return res.status(400).json({
                success: false,
                message: "Full name is required."
            });

        }


        if (updatedName.length < 2) {

            return res.status(400).json({
                success: false,
                message: "Please enter a valid full name."
            });

        }


        /* ---------- VALIDATE EMAIL ---------- */

        if (!updatedEmail) {

            return res.status(400).json({
                success: false,
                message: "Email is required."
            });

        }


        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                updatedEmail
            )
        ) {

            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });

        }


        /* ---------- CHECK DUPLICATE EMAIL ---------- */

        const [emailRows] = await pool.promise().query(
            `
            SELECT id
            FROM customers
            WHERE email = ?
              AND id <> ?
            LIMIT 1
            `,
            [
                updatedEmail,
                customer.id
            ]
        );


        if (emailRows.length > 0) {

            return res.status(409).json({
                success: false,
                message: "This email is already registered with another account."
            });

        }


        /* ---------- UPDATE PROFILE ---------- */

        await pool.promise().query(
            `
            UPDATE customers
            SET
                name = ?,
                email = ?
            WHERE id = ?
            `,
            [
                updatedName,
                updatedEmail,
                customer.id
            ]
        );


        /* ---------- GET UPDATED CUSTOMER ---------- */

        const [updatedRows] = await pool.promise().query(
            `
            SELECT
                id,
                name,
                phone,
                email,
                created_at
            FROM customers
            WHERE id = ?
            LIMIT 1
            `,
            [customer.id]
        );


        return res.status(200).json({

            success: true,

            message: "Profile updated successfully.",

            customer: updatedRows[0]

        });


    } catch (error) {

        console.error(
            "❌ Profile Update Error:",
            error
        );


        if (error.code === "ER_DUP_ENTRY") {

            return res.status(409).json({
                success: false,
                message: "This email is already registered."
            });

        }


        return res.status(500).json({
            success: false,
            message: "Profile update failed. Please try again."
        });

    }

}


/* ============================================
   EXPORT CONTROLLERS
============================================ */

module.exports = {

    registerCustomer,

    loginCustomer,

    forgotPassword,

    updateCustomerProfile

};