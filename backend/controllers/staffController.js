const pool = require("../config/database");


// =========================================================
// GET ALL STAFF
// =========================================================

const getAllStaff = async (req, res) => {
    try {

        const [rows] = await pool.promise().query(`
            SELECT
                s.id,
                s.name,
                s.branch_id,
                b.name AS branch_name,
                s.phone,
                s.is_active,
                s.created_at,
                COUNT(bk.id) AS total_bookings
            FROM staff s

            LEFT JOIN branches b
                ON b.id = s.branch_id

            LEFT JOIN bookings bk
                ON bk.staff_id = s.id

            GROUP BY
                s.id,
                s.name,
                s.branch_id,
                b.name,
                s.phone,
                s.is_active,
                s.created_at

            ORDER BY s.id ASC
        `);


        const data = rows.map(staff => ({
            id: staff.id,
            name: staff.name,
            branch_id: staff.branch_id,
            branch_name: staff.branch_name || "—",
            phone: staff.phone,
            is_active: Number(staff.is_active) === 1,
            status:
                Number(staff.is_active) === 1
                    ? "Active"
                    : "Inactive",
            total_bookings:
                Number(staff.total_bookings || 0),
            created_at: staff.created_at
        }));


        return res.status(200).json({
            success: true,
            count: data.length,
            data
        });

    } catch (error) {

        console.error(
            "GET ALL STAFF ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch staff.",
            error: error.message
        });
    }
};



// =========================================================
// GET STAFF BY ID
// =========================================================

const getStaffById = async (req, res) => {
    try {

        const [rows] = await pool.promise().query(`
            SELECT
                s.id,
                s.name,
                s.branch_id,
                b.name AS branch_name,
                s.phone,
                s.is_active,
                s.created_at,
                COUNT(bk.id) AS total_bookings

            FROM staff s

            LEFT JOIN branches b
                ON b.id = s.branch_id

            LEFT JOIN bookings bk
                ON bk.staff_id = s.id

            WHERE s.id = ?

            GROUP BY
                s.id,
                s.name,
                s.branch_id,
                b.name,
                s.phone,
                s.is_active,
                s.created_at

            LIMIT 1
        `, [
            req.params.id
        ]);


        if (rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Staff member not found."
            });
        }


        const staff = rows[0];


        return res.status(200).json({
            success: true,

            data: {
                id: staff.id,
                name: staff.name,
                branch_id: staff.branch_id,
                branch_name:
                    staff.branch_name || "—",
                phone: staff.phone,

                is_active:
                    Number(staff.is_active) === 1,

                status:
                    Number(staff.is_active) === 1
                        ? "Active"
                        : "Inactive",

                total_bookings:
                    Number(
                        staff.total_bookings || 0
                    ),

                created_at: staff.created_at
            }
        });

    } catch (error) {

        console.error(
            "GET STAFF BY ID ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch staff member.",
            error: error.message
        });
    }
};


// =========================================================
// GET STAFF BY BRANCH
// =========================================================

const getStaffByBranch = async (req, res) => {
    try {
        const branchId = Number(req.params.branchId);

        if (
            !Number.isInteger(branchId) ||
            branchId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid branch ID."
            });
        }

        const [branchRows] =
            await pool.promise().query(
                `
                SELECT
                    id
                FROM branches
                WHERE
                    id = ?
                    AND is_active = 1
                LIMIT 1
                `,
                [branchId]
            );

        if (branchRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Selected branch is not available."
            });
        }

        const [rows] =
            await pool.promise().query(
                `
                SELECT
                    id,
                    name,
                    branch_id,
                    phone,
                    is_active
                FROM staff
                WHERE
                    branch_id = ?
                    AND is_active = 1
                ORDER BY
                    id ASC
                `,
                [branchId]
            );

        return res.status(200).json({
            success: true,
            count: rows.length,
            data: rows
        });

    } catch (error) {
        console.error(
            "GET STAFF BY BRANCH ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch staff for branch.",
            error: error.message
        });
    }
};


// =========================================================
// VALIDATE STAFF INPUT
// =========================================================
const validateStaffInput = async (body) => {
    const name =
        String(body.name || "").trim();

    const phone =
        String(body.phone || "").trim();

    const branchId =
        Number(body.branch_id);

    const isActive =
        body.is_active === false ||
        body.is_active === 0 ||
        body.is_active === "0" ||
        body.status === "Inactive"
            ? 0
            : 1;

    if (
        !name ||
        !Number.isInteger(branchId) ||
        branchId <= 0
    ) {
        return {
            error:
                "Name and a valid branch are required."
        };
    }

    const [branchRows] =
        await pool.promise().query(
            `
            SELECT id
            FROM branches
            WHERE id = ?
            LIMIT 1
            `,
            [branchId]
        );

    if (branchRows.length === 0) {
        return {
            error:
                "Selected branch does not exist."
        };
    }

    return {
        name,
        phone: phone || null,
        branchId,
        isActive
    };
};



// =========================================================
// CREATE STAFF
// =========================================================

const createStaff = async (req, res) => {

    try {

        const values =
            await validateStaffInput(
                req.body
            );


        if (values.error) {

            return res.status(400).json({
                success: false,
                message: values.error
            });
        }


        if (values.phone) {
            const [phoneRows] =
                await pool.promise().query(
                    `
                    SELECT id
                    FROM staff
                    WHERE phone = ?
                    LIMIT 1
                    `,
                    [values.phone]
                );

            if (phoneRows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message:
                        "Phone number is already used by another staff member."
                });
            }
        }


        const [result] =
            await pool.promise().query(
                `
                INSERT INTO staff
                (
                    name,
                    branch_id,
                    phone,
                    is_active
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    values.name,
                    values.branchId,
                    values.phone,
                    values.isActive
                ]
            );


        return res.status(201).json({

            success: true,

            message:
                "Staff added successfully.",

            staffId:
                result.insertId
        });

    } catch (error) {

        console.error(
            "CREATE STAFF ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to add staff.",
            error: error.message
        });
    }
};



// =========================================================
// UPDATE STAFF
// =========================================================

const updateStaff = async (req, res) => {

    try {

        const staffId =
            req.params.id;


        const values =
            await validateStaffInput(
                req.body
            );


        if (values.error) {

            return res.status(400).json({
                success: false,
                message: values.error
            });
        }


        const [staffRows] =
            await pool.promise().query(
                `
                SELECT id
                FROM staff
                WHERE id = ?
                LIMIT 1
                `,
                [staffId]
            );


        if (staffRows.length === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "Staff member not found."
            });
        }


        if (values.phone) {
            const [phoneRows] =
                await pool.promise().query(
                    `
                    SELECT id
                    FROM staff
                    WHERE phone = ?
                    AND id != ?
                    LIMIT 1
                    `,
                    [
                        values.phone,
                        staffId
                    ]
                );

            if (phoneRows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message:
                        "Phone number is already used by another staff member."
                });
            }
        }


        await pool.promise().query(
            `
            UPDATE staff
            SET
                name = ?,
                branch_id = ?,
                phone = ?,
                is_active = ?
            WHERE id = ?
            `,
            [
                values.name,
                values.branchId,
                values.phone,
                values.isActive,
                staffId
            ]
        );


        return res.status(200).json({

            success: true,

            message:
                "Staff updated successfully."
        });

    } catch (error) {

        console.error(
            "UPDATE STAFF ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update staff.",
            error: error.message
        });
    }
};



// =========================================================
// DELETE STAFF
// =========================================================

const deleteStaff = async (req, res) => {

    try {

        const staffId =
            req.params.id;


        const [rows] =
            await pool.promise().query(
                `
                SELECT id
                FROM staff
                WHERE id = ?
                LIMIT 1
                `,
                [staffId]
            );


        if (rows.length === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "Staff member not found."
            });
        }


        const [bookingRows] =
            await pool.promise().query(
                `
                SELECT id
                FROM bookings
                WHERE staff_id = ?
                LIMIT 1
                `,
                [staffId]
            );


        if (bookingRows.length > 0) {

            return res.status(409).json({
                success: false,
                message:
                    "This staff member cannot be deleted because booking history exists. Set the staff status to Inactive instead."
            });
        }


        await pool.promise().query(
            `
            DELETE FROM staff
            WHERE id = ?
            `,
            [staffId]
        );


        return res.status(200).json({

            success: true,

            message:
                "Staff deleted successfully."
        });

    } catch (error) {

        console.error(
            "DELETE STAFF ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to delete staff.",
            error: error.message
        });
    }
};



// =========================================================
// EXPORTS
// =========================================================

module.exports = {
    getAllStaff,
    getStaffById,
    getStaffByBranch,
    createStaff,
    updateStaff,
    deleteStaff
};