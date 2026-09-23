const fs = require("fs");
const path = require("path");

const pool = require("../config/database");

const db = pool.promise();

const DAYS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
];

const OFFERS_IMAGE_DIRECTORY = path.join(
    __dirname,
    "../../frontend/assets/images/offers"
);


function ensureImageDirectory() {
    if (!fs.existsSync(OFFERS_IMAGE_DIRECTORY)) {
        fs.mkdirSync(OFFERS_IMAGE_DIRECTORY, {
            recursive: true
        });
    }
}


function deleteImageFile(filename) {
    if (!filename) {
        return;
    }

    const safeFilename = path.basename(filename);

    const filePath = path.join(
        OFFERS_IMAGE_DIRECTORY,
        safeFilename
    );

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}


/* =========================================================
   GET ALL OFFERS
========================================================= */

const getAllOffers = async (req, res) => {
    try {
        const [rows] = await db.query(
            `
            SELECT
                id,
                day,
                image,
                status,
                created_at
            FROM offer_images
            ORDER BY FIELD(
                day,
                'Sunday',
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday'
            )
            `
        );

        return res.status(200).json({
            success: true,
            count: rows.length,
            data: rows
        });

    } catch (error) {

        console.error(
            "❌ Get Offers Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch offers.",
            error: error.message
        });
    }
};


/* =========================================================
   GET TODAY'S OFFER
========================================================= */

const getTodayOffer = async (req, res) => {
    try {

        const today = DAYS[new Date().getDay()];

        const [rows] = await db.query(
            `
            SELECT
                id,
                day,
                image,
                status,
                created_at
            FROM offer_images
            WHERE day = ?
              AND status = 'ACTIVE'
            LIMIT 1
            `,
            [today]
        );


        if (rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: `No active offer found for ${today}.`,
                day: today
            });

        }


        return res.status(200).json({
            success: true,
            day: today,
            data: rows[0]
        });


    } catch (error) {

        console.error(
            "❌ Get Today's Offer Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch today's offer.",
            error: error.message
        });
    }
};


/* =========================================================
   GET OFFER BY DAY
========================================================= */

const getOfferByDay = async (req, res) => {
    try {

        const day = String(
            req.params.day || ""
        ).trim();


        if (!DAYS.includes(day)) {

            return res.status(400).json({
                success: false,
                message: "Invalid day."
            });

        }


        const [rows] = await db.query(
            `
            SELECT
                id,
                day,
                image,
                status,
                created_at
            FROM offer_images
            WHERE day = ?
            LIMIT 1
            `,
            [day]
        );


        if (rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Offer not found."
            });

        }


        return res.status(200).json({
            success: true,
            data: rows[0]
        });


    } catch (error) {

        console.error(
            "❌ Get Offer By Day Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch offer.",
            error: error.message
        });
    }
};


/* =========================================================
   SAVE / UPDATE OFFER
========================================================= */

const saveOffer = async (req, res) => {

    let uploadedFilename = null;

    try {

        const day = String(
            req.params.day || ""
        ).trim();


        if (!DAYS.includes(day)) {

            return res.status(400).json({
                success: false,
                message: "Invalid day."
            });

        }


        if (!req.file) {

            return res.status(400).json({
                success: false,
                message: "Please select an image."
            });

        }


        ensureImageDirectory();

        uploadedFilename = req.file.filename;


        const [existingRows] = await db.query(
            `
            SELECT
                id,
                image
            FROM offer_images
            WHERE day = ?
            LIMIT 1
            `,
            [day]
        );


        if (existingRows.length > 0) {

            const existingImage =
                existingRows[0].image;


            await db.query(
                `
                UPDATE offer_images
                SET
                    image = ?,
                    status = 'ACTIVE'
                WHERE day = ?
                `,
                [
                    uploadedFilename,
                    day
                ]
            );


            if (
                existingImage &&
                existingImage !== uploadedFilename
            ) {

                deleteImageFile(existingImage);

            }


        } else {

            await db.query(
                `
                INSERT INTO offer_images
                (
                    day,
                    image,
                    status
                )
                VALUES
                (
                    ?,
                    ?,
                    'ACTIVE'
                )
                `,
                [
                    day,
                    uploadedFilename
                ]
            );

        }


        return res.status(200).json({
            success: true,
            message: `${day} offer image saved successfully.`,
            data: {
                day: day,
                image: uploadedFilename,
                status: "ACTIVE"
            }
        });


    } catch (error) {

        if (uploadedFilename) {
            deleteImageFile(uploadedFilename);
        }


        console.error(
            "❌ Save Offer Error:",
            error
        );


        return res.status(500).json({
            success: false,
            message: "Failed to save offer.",
            error: error.message
        });
    }
};


/* =========================================================
   DELETE OFFER
========================================================= */

const deleteOffer = async (req, res) => {

    try {

        const day = String(
            req.params.day || ""
        ).trim();


        if (!DAYS.includes(day)) {

            return res.status(400).json({
                success: false,
                message: "Invalid day."
            });

        }


        const [rows] = await db.query(
            `
            SELECT
                image
            FROM offer_images
            WHERE day = ?
            LIMIT 1
            `,
            [day]
        );


        if (rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "No offer image found for this day."
            });

        }


        await db.query(
            `
            DELETE FROM offer_images
            WHERE day = ?
            `,
            [day]
        );


        deleteImageFile(
            rows[0].image
        );


        return res.status(200).json({
            success: true,
            message: `${day} offer image deleted successfully.`
        });


    } catch (error) {

        console.error(
            "❌ Delete Offer Error:",
            error
        );


        return res.status(500).json({
            success: false,
            message: "Failed to delete offer.",
            error: error.message
        });
    }
};


/* =========================================================
   EXPORT
========================================================= */

module.exports = {
    getAllOffers,
    getTodayOffer,
    getOfferByDay,
    saveOffer,
    deleteOffer
};