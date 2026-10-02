const express = require("express");

const router = express.Router();

const {
    getAllBookings,
    getBookingById,
    createBooking,
    updateBookingStatus,
    getMyAppointments,
    getMyBookingHistory,
    getBookingAvailability
} = require("../controllers/bookingController");


// =====================================================
// CUSTOMER - MY APPOINTMENTS
// =====================================================

router.get(
    "/my-appointments",
    getMyAppointments
);


// =====================================================
// CUSTOMER - BOOKING HISTORY
// =====================================================

router.get(
    "/booking-history",
    getMyBookingHistory
);


// =====================================================
// CUSTOMER - BOOKING AVAILABILITY
//
// GET /api/bookings/availability
//
// Query:
// branch_id
// staff_id
// service_id
// booking_date
// =====================================================

router.get(
    "/availability",
    getBookingAvailability
);


// =====================================================
// ADMIN - ALL BOOKINGS
//
// GET /api/bookings
// GET /api/bookings?date=2026-09-20
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