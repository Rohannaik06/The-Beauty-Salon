const pool = require("../config/database");


// =====================================================
// GET ALL SERVICES
// =====================================================

const getAllServices = async (req, res) => {
    try {

        const [rows] = await pool.promise().query(`
            SELECT
                id,
                name,
                category,
                price,
                duration,
                description,
                service_image,
                is_active,
                created_at
            FROM services
            ORDER BY id ASC
        `);

        res.json({
            success: true,
            count: rows.length,
            data: rows
        });

    } catch (error) {

        console.error("GET SERVICES ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch services.",
            error: error.message
        });
    }
};


// =====================================================
// GET SINGLE SERVICE
// =====================================================

const getServiceById = async (req, res) => {
    try {

        const [rows] = await pool.promise().query(`
            SELECT
                id,
                name,
                category,
                price,
                duration,
                description,
                service_image,
                is_active,
                created_at
            FROM services
            WHERE id = ?
            LIMIT 1
        `, [req.params.id]);


        if (rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Service not found."
            });

        }


        res.json({
            success: true,
            data: rows[0]
        });

    } catch (error) {

        console.error("GET SERVICE ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch service.",
            error: error.message
        });
    }
};


// =====================================================
// CREATE SERVICE
// =====================================================

const createService = async (req, res) => {
    try {

        const {
            name,
            category,
            description,
            price,
            duration,
            service_image,
            is_active
        } = req.body;


        // Required fields
        if (
            !name ||
            !category ||
            price === undefined ||
            duration === undefined
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Service name, category, price and duration are required."
            });

        }


        const categoryValue = String(category)
            .toLowerCase()
            .trim();


        // Allowed categories
        if (!["him", "her", "child"].includes(categoryValue)) {

            return res.status(400).json({
                success: false,
                message:
                    "Category must be Him, Her or Child."
            });

        }


        // Validate price
        if (
            !Number.isFinite(Number(price)) ||
            Number(price) < 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Price must be a valid non-negative number."
            });

        }


        // Validate duration
        if (
            !Number.isInteger(Number(duration)) ||
            Number(duration) <= 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Duration must be a positive whole number."
            });

        }


        const [result] = await pool.promise().query(`
            INSERT INTO services
            (
                name,
                category,
                price,
                duration,
                description,
                service_image,
                is_active
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [

            name.trim(),

            categoryValue,

            Number(price),

            Number(duration),

            description
                ? String(description).trim()
                : null,

            service_image
                ? String(service_image).trim()
                : null,

            is_active === 0 ? 0 : 1

        ]);


        res.status(201).json({

            success: true,

            message:
                "Service added successfully.",

            serviceId:
                result.insertId

        });

    } catch (error) {

        console.error("ADD SERVICE ERROR:", error);

        res.status(500).json({

            success: false,

            message:
                "Failed to add service.",

            error:
                error.message

        });

    }
};


// =====================================================
// UPDATE SERVICE
// =====================================================

const updateService = async (req, res) => {
    try {

        const {
            name,
            category,
            description,
            price,
            duration,
            service_image,
            is_active
        } = req.body;


        // Required fields
        if (
            !name ||
            !category ||
            price === undefined ||
            duration === undefined
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Service name, category, price and duration are required."

            });

        }


        const categoryValue = String(category)
            .toLowerCase()
            .trim();


        // Validate category
        if (!["him", "her", "child"].includes(categoryValue)) {

            return res.status(400).json({

                success: false,

                message:
                    "Category must be Him, Her or Child."

            });

        }


        // Validate price
        if (
            !Number.isFinite(Number(price)) ||
            Number(price) < 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Price must be a valid non-negative number."

            });

        }


        // Validate duration
        if (
            !Number.isInteger(Number(duration)) ||
            Number(duration) <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Duration must be a positive whole number."

            });

        }


        const [result] = await pool.promise().query(`
            UPDATE services
            SET
                name = ?,
                category = ?,
                price = ?,
                duration = ?,
                description = ?,
                service_image = ?,
                is_active = ?
            WHERE id = ?
        `, [

            name.trim(),

            categoryValue,

            Number(price),

            Number(duration),

            description
                ? String(description).trim()
                : null,

            service_image
                ? String(service_image).trim()
                : null,

            is_active === 0 ? 0 : 1,

            req.params.id

        ]);


        if (result.affectedRows === 0) {

            return res.status(404).json({

                success: false,

                message:
                    "Service not found."

            });

        }


        res.json({

            success: true,

            message:
                "Service updated successfully."

        });

    } catch (error) {

        console.error(
            "UPDATE SERVICE ERROR:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to update service.",

            error:
                error.message

        });

    }
};


// =====================================================
// DELETE SERVICE
// =====================================================

const deleteService = async (req, res) => {
    try {

        const [result] = await pool.promise().query(

            "DELETE FROM services WHERE id = ?",

            [req.params.id]

        );


        if (result.affectedRows === 0) {

            return res.status(404).json({

                success: false,

                message:
                    "Service not found."

            });

        }


        res.json({

            success: true,

            message:
                "Service deleted successfully."

        });

    } catch (error) {

        console.error(
            "DELETE SERVICE ERROR:",
            error
        );


        res.status(409).json({

            success: false,

            message:
                "This service cannot be deleted because it is linked with existing bookings.",

            error:
                error.message

        });

    }
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    getAllServices,

    getServiceById,

    createService,

    updateService,

    deleteService

};