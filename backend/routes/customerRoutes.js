const express = require("express");

const router = express.Router();

const {
    getAllCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer
} = require("../controllers/customerController");


// =====================================================
// GET ALL CUSTOMERS
// GET /api/customers
// =====================================================

router.get(
    "/",
    getAllCustomers
);


// =====================================================
// GET SINGLE CUSTOMER
// GET /api/customers/:id
// =====================================================

router.get(
    "/:id",
    getCustomerById
);


// =====================================================
// CREATE CUSTOMER
// POST /api/customers
// =====================================================

router.post(
    "/",
    createCustomer
);


// =====================================================
// UPDATE CUSTOMER
// PUT /api/customers/:id
// =====================================================

router.put(
    "/:id",
    updateCustomer
);


// =====================================================
// DELETE CUSTOMER
// DELETE /api/customers/:id
// =====================================================

router.delete(
    "/:id",
    deleteCustomer
);


module.exports = router;