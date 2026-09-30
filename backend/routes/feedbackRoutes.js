const express = require("express");

const router = express.Router();

const {
    createFeedback,
    getMyFeedback,
    getHomeFeedback,
    getAdminFeedback,
    deleteFeedback
} = require("../controllers/feedbackController");


/*
|--------------------------------------------------------------------------
| Customer Feedback Routes
|--------------------------------------------------------------------------
*/


// Submit feedback for a completed booking
router.post("/", createFeedback);


// Get feedback submitted by logged-in customer
// Used by history.html
router.get("/my", getMyFeedback);


// Get best/latest feedback for Home page
// Public endpoint
router.get("/home", getHomeFeedback);


// Get all feedback for Admin Feedback page
router.get("/admin", getAdminFeedback);


// Delete feedback from Admin Feedback page
router.delete("/:id", deleteFeedback);


module.exports = router;