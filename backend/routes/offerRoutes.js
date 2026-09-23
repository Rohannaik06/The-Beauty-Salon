const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

const {
    getAllOffers,
    getOfferByDay,
    saveOffer,
    deleteOffer
} = require("../controllers/offerController");


const uploadDirectory = path.join(
    __dirname,
    "../../frontend/assets/images/offers"
);


if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, {
        recursive: true
    });
}


const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        cb(
            null,
            uploadDirectory
        );
    },


    filename: (req, file, cb) => {

        const day = String(
            req.params.day || "offer"
        )
            .trim()
            .toLowerCase();


        const extension = path
            .extname(file.originalname)
            .toLowerCase();


        cb(
            null,
            `${day}${extension}`
        );
    }

});


const fileFilter = (req, file, cb) => {

    const allowedExtensions = [
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".gif"
    ];


    const extension = path
        .extname(file.originalname)
        .toLowerCase();


    if (
        allowedExtensions.includes(
            extension
        )
    ) {

        cb(null, true);

    } else {

        cb(
            new Error(
                "Only JPG, JPEG, PNG, WEBP and GIF images are allowed."
            )
        );
    }
};


const upload = multer({

    storage: storage,

    fileFilter: fileFilter,

    limits: {
        fileSize: 5 * 1024 * 1024
    }

});


router.get(
    "/",
    getAllOffers
);


router.get(
    "/:day",
    getOfferByDay
);


router.put(
    "/:day",
    upload.single("image"),
    saveOffer
);


router.delete(
    "/:day",
    deleteOffer
);


module.exports = router;