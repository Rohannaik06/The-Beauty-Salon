const express = require("express");

const router = express.Router();

const {
    getAllStaff,
    getStaffById,
    createStaff,
    updateStaff,
    deleteStaff
} = require("../controllers/staffController");


// GET ALL STAFF
router.get("/", getAllStaff);


// GET STAFF BY ID
router.get("/:id", getStaffById);


// CREATE STAFF
router.post("/", createStaff);


// UPDATE STAFF
router.put("/:id", updateStaff);


// DELETE STAFF
router.delete("/:id", deleteStaff);


module.exports = router;