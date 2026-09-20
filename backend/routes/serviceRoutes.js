const express = require("express");

const router = express.Router();


const {

    getAllServices,

    getServiceById,

    createService,

    updateService,

    deleteService

} = require("../controllers/serviceController");


// =====================================================
// SERVICES ROUTES
// =====================================================


// GET ALL SERVICES
router.get(
    "/",
    getAllServices
);


// GET SINGLE SERVICE
router.get(
    "/:id",
    getServiceById
);


// ADD SERVICE
router.post(
    "/",
    createService
);


// UPDATE SERVICE
router.put(
    "/:id",
    updateService
);


// DELETE SERVICE
router.delete(
    "/:id",
    deleteService
);


module.exports = router;