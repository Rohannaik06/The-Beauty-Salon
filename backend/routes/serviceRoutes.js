const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();


// =====================================================
// CONTROLLERS
// =====================================================

const {
    getAllServices,
    getServiceById,
    createService,
    updateService,
    deleteService,
    activateService
} = require("../controllers/serviceController");


// =====================================================
// SERVICE IMAGE DIRECTORY
// =====================================================

const SERVICE_IMAGE_DIR = path.resolve(
    __dirname,
    "../../frontend/assets/images/services"
);


// Create directory if not exists
fs.mkdirSync(
    SERVICE_IMAGE_DIR,
    {
        recursive: true
    }
);


// =====================================================
// MULTER STORAGE
// =====================================================

const storage =
    multer.diskStorage({

        destination:
            (req, file, cb) => {

                cb(
                    null,
                    SERVICE_IMAGE_DIR
                );

            },


        filename:
            (req, file, cb) => {

                const ext =
                    path.extname(
                        file.originalname
                    ).toLowerCase();


                const base =
                    path
                        .basename(
                            file.originalname,
                            ext
                        )
                        .replace(
                            /[^a-zA-Z0-9-_]/g,
                            "-"
                        )
                        .replace(
                            /-+/g,
                            "-"
                        )
                        .replace(
                            /^-|-$/g,
                            ""
                        )
                        .toLowerCase();


                const uniqueName =
                    `${Date.now()}-${Math.round(
                        Math.random() * 1e9
                    )}-${base || "service"}${ext}`;


                cb(
                    null,
                    uniqueName
                );

            }

    });


// =====================================================
// MULTER UPLOAD
// =====================================================

const upload =
    multer({

        storage,

        limits: {

            fileSize:
                5 * 1024 * 1024

        },


        fileFilter:
            (req, file, cb) => {

                const allowed = [

                    "image/jpeg",

                    "image/png",

                    "image/webp",

                    "image/gif"

                ];


                if (
                    !allowed.includes(
                        file.mimetype
                    )
                ) {

                    return cb(
                        new Error(
                            "Only JPG, PNG, WEBP and GIF images are allowed."
                        )
                    );

                }


                cb(
                    null,
                    true
                );

            }

    });


// =====================================================
// GET ALL SERVICES
// =====================================================

router.get(
    "/",
    getAllServices
);


// =====================================================
// GET SINGLE SERVICE
// =====================================================

router.get(
    "/:id",
    getServiceById
);


// =====================================================
// CREATE SERVICE
// =====================================================

router.post(
    "/",
    upload.single("service_image"),
    createService
);


// =====================================================
// UPDATE SERVICE
// =====================================================

router.put(
    "/:id",
    upload.single("service_image"),
    updateService
);


// =====================================================
// ACTIVATE SERVICE
// IMPORTANT:
// Keep this BEFORE DELETE route.
// =====================================================

router.patch(
    "/:id/activate",
    activateService
);


// =====================================================
// DELETE / DEACTIVATE SERVICE
// =====================================================

router.delete(
    "/:id",
    deleteService
);


// =====================================================
// MULTER / IMAGE ERROR HANDLER
// =====================================================

router.use(
    (error, req, res, next) => {

        // File too large
        if (
            error instanceof
            multer.MulterError
        ) {

            if (
                error.code ===
                "LIMIT_FILE_SIZE"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Service image must be 5 MB or smaller."

                });

            }


            return res.status(400).json({

                success: false,

                message:
                    `Image upload error: ${error.message}`

            });

        }


        // Other image errors
        if (error) {

            return res.status(400).json({

                success: false,

                message:
                    error.message ||
                    "Image upload failed."

            });

        }


        next();

    }
);


module.exports = router;