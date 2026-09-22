const pool = require("../config/database");

// GET ALL STAFF
const getAllStaff = async (req, res) => {
    try {
        const [rows] = await pool.promise().query(`
            SELECT
                s.id,
                s.name,
                s.role,
                s.branch_id,
                b.name AS branch_name,
                s.phone,
                s.email,
                s.is_active,
                s.created_at,

                COUNT(DISTINCT bk.id) AS total_bookings

            FROM staff s

            LEFT JOIN branches b
                ON b.id = s.branch_id

            LEFT JOIN bookings bk
                ON bk.staff_id = s.id

            GROUP BY
                s.id,
                s.name,
                s.role,
                s.branch_id,
                b.name,
                s.phone,
                s.email,
                s.is_active,
                s.created_at

            ORDER BY s.id ASC
        `);

        const staff = rows.map(member => ({
            id: member.id,
            name: member.name,
            role: member.role,
            branch_id: member.branch_id,
            branch_name: member.branch_name || "—",
            phone: member.phone,
            email: member.email,
            is_active: Number(member.is_active) === 1,
            total_bookings: Number(member.total_bookings || 0),
            created_at: member.created_at
        }));

        return res.status(200).json({
            success: true,
            count: staff.length,
            data: staff
        });

    } catch (error) {
        console.error("GET ALL STAFF ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch staff.",
            error: error.message
        });
    }
};


// GET SINGLE STAFF
const getStaffById = async (req, res) => {
    try {
        const [rows] = await pool.promise().query(`
            SELECT
                s.id,
                s.name,
                s.role,
                s.branch_id,
                b.name AS branch_name,
                s.phone,
                s.email,
                s.is_active,
                s.created_at,

                COUNT(DISTINCT bk.id) AS total_bookings

            FROM staff s

            LEFT JOIN branches b
                ON b.id = s.branch_id

            LEFT JOIN bookings bk
                ON bk.staff_id = s.id

            WHERE s.id = ?

            GROUP BY
                s.id,
                s.name,
                s.role,
                s.branch_id,
                b.name,
                s.phone,
                s.email,
                s.is_active,
                s.created_at

            LIMIT 1
        `, [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Staff member not found."
            });
        }

        const member = rows[0];

        return res.status(200).json({
            success: true,
            data: {
                id: member.id,
                name: member.name,
                role: member.role,
                branch_id: member.branch_id,
                branch_name: member.branch_name || "—",
                phone: member.phone,
                email: member.email,
                is_active: Number(member.is_active) === 1,
                total_bookings: Number(member.total_bookings || 0),
                created_at: member.created_at
            }
        });

    } catch (error) {
        console.error("GET STAFF ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch staff.",
            error: error.message
        });
    }
};


// CREATE STAFF
const createStaff = async (req, res) => {
    try {
        const {
            name,
            role,
            branch_id,
            phone,
            email,
            is_active
        } = req.body;

        if (!name || !role || !branch_id || !phone || !email) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, role, branch, phone and email are required."
            });
        }

        const cleanName = String(name).trim();
        const cleanRole = String(role).trim();
        const cleanPhone = String(phone).trim();
        const cleanEmail = String(email).trim().toLowerCase();
        const cleanBranchId = Number(branch_id);

        if (!cleanName) {
            return res.status(400).json({
                success: false,
                message: "Staff name is required."
            });
        }

        if (!Number.isInteger(cleanBranchId) || cleanBranchId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid branch is required."
            });
        }

        const [branchRows] = await pool.promise().query(
            `
                SELECT id
                FROM branches
                WHERE id = ?
                LIMIT 1
            `,
            [cleanBranchId]
        );

        if (branchRows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Selected branch does not exist."
            });
        }

        const [emailRows] = await pool.promise().query(
            `
                SELECT id
                FROM staff
                WHERE LOWER(email) = ?
                LIMIT 1
            `,
            [cleanEmail]
        );

        if (emailRows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email is already registered for another staff member."
            });
        }

        const [phoneRows] = await pool.promise().query(
            `
                SELECT id
                FROM staff
                WHERE phone = ?
                LIMIT 1
            `,
            [cleanPhone]
        );

        if (phoneRows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Phone number is already registered for another staff member."
            });
        }

        const [result] = await pool.promise().query(
            `
                INSERT INTO staff
                (
                    name,
                    role,
                    branch_id,
                    phone,
                    email,
                    is_active
                )
                VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                cleanName,
                cleanRole,
                cleanBranchId,
                cleanPhone,
                cleanEmail,
                is_active === false || is_active === 0 ? 0 : 1
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Staff added successfully.",
            staffId: result.insertId
        });

    } catch (error) {
        console.error("CREATE STAFF ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to add staff.",
            error: error.message
        });
    }
};


// UPDATE STAFF
const updateStaff = async (req, res) => {
    try {
        const {
            name,
            role,
            branch_id,
            phone,
            email,
            is_active
        } = req.body;

        const staffId = req.params.id;

        if (!name || !role || !branch_id || !phone || !email) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, role, branch, phone and email are required."
            });
        }

        const cleanName = String(name).trim();
        const cleanRole = String(role).trim();
        const cleanPhone = String(phone).trim();
        const cleanEmail = String(email).trim().toLowerCase();
        const cleanBranchId = Number(branch_id);

        const [staffRows] = await pool.promise().query(
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
                message: "Staff member not found."
            });
        }

        if (!Number.isInteger(cleanBranchId) || cleanBranchId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid branch is required."
            });
        }

        const [branchRows] = await pool.promise().query(
            `
                SELECT id
                FROM branches
                WHERE id = ?
                LIMIT 1
            `,
            [cleanBranchId]
        );

        if (branchRows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Selected branch does not exist."
            });
        }

        const [emailRows] = await pool.promise().query(
            `
                SELECT id
                FROM staff
                WHERE LOWER(email) = ?
                AND id != ?
                LIMIT 1
            `,
            [cleanEmail, staffId]
        );

        if (emailRows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email is already used by another staff member."
            });
        }

        const [phoneRows] = await pool.promise().query(
            `
                SELECT id
                FROM staff
                WHERE phone = ?
                AND id != ?
                LIMIT 1
            `,
            [cleanPhone, staffId]
        );

        if (phoneRows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Phone number is already used by another staff member."
            });
        }

        await pool.promise().query(
            `
                UPDATE staff
                SET
                    name = ?,
                    role = ?,
                    branch_id = ?,
                    phone = ?,
                    email = ?,
                    is_active = ?
                WHERE id = ?
            `,
            [
                cleanName,
                cleanRole,
                cleanBranchId,
                cleanPhone,
                cleanEmail,
                is_active === false || is_active === 0 ? 0 : 1,
                staffId
            ]
        );

        return res.status(200).json({
            success: true,
            message: "Staff updated successfully."
        });

    } catch (error) {
        console.error("UPDATE STAFF ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update staff.",
            error: error.message
        });
    }
};


// DELETE STAFF
const deleteStaff = async (req, res) => {
    try {
        const staffId = req.params.id;

        const [staffRows] = await pool.promise().query(
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
                message: "Staff member not found."
            });
        }

        const [bookingRows] = await pool.promise().query(
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
                    "This staff member cannot be deleted because booking history exists. Set the staff member as inactive instead."
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
            message: "Staff deleted successfully."
        });

    } catch (error) {
        console.error("DELETE STAFF ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete staff.",
            error: error.message
        });
    }
};


module.exports = {
    getAllStaff,
    getStaffById,
    createStaff,
    updateStaff,
    deleteStaff
};