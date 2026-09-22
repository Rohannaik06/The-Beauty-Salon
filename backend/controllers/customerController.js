const pool = require("../config/database");

// =====================================================
// GET ALL CUSTOMERS
// =====================================================

const getAllCustomers = async (req, res) => {
    try {
        const [rows] = await pool.promise().query(`
            SELECT
                c.id,
                c.name,
                c.email,
                c.phone,
                c.created_at,

                COUNT(b.id) AS total_bookings,

                MAX(
                    CASE
                        WHEN b.status = 'COMPLETED'
                        THEN b.booking_date
                        ELSE NULL
                    END
                ) AS last_visit,

                (
                    SELECT br.name
                    FROM bookings b2
                    INNER JOIN branches br
                        ON br.id = b2.branch_id
                    WHERE b2.customer_id = c.id
                    ORDER BY
                        b2.booking_date DESC,
                        b2.booking_time DESC,
                        b2.id DESC
                    LIMIT 1
                ) AS branch_name

            FROM customers c

            LEFT JOIN bookings b
                ON b.customer_id = c.id

            GROUP BY
                c.id,
                c.name,
                c.email,
                c.phone,
                c.created_at

            ORDER BY c.id DESC
        `);

        const customers = rows.map(customer => ({
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            created_at: customer.created_at,

            total_bookings: Number(customer.total_bookings || 0),

            last_visit: customer.last_visit || null,

            branch_name: customer.branch_name || "—",

            status:
                Number(customer.total_bookings || 0) > 0
                    ? "Active"
                    : "Inactive"
        }));

        return res.status(200).json({
            success: true,
            count: customers.length,
            data: customers
        });

    } catch (error) {
        console.error("GET ALL CUSTOMERS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch customers.",
            error: error.message
        });
    }
};


// =====================================================
// GET SINGLE CUSTOMER
// =====================================================

const getCustomerById = async (req, res) => {
    try {
        const [rows] = await pool.promise().query(`
            SELECT
                c.id,
                c.name,
                c.email,
                c.phone,
                c.created_at,

                COUNT(b.id) AS total_bookings,

                MAX(
                    CASE
                        WHEN b.status = 'COMPLETED'
                        THEN b.booking_date
                        ELSE NULL
                    END
                ) AS last_visit,

                (
                    SELECT br.name
                    FROM bookings b2
                    INNER JOIN branches br
                        ON br.id = b2.branch_id
                    WHERE b2.customer_id = c.id
                    ORDER BY
                        b2.booking_date DESC,
                        b2.booking_time DESC,
                        b2.id DESC
                    LIMIT 1
                ) AS branch_name

            FROM customers c

            LEFT JOIN bookings b
                ON b.customer_id = c.id

            WHERE c.id = ?

            GROUP BY
                c.id,
                c.name,
                c.email,
                c.phone,
                c.created_at

            LIMIT 1
        `, [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer not found."
            });
        }

        const customer = rows[0];

        return res.status(200).json({
            success: true,
            data: {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                created_at: customer.created_at,
                total_bookings: Number(
                    customer.total_bookings || 0
                ),
                last_visit: customer.last_visit || null,
                branch_name: customer.branch_name || "—",
                status:
                    Number(customer.total_bookings || 0) > 0
                        ? "Active"
                        : "Inactive"
            }
        });

    } catch (error) {
        console.error("GET CUSTOMER ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch customer.",
            error: error.message
        });
    }
};


// =====================================================
// CREATE CUSTOMER
// =====================================================

const createCustomer = async (req, res) => {
    try {
        const {
            name,
            email,
            phone
        } = req.body;

        if (!name || !email || !phone) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, email and phone are required."
            });
        }

        const cleanName = String(name).trim();
        const cleanEmail = String(email).trim().toLowerCase();
        const cleanPhone = String(phone).trim();

        if (!cleanName) {
            return res.status(400).json({
                success: false,
                message: "Customer name is required."
            });
        }

        // Check duplicate email
        const [emailRows] = await pool.promise().query(
            `
                SELECT id
                FROM customers
                WHERE LOWER(email) = ?
                LIMIT 1
            `,
            [cleanEmail]
        );

        if (emailRows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email is already registered."
            });
        }

        // Check duplicate phone
        const [phoneRows] = await pool.promise().query(
            `
                SELECT id
                FROM customers
                WHERE phone = ?
                LIMIT 1
            `,
            [cleanPhone]
        );

        if (phoneRows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Phone number is already registered."
            });
        }

        const [result] = await pool.promise().query(
            `
                INSERT INTO customers
                (
                    name,
                    email,
                    phone
                )
                VALUES (?, ?, ?)
            `,
            [
                cleanName,
                cleanEmail,
                cleanPhone
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Customer added successfully.",
            customerId: result.insertId
        });

    } catch (error) {
        console.error("CREATE CUSTOMER ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to add customer.",
            error: error.message
        });
    }
};


// =====================================================
// UPDATE CUSTOMER
// =====================================================

const updateCustomer = async (req, res) => {
    try {
        const {
            name,
            email,
            phone
        } = req.body;

        if (!name || !email || !phone) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, email and phone are required."
            });
        }

        const cleanName = String(name).trim();
        const cleanEmail = String(email).trim().toLowerCase();
        const cleanPhone = String(phone).trim();
        const customerId = req.params.id;

        // Check customer exists
        const [customerRows] = await pool.promise().query(
            `
                SELECT id
                FROM customers
                WHERE id = ?
                LIMIT 1
            `,
            [customerId]
        );

        if (customerRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer not found."
            });
        }

        // Check duplicate email
        const [emailRows] = await pool.promise().query(
            `
                SELECT id
                FROM customers
                WHERE LOWER(email) = ?
                AND id != ?
                LIMIT 1
            `,
            [
                cleanEmail,
                customerId
            ]
        );

        if (emailRows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email is already used by another customer."
            });
        }

        // Check duplicate phone
        const [phoneRows] = await pool.promise().query(
            `
                SELECT id
                FROM customers
                WHERE phone = ?
                AND id != ?
                LIMIT 1
            `,
            [
                cleanPhone,
                customerId
            ]
        );

        if (phoneRows.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "Phone number is already used by another customer."
            });
        }

        await pool.promise().query(
            `
                UPDATE customers
                SET
                    name = ?,
                    email = ?,
                    phone = ?
                WHERE id = ?
            `,
            [
                cleanName,
                cleanEmail,
                cleanPhone,
                customerId
            ]
        );

        return res.status(200).json({
            success: true,
            message: "Customer updated successfully."
        });

    } catch (error) {
        console.error("UPDATE CUSTOMER ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update customer.",
            error: error.message
        });
    }
};


// =====================================================
// DELETE CUSTOMER
// =====================================================

const deleteCustomer = async (req, res) => {
    try {
        const customerId = req.params.id;

        // Check customer exists
        const [customerRows] = await pool.promise().query(
            `
                SELECT id
                FROM customers
                WHERE id = ?
                LIMIT 1
            `,
            [customerId]
        );

        if (customerRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer not found."
            });
        }

        // Do not delete customer if booking history exists
        const [bookingRows] = await pool.promise().query(
            `
                SELECT id
                FROM bookings
                WHERE customer_id = ?
                LIMIT 1
            `,
            [customerId]
        );

        if (bookingRows.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "This customer cannot be deleted because booking history exists."
            });
        }

        await pool.promise().query(
            `
                DELETE FROM customers
                WHERE id = ?
            `,
            [customerId]
        );

        return res.status(200).json({
            success: true,
            message: "Customer deleted successfully."
        });

    } catch (error) {
        console.error("DELETE CUSTOMER ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete customer.",
            error: error.message
        });
    }
};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    getAllCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer
};