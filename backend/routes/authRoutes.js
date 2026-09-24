const express = require("express");

const router = express.Router();

const {
    registerCustomer,
    loginCustomer,
    forgotPassword,
    updateCustomerProfile
} = require("../controllers/authController");


/* ============================================
   CUSTOMER REGISTRATION
============================================ */

router.post(
    "/register",
    registerCustomer
);


/* ============================================
   CUSTOMER LOGIN
============================================ */

router.post(
    "/login",
    loginCustomer
);


/* ============================================
   CUSTOMER FORGOT PASSWORD
============================================ */

router.post(
    "/forgot-password",
    forgotPassword
);


/* ============================================
   CUSTOMER PROFILE UPDATE
============================================ */

router.put(
    "/profile",
    updateCustomerProfile
);


module.exports = router;