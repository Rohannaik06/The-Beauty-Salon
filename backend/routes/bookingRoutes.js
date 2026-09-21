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

// CUSTOMER - MY APPOINTMENTS
router.get(
    "/my-appointments",
    getMyAppointments
);

// CUSTOMER - BOOKING HISTORY
router.get(
    "/booking-history",
    getMyBookingHistory
);

// ADMIN - ALL BOOKINGS
// GET /api/bookings
// GET /api/bookings?date=2026-09-20
router.get(
    "/",
    getAllBookings
);

// GET SINGLE BOOKING
router.get(
    "/:id",
    getBookingById
);

// CREATE BOOKING
router.post(
    "/",
    createBooking
);

// UPDATE BOOKING STATUS
router.put(
    "/:id/status",
    updateBookingStatus
);

module.exports = router;