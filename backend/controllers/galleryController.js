const pool = require("../config/database");
const fs = require("fs");
const path = require("path");

const db = pool.promise();

const getAllGalleryImages = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                g.id,
                g.title,
                g.image,
                g.category,
                g.branch_id,
                b.name AS branch,
                g.status,
                g.featured,
                g.created_at
            FROM gallery g
            LEFT JOIN branches b
                ON g.branch_id = b.id
            ORDER BY g.id DESC
        `);

        res.json({
            success: true,
            count: rows.length,
            data: rows
        });
    } catch (error) {
        console.error("Get Gallery Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch gallery images",
            error: error.message
        });
    }
};

const getGalleryImageById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(`
            SELECT
                g.id,
                g.title,
                g.image,
                g.category,
                g.branch_id,
                b.name AS branch,
                g.status,
                g.featured,
                g.created_at
            FROM gallery g
            LEFT JOIN branches b
                ON g.branch_id = b.id
            WHERE g.id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Gallery image not found"
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error("Get Gallery Image Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch gallery image",
            error: error.message
        });
    }
};

const createGalleryImage = async (req, res) => {
    try {
        const {
            title,
            category,
            branch_id,
            status,
            featured
        } = req.body;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload an image"
            });
        }

        if (branch_id) {
            const [branchRows] = await db.query(
                "SELECT id FROM branches WHERE id = ?",
                [branch_id]
            );

            if (branchRows.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Selected branch does not exist"
                });
            }
        }

        const imagePath =
            `/uploads/gallery/${req.file.filename}`;

        const finalStatus =
            status === "INACTIVE"
                ? "INACTIVE"
                : "ACTIVE";

        const finalFeatured =
            featured === true ||
            featured === "true" ||
            featured === 1 ||
            featured === "1"
                ? 1
                : 0;

        const [result] = await db.query(`
            INSERT INTO gallery
            (
                title,
                image,
                category,
                branch_id,
                status,
                featured
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            title || null,
            imagePath,
            category || null,
            branch_id || null,
            finalStatus,
            finalFeatured
        ]);

        const [rows] = await db.query(`
            SELECT
                g.id,
                g.title,
                g.image,
                g.category,
                g.branch_id,
                b.name AS branch,
                g.status,
                g.featured,
                g.created_at
            FROM gallery g
            LEFT JOIN branches b
                ON g.branch_id = b.id
            WHERE g.id = ?
        `, [result.insertId]);

        res.status(201).json({
            success: true,
            message: "Gallery image added successfully",
            data: rows[0]
        });
    } catch (error) {
        console.error("Create Gallery Error:", error);

        if (req.file) {
            const uploadedFile = path.join(
                __dirname,
                "../uploads/gallery",
                req.file.filename
            );

            if (fs.existsSync(uploadedFile)) {
                fs.unlinkSync(uploadedFile);
            }
        }

        res.status(500).json({
            success: false,
            message: "Failed to add gallery image",
            error: error.message
        });
    }
};

const updateGalleryImage = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            title,
            category,
            branch_id,
            status,
            featured
        } = req.body;

        const [existingRows] = await db.query(
            "SELECT * FROM gallery WHERE id = ?",
            [id]
        );

        if (existingRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Gallery image not found"
            });
        }

        const existingImage = existingRows[0].image;

        if (branch_id) {
            const [branchRows] = await db.query(
                "SELECT id FROM branches WHERE id = ?",
                [branch_id]
            );

            if (branchRows.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Selected branch does not exist"
                });
            }
        }

        let imagePath = existingImage;

        if (req.file) {
            imagePath =
                `/uploads/gallery/${req.file.filename}`;
        }

        const finalStatus =
            status === "INACTIVE"
                ? "INACTIVE"
                : "ACTIVE";

        const finalFeatured =
            featured === true ||
            featured === "true" ||
            featured === 1 ||
            featured === "1"
                ? 1
                : 0;

        await db.query(`
            UPDATE gallery
            SET
                title = ?,
                image = ?,
                category = ?,
                branch_id = ?,
                status = ?,
                featured = ?
            WHERE id = ?
        `, [
            title || null,
            imagePath,
            category || null,
            branch_id || null,
            finalStatus,
            finalFeatured,
            id
        ]);

        if (req.file && existingImage) {
            const oldImagePath = existingImage.startsWith("/")
                ? existingImage.substring(1)
                : existingImage;

            const oldFile = path.join(
                __dirname,
                "..",
                oldImagePath
            );

            if (fs.existsSync(oldFile)) {
                fs.unlinkSync(oldFile);
            }
        }

        const [rows] = await db.query(`
            SELECT
                g.id,
                g.title,
                g.image,
                g.category,
                g.branch_id,
                b.name AS branch,
                g.status,
                g.featured,
                g.created_at
            FROM gallery g
            LEFT JOIN branches b
                ON g.branch_id = b.id
            WHERE g.id = ?
        `, [id]);

        res.json({
            success: true,
            message: "Gallery image updated successfully",
            data: rows[0]
        });
    } catch (error) {
        console.error("Update Gallery Error:", error);

        if (req.file) {
            const uploadedFile = path.join(
                __dirname,
                "../uploads/gallery",
                req.file.filename
            );

            if (fs.existsSync(uploadedFile)) {
                fs.unlinkSync(uploadedFile);
            }
        }

        res.status(500).json({
            success: false,
            message: "Failed to update gallery image",
            error: error.message
        });
    }
};

const deleteGalleryImage = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            "SELECT image FROM gallery WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Gallery image not found"
            });
        }

        const imagePath = rows[0].image;

        await db.query(
            "DELETE FROM gallery WHERE id = ?",
            [id]
        );

        if (imagePath) {
            const cleanPath = imagePath.startsWith("/")
                ? imagePath.substring(1)
                : imagePath;

            const imageFile = path.join(
                __dirname,
                "..",
                cleanPath
            );

            if (fs.existsSync(imageFile)) {
                fs.unlinkSync(imageFile);
            }
        }

        res.json({
            success: true,
            message: "Gallery image deleted successfully"
        });
    } catch (error) {
        console.error("Delete Gallery Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete gallery image",
            error: error.message
        });
    }
};

module.exports = {
    getAllGalleryImages,
    getGalleryImageById,
    createGalleryImage,
    updateGalleryImage,
    deleteGalleryImage
};