const express = require("express");

const router = express.Router();

const {
    getAllBookings,
    getBookingById,
    createBooking,
    updateBookingStatus,
    getMyAppointments,
    getMyBookingHistory
} = require("../controllers/bookingController");


// =====================================================
// CUSTOMER - MY APPOINTMENTS
// IMPORTANT: Keep this BEFORE /:id
// =====================================================

router.get(
    "/my-appointments",
    getMyAppointments
);


// =====================================================
// CUSTOMER - BOOKING HISTORY
// IMPORTANT: Keep this BEFORE /:id
// =====================================================

router.get(
    "/booking-history",
    getMyBookingHistory
);


// =====================================================
// ADMIN - ALL BOOKINGS
// =====================================================

router.get(
    "/",
    getAllBookings
);


// =====================================================
// GET SINGLE BOOKING
// =====================================================

router.get(
    "/:id",
    getBookingById
);


// =====================================================
// CREATE BOOKING
// =====================================================

router.post(
    "/",
    createBooking
);


// =====================================================
// UPDATE BOOKING STATUS
// =====================================================

router.put(
    "/:id/status",
    updateBookingStatus
);


module.exports = router;