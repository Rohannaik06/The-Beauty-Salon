const pool = require("../config/database");


// =====================================================
// GET ALL BRANCHES
// =====================================================

const getAllBranches = async (req, res) => {

    try {

        const [rows] = await pool.promise().query(`
            SELECT
                id,
                name,
                address,
                phone,
                email,
                opening_time,
                closing_time,
                is_active,
                created_at
            FROM branches
            ORDER BY id ASC
        `);

        res.json({
            success: true,
            count: rows.length,
            data: rows
        });

    } catch (error) {

        console.error("GET BRANCHES ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch branches.",
            error: error.message
        });

    }

};


// =====================================================
// GET SINGLE BRANCH
// =====================================================

const getBranchById = async (req, res) => {

    try {

        const [rows] = await pool.promise().query(`
            SELECT
                id,
                name,
                address,
                phone,
                email,
                opening_time,
                closing_time,
                is_active,
                created_at
            FROM branches
            WHERE id = ?
            LIMIT 1
        `, [req.params.id]);


        if (rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Branch not found."
            });

        }


        res.json({
            success: true,
            data: rows[0]
        });

    } catch (error) {

        console.error("GET BRANCH ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch branch.",
            error: error.message
        });

    }

};


// =====================================================
// ADD BRANCH
// =====================================================

const createBranch = async (req, res) => {

    try {

        const {
            name,
            address,
            phone,
            email,
            opening_time,
            closing_time,
            is_active
        } = req.body;


        if (!name || !address) {

            return res.status(400).json({
                success: false,
                message: "Branch name and address are required."
            });

        }


        // -------------------------------------------------
        // FIND SMALLEST AVAILABLE ID
        // -------------------------------------------------

        const [idRows] = await pool.promise().query(`
            SELECT
                COALESCE(
                    (
                        SELECT MIN(t1.id + 1)
                        FROM branches t1
                        LEFT JOIN branches t2
                            ON t2.id = t1.id + 1
                        WHERE t2.id IS NULL
                    ),
                    1
                ) AS next_id
        `);


        let nextId = Number(idRows[0].next_id);


        // -------------------------------------------------
        // IF NO GAP EXISTS, USE MAX ID + 1
        // -------------------------------------------------

        const [maxRows] = await pool.promise().query(`
            SELECT
                COALESCE(MAX(id), 0) AS max_id
            FROM branches
        `);


        const maxId = Number(maxRows[0].max_id);


        if (nextId <= maxId) {

            nextId = maxId + 1;

        }


        // -------------------------------------------------
        // INSERT BRANCH WITH OUR ID
        // -------------------------------------------------

        const [result] = await pool.promise().query(`
            INSERT INTO branches
            (
                id,
                name,
                address,
                phone,
                email,
                opening_time,
                closing_time,
                is_active
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [

            nextId,
            name.trim(),
            address.trim(),
            phone || null,
            email || null,
            opening_time || "09:00:00",
            closing_time || "21:00:00",
            is_active === 0 ? 0 : 1

        ]);


        res.status(201).json({

            success: true,

            message: "Branch added successfully.",

            branchId: result.insertId || nextId

        });

    } catch (error) {

        console.error("ADD BRANCH ERROR:", error);

        res.status(500).json({

            success: false,

            message: "Failed to add branch.",

            error: error.message

        });

    }

};


// =====================================================
// UPDATE BRANCH
// =====================================================

const updateBranch = async (req, res) => {

    try {

        const {
            name,
            address,
            phone,
            email,
            opening_time,
            closing_time,
            is_active
        } = req.body;


        if (!name || !address) {

            return res.status(400).json({

                success: false,

                message:
                    "Branch name and address are required."

            });

        }


        const [result] = await pool.promise().query(`
            UPDATE branches
            SET
                name = ?,
                address = ?,
                phone = ?,
                email = ?,
                opening_time = ?,
                closing_time = ?,
                is_active = ?
            WHERE id = ?
        `, [

            name.trim(),
            address.trim(),
            phone || null,
            email || null,
            opening_time || "09:00:00",
            closing_time || "21:00:00",
            is_active === 0 ? 0 : 1,
            req.params.id

        ]);


        if (result.affectedRows === 0) {

            return res.status(404).json({

                success: false,

                message: "Branch not found."

            });

        }


        res.json({

            success: true,

            message: "Branch updated successfully."

        });

    } catch (error) {

        console.error("UPDATE BRANCH ERROR:", error);

        res.status(500).json({

            success: false,

            message: "Failed to update branch.",

            error: error.message

        });

    }

};


// =====================================================
// DELETE BRANCH
// =====================================================

const deleteBranch = async (req, res) => {

    try {

        const [result] = await pool.promise().query(
            "DELETE FROM branches WHERE id = ?",
            [req.params.id]
        );


        if (result.affectedRows === 0) {

            return res.status(404).json({

                success: false,

                message: "Branch not found."

            });

        }


        res.json({

            success: true,

            message: "Branch deleted successfully."

        });

    } catch (error) {

        console.error("DELETE BRANCH ERROR:", error);

        res.status(409).json({

            success: false,

            message:
                "This branch cannot be deleted because it is linked with existing staff or bookings.",

            error: error.message

        });

    }

};


// =====================================================
// EXPORT CONTROLLERS
// =====================================================

module.exports = {
    getAllBranches,
    getBranchById,
    createBranch,
    updateBranch,
    deleteBranch
};