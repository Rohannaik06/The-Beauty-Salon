const express = require("express");
const multer = require("multer");
const path = require("path");

const router = express.Router();

const {
    getAllOffers,
    getOfferById,
    createOffer,
    updateOffer,
    deleteOffer
} = require("../controllers/offerController");


const storage = multer.memoryStorage();


const fileFilter = (req, file, cb) => {
    const extension = path
        .extname(file.originalname)
        .toLowerCase();

    const allowedExtensions = [
        ".jpg",
        ".jpeg"
    ];

    if (allowedExtensions.includes(extension)) {
        cb(null, true);
    } else {
        cb(
            new Error(
                "Only JPG and JPEG images are allowed."
            )
        );
    }
};


const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});


router.get(
    "/",
    getAllOffers
);


router.get(
    "/:id",
    getOfferById
);


router.post(
    "/",
    upload.single("image"),
    createOffer
);


router.put(
    "/:id",
    upload.single("image"),
    updateOffer
);


router.delete(
    "/:id",
    deleteOffer
);


module.exports = router;