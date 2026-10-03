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
// CUSTOMER APPOINTMENTS
// =====================================================

router.get(
    "/my-appointments",
    getMyAppointments
);


// =====================================================
// CUSTOMER BOOKING HISTORY
// =====================================================

router.get(
    "/booking-history",
    getMyBookingHistory
);


// =====================================================
// BOOKING AVAILABILITY
// IMPORTANT: MUST BE BEFORE /:id
// =====================================================

router.get(
    "/availability",
    getBookingAvailability
);


// =====================================================
// ALL BOOKINGS
// =====================================================

router.get(
    "/",
    getAllBookings
);


// =====================================================
// SINGLE BOOKING
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