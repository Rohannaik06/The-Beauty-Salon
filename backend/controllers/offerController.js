const pool = require("../config/database");
const fs = require("fs");
const path = require("path");

const db = pool.promise();

const offersDirectory = path.resolve(
    __dirname,
    "../../frontend/assets/images/offers"
);


if (!fs.existsSync(offersDirectory)) {
    fs.mkdirSync(offersDirectory, { recursive: true });
}


const dayFileName = (day) => {
    return `${day.toLowerCase()}.jpg`;
};


const getAllOffers = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                id,
                day,
                image,
                status,
                created_at
            FROM offer_images
            ORDER BY FIELD(
                day,
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
                'Sunday'
            )
        `);

        res.json(rows);
    } catch (error) {
        console.error("Get Offers Error:", error);

        res.status(500).json({
            message: "Failed to fetch offers"
        });
    }
};


const getOfferById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            `
            SELECT
                id,
                day,
                image,
                status,
                created_at
            FROM offer_images
            WHERE id = ?
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Offer not found"
            });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error("Get Offer Error:", error);

        res.status(500).json({
            message: "Failed to fetch offer"
        });
    }
};


const createOffer = async (req, res) => {
    try {
        const { day, status } = req.body;

        if (!day) {
            return res.status(400).json({
                message: "Day is required"
            });
        }

        if (!req.file) {
            return res.status(400).json({
                message: "Offer image is required"
            });
        }

        const validDays = [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday"
        ];

        if (!validDays.includes(day)) {
            return res.status(400).json({
                message: "Invalid day"
            });
        }

        const [existingRows] = await db.query(
            `
            SELECT id
            FROM offer_images
            WHERE day = ?
            `,
            [day]
        );

        if (existingRows.length > 0) {
            return res.status(409).json({
                message: `An offer already exists for ${day}`
            });
        }

        const finalStatus =
            String(status || "ACTIVE").toUpperCase() === "INACTIVE"
                ? "INACTIVE"
                : "ACTIVE";

        const fileName = dayFileName(day);

        const filePath = path.join(
            offersDirectory,
            fileName
        );

        fs.writeFileSync(
            filePath,
            req.file.buffer
        );

        const [result] = await db.query(
            `
            INSERT INTO offer_images
            (
                day,
                image,
                status
            )
            VALUES (?, ?, ?)
            `,
            [
                day,
                fileName,
                finalStatus
            ]
        );

        res.status(201).json({
            message: "Offer image added successfully",
            id: result.insertId,
            image: fileName
        });
    } catch (error) {
        console.error("Create Offer Error:", error);

        res.status(500).json({
            message: "Failed to create offer"
        });
    }
};


const updateOffer = async (req, res) => {
    try {
        const { id } = req.params;
        const { day, status } = req.body;

        if (!day) {
            return res.status(400).json({
                message: "Day is required"
            });
        }

        const validDays = [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday"
        ];

        if (!validDays.includes(day)) {
            return res.status(400).json({
                message: "Invalid day"
            });
        }

        const [existingRows] = await db.query(
            `
            SELECT
                id,
                day,
                image
            FROM offer_images
            WHERE id = ?
            `,
            [id]
        );

        if (existingRows.length === 0) {
            return res.status(404).json({
                message: "Offer not found"
            });
        }

        const existingOffer = existingRows[0];

        const [duplicateRows] = await db.query(
            `
            SELECT id
            FROM offer_images
            WHERE day = ?
            AND id != ?
            `,
            [
                day,
                id
            ]
        );

        if (duplicateRows.length > 0) {
            return res.status(409).json({
                message: `An offer already exists for ${day}`
            });
        }

        const finalStatus =
            String(status || "ACTIVE").toUpperCase() === "INACTIVE"
                ? "INACTIVE"
                : "ACTIVE";

        const newFileName = dayFileName(day);

        const oldFilePath = path.join(
            offersDirectory,
            existingOffer.image
        );

        const newFilePath = path.join(
            offersDirectory,
            newFileName
        );


        if (req.file) {
            fs.writeFileSync(
                newFilePath,
                req.file.buffer
            );

            if (
                existingOffer.image !== newFileName &&
                fs.existsSync(oldFilePath)
            ) {
                fs.unlinkSync(oldFilePath);
            }
        } else if (
            existingOffer.image !== newFileName &&
            fs.existsSync(oldFilePath)
        ) {
            fs.renameSync(
                oldFilePath,
                newFilePath
            );
        }


        await db.query(
            `
            UPDATE offer_images
            SET
                day = ?,
                image = ?,
                status = ?
            WHERE id = ?
            `,
            [
                day,
                newFileName,
                finalStatus,
                id
            ]
        );

        res.json({
            message: "Offer image updated successfully",
            image: newFileName
        });
    } catch (error) {
        console.error("Update Offer Error:", error);

        res.status(500).json({
            message: "Failed to update offer"
        });
    }
};


const deleteOffer = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            `
            SELECT image
            FROM offer_images
            WHERE id = ?
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Offer not found"
            });
        }

        const imageName = rows[0].image;

        const imagePath = path.join(
            offersDirectory,
            imageName
        );

        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        await db.query(
            `
            DELETE FROM offer_images
            WHERE id = ?
            `,
            [id]
        );

        res.json({
            message: "Offer image deleted successfully"
        });
    } catch (error) {
        console.error("Delete Offer Error:", error);

        res.status(500).json({
            message: "Failed to delete offer"
        });
    }
};


module.exports = {
    getAllOffers,
    getOfferById,
    createOffer,
    updateOffer,
    deleteOffer
};