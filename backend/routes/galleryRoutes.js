const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

const {
    getAllGalleryImages,
    getGalleryImageById,
    createGalleryImage,
    updateGalleryImage,
    deleteGalleryImage
} = require("../controllers/galleryController");

const uploadDirectory = path.join(
    __dirname,
    "../uploads/gallery"
);

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, {
        recursive: true
    });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },

    filename: (req, file, cb) => {
        const extension = path
            .extname(file.originalname)
            .toLowerCase();

        const originalName = path
            .basename(file.originalname, extension)
            .replace(/[^a-zA-Z0-9-_]/g, "-")
            .replace(/-+/g, "-")
            .toLowerCase();

        const filename =
            `${Date.now()}-${originalName}${extension}`;

        cb(null, filename);
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

    if (allowedExtensions.includes(extension)) {
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
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

router.get("/", getAllGalleryImages);

router.get("/:id", getGalleryImageById);

router.post(
    "/",
    upload.single("image"),
    createGalleryImage
);

router.put(
    "/:id",
    upload.single("image"),
    updateGalleryImage
);

router.delete(
    "/:id",
    deleteGalleryImage
);

module.exports = router;