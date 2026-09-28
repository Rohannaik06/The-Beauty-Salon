const pool = require("../config/database");

/**
 * Get logged-in customer from session token
 */
async function getCustomerFromSession(req) {
    try {
        const authHeader = req.headers.authorization || "";

        if (!authHeader.startsWith("Bearer ")) {
            return null;
        }

        const token = authHeader.substring(7).trim();

        if (!token) {
            return null;
        }

        const [rows] = await pool.promise().query(
            `
            SELECT
                c.id,
                c.name,
                c.email,
                c.phone
            FROM customer_sessions cs
            INNER JOIN customers c
                ON c.id = cs.customer_id
            WHERE cs.session_token = ?
              AND cs.expires_at > NOW()
            LIMIT 1
            `,
            [token]
        );

        return rows.length ? rows[0] : null;

    } catch (error) {
        console.error("getCustomerFromSession error:", error);
        return null;
    }
}


/**
 * POST /api/feedback
 *
 * Create feedback for a completed booking
 */
async function createFeedback(req, res) {
    try {
        const customer = await getCustomerFromSession(req);

        if (!customer) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please login again."
            });
        }

        const bookingId = Number(req.body.booking_id);
        const rating = Number(req.body.rating);
        const comment =
            typeof req.body.comment === "string"
                ? req.body.comment.trim()
                : "";

        // Validate booking ID
        if (!Number.isInteger(bookingId) || bookingId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid booking ID."
            });
        }

        // Validate rating
        if (
            !Number.isInteger(rating) ||
            rating < 1 ||
            rating > 5
        ) {
            return res.status(400).json({
                success: false,
                message: "Rating must be between 1 and 5."
            });
        }

        // Validate comment length
        if (comment.length > 1000) {
            return res.status(400).json({
                success: false,
                message: "Comment cannot exceed 1000 characters."
            });
        }

        // Get booking
        const [bookingRows] = await pool.promise().query(
            `
            SELECT
                id,
                customer_id,
                status
            FROM bookings
            WHERE id = ?
            LIMIT 1
            `,
            [bookingId]
        );

        if (!bookingRows.length) {
            return res.status(404).json({
                success: false,
                message: "Booking not found."
            });
        }

        const booking = bookingRows[0];

        // Booking must belong to logged-in customer
        if (Number(booking.customer_id) !== Number(customer.id)) {
            return res.status(403).json({
                success: false,
                message: "You cannot submit feedback for this booking."
            });
        }

        // Only completed bookings can receive feedback
        if (booking.status !== "COMPLETED") {
            return res.status(400).json({
                success: false,
                message: "Feedback can only be submitted for completed bookings."
            });
        }

        // Check whether feedback already exists
        const [existingRows] = await pool.promise().query(
            `
            SELECT id
            FROM feedback
            WHERE booking_id = ?
            LIMIT 1
            `,
            [bookingId]
        );

        if (existingRows.length) {
            return res.status(409).json({
                success: false,
                message: "Feedback has already been submitted for this booking."
            });
        }

        // Insert feedback
        const [result] = await pool.promise().query(
            `
            INSERT INTO feedback
                (
                    booking_id,
                    customer_id,
                    rating,
                    comment
                )
            VALUES
                (?, ?, ?, ?)
            `,
            [
                bookingId,
                customer.id,
                rating,
                comment || null
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Feedback submitted successfully.",
            data: {
                id: result.insertId,
                booking_id: bookingId,
                customer_id: customer.id,
                rating,
                comment: comment || null
            }
        });

    } catch (error) {
        console.error("createFeedback error:", error);

        // Handles DB unique constraint safely
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Feedback has already been submitted for this booking."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to submit feedback."
        });
    }
}


/**
 * GET /api/feedback/my
 *
 * Get feedback submitted by logged-in customer
 */
async function getMyFeedback(req, res) {
    try {
        const customer = await getCustomerFromSession(req);

        if (!customer) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please login again."
            });
        }

        const [rows] = await pool.promise().query(
            `
            SELECT
                f.id,
                f.booking_id,
                f.rating,
                f.comment,
                f.created_at
            FROM feedback f
            WHERE f.customer_id = ?
            ORDER BY f.created_at DESC
            `,
            [customer.id]
        );

        return res.json({
            success: true,
            count: rows.length,
            data: rows
        });

    } catch (error) {
        console.error("getMyFeedback error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load your feedback."
        });
    }
}


/**
 * GET /api/feedback/home
 *
 * Public endpoint for Home page
 *
 * Returns maximum 4 feedbacks.
 * Higher ratings appear first,
 * then latest feedback for the same rating.
 */
async function getHomeFeedback(req, res) {
    try {
        const [rows] = await pool.promise().query(
            `
            SELECT
                f.id,
                f.booking_id,
                f.rating,
                f.comment,
                f.created_at,
                c.name AS customer_name,
                b.booking_number
            FROM feedback f
            INNER JOIN customers c
                ON c.id = f.customer_id
            INNER JOIN bookings b
                ON b.id = f.booking_id
            WHERE f.comment IS NOT NULL
              AND TRIM(f.comment) <> ''
            ORDER BY
                f.rating DESC,
                f.created_at DESC
            LIMIT 4
            `
        );

        return res.json({
            success: true,
            count: rows.length,
            data: rows
        });

    } catch (error) {
        console.error("getHomeFeedback error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load feedback."
        });
    }
}


module.exports = {
    createFeedback,
    getMyFeedback,
    getHomeFeedback
};