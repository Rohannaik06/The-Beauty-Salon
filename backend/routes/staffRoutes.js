const express = require("express");

const router = express.Router();

const {
    getAllStaff,
    getStaffById,
    getStaffByBranch,
    createStaff,
    updateStaff,
    deleteStaff
} = require("../controllers/staffController");


// =====================================================
// ALL STAFF
// =====================================================

router.get(
    "/",
    getAllStaff
);


// =====================================================
// STAFF BY BRANCH
// IMPORTANT: MUST BE BEFORE /:id
// =====================================================

router.get(
    "/branch/:branchId",
    getStaffByBranch
);


// =====================================================
// SINGLE STAFF
// =====================================================

router.get(
    "/:id",
    getStaffById
);


// =====================================================
// CREATE STAFF
// =====================================================

router.post(
    "/",
    createStaff
);


// =====================================================
// UPDATE STAFF
// =====================================================

router.put(
    "/:id",
    updateStaff
);


// =====================================================
// DELETE STAFF
// =====================================================

router.delete(
    "/:id",
    deleteStaff
);


module.exports = router;