const pool = require("../config/database");

// =====================================================
// HELPERS
// =====================================================

function generateBookingNumber(latestId) {
    return "BK" + String(1000 + latestId + 1);
}

function timeToMinutes(value) {
    if (value === null || value === undefined) {
        return 0;
    }

    const parts = String(value).trim().split(":");
    const hours = Number(parts[0]);
    const minutes = Number(parts[1] || 0);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
        return NaN;
    }

    return hours * 60 + minutes;
}

function normalizeTime(value) {
    if (!value) {
        return null;
    }

    const text = String(value).trim();

    const ampmMatch = text.match(
        /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
    );

    if (ampmMatch) {
        let hours = Number(ampmMatch[1]);
        const minutes = Number(ampmMatch[2]);
        const modifier = ampmMatch[3].toUpperCase();

        if (modifier === "PM" && hours !== 12) {
            hours += 12;
        }

        if (modifier === "AM" && hours === 12) {
            hours = 0;
        }

        return (
            String(hours).padStart(2, "0") +
            ":" +
            String(minutes).padStart(2, "0") +
            ":00"
        );
    }

    const twentyFourMatch = text.match(
        /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/
    );

    if (twentyFourMatch) {
        const hours = Number(twentyFourMatch[1]);
        const minutes = Number(twentyFourMatch[2]);

        if (
            hours < 0 ||
            hours > 23 ||
            minutes < 0 ||
            minutes > 59
        ) {
            return null;
        }

        return (
            String(hours).padStart(2, "0") +
            ":" +
            String(minutes).padStart(2, "0") +
            ":00"
        );
    }

    return null;
}

function normalizePhone(phone) {
    if (phone === null || phone === undefined) {
        return "";
    }

    const digits = String(phone).replace(/\D/g, "");

    if (digits.length === 10) {
        return digits;
    }

    if (
        digits.length === 12 &&
        digits.startsWith("91")
    ) {
        return digits.slice(2);
    }

    return "";
}

function normalizeDate(value) {
    if (!value) {
        return null;
    }

    const text = String(value).trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        return text;
    }

    return null;
}

function getTodayString() {
    const today = new Date();

    return (
        today.getFullYear() +
        "-" +
        String(today.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(today.getDate()).padStart(2, "0")
    );
}


// =====================================================
// GET ALL BOOKINGS
// GET /api/bookings
// =====================================================

async function getAllBookings(req, res) {
    try {
        const selectedDate =
            normalizeDate(req.query.date);

        let dateCondition = "";
        let queryParams = [];

        if (selectedDate) {
            dateCondition = `
                WHERE DATE(b.booking_date) = ?
            `;

            queryParams = [selectedDate];
        }

        const [rows] =
            await pool.promise().query(
                `
                SELECT
                    b.id,
                    b.booking_number,

                    DATE_FORMAT(
                        b.booking_date,
                        '%Y-%m-%d'
                    ) AS booking_date,

                    b.booking_time,
                    b.service_price,
                    b.service_duration,
                    b.payment_method,
                    b.payment_status,
                    b.status,
                    b.notes,
                    b.created_at,

                    c.id AS customer_id,
                    c.name AS customer_name,
                    c.phone AS customer_phone,
                    c.email AS customer_email,

                    br.id AS branch_id,
                    br.name AS branch_name,

                    s.id AS service_id,
                    s.name AS service_name,

                    st.id AS staff_id,
                    st.name AS staff_name,
                    st.role AS staff_role

                FROM bookings b

                INNER JOIN customers c
                    ON c.id = b.customer_id

                INNER JOIN branches br
                    ON br.id = b.branch_id

                INNER JOIN services s
                    ON s.id = b.service_id

                INNER JOIN staff st
                    ON st.id = b.staff_id

                ${dateCondition}

                ORDER BY
                    b.booking_date DESC,
                    b.booking_time DESC,
                    b.id DESC
                `,
                queryParams
            );

        return res.status(200).json({
            success: true,
            count: rows.length,
            selectedDate: selectedDate || null,
            data: rows
        });

    } catch (error) {
        console.error(
            "GET ALL BOOKINGS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch bookings.",
            error: error.message
        });
    }
}


// =====================================================
// GET SINGLE BOOKING
// GET /api/bookings/:id
// =====================================================

async function getBookingById(req, res) {
    try {
        const [rows] =
            await pool.promise().query(
                `
                SELECT
                    b.id,
                    b.booking_number,

                    DATE_FORMAT(
                        b.booking_date,
                        '%Y-%m-%d'
                    ) AS booking_date,

                    b.booking_time,
                    b.service_price,
                    b.service_duration,
                    b.payment_method,
                    b.payment_status,
                    b.status,
                    b.notes,
                    b.created_at,
                    b.updated_at,

                    c.id AS customer_id,
                    c.name AS customer_name,
                    c.phone AS customer_phone,
                    c.email AS customer_email,

                    br.id AS branch_id,
                    br.name AS branch_name,
                    br.address AS branch_address,
                    br.phone AS branch_phone,

                    s.id AS service_id,
                    s.name AS service_name,
                    s.category AS service_category,

                    st.id AS staff_id,
                    st.name AS staff_name,
                    st.role AS staff_role

                FROM bookings b

                INNER JOIN customers c
                    ON c.id = b.customer_id

                INNER JOIN branches br
                    ON br.id = b.branch_id

                INNER JOIN services s
                    ON s.id = b.service_id

                INNER JOIN staff st
                    ON st.id = b.staff_id

                WHERE b.id = ?

                LIMIT 1
                `,
                [req.params.id]
            );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Booking not found."
            });
        }

        return res.status(200).json({
            success: true,
            data: rows[0]
        });

    } catch (error) {
        console.error(
            "GET BOOKING ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch booking.",
            error: error.message
        });
    }
}


// =====================================================
// CREATE BOOKING
// POST /api/bookings
// =====================================================

async function createBooking(req, res) {
    const connection =
        await pool.promise().getConnection();

    try {
        const {
            name,
            phone,
            email,
            branch,
            service,
            staff,
            booking_date,
            booking_time,
            notes
        } = req.body;


        // =================================================
        // REQUIRED FIELDS
        // =================================================

        if (
            !name ||
            !phone ||
            !branch ||
            !service ||
            !booking_date ||
            !booking_time
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, phone, branch, service, date and time are required."
            });
        }


        // =================================================
        // NORMALIZE
        // =================================================

        const cleanName =
            String(name).trim();

        const cleanPhone =
            normalizePhone(phone);

        const cleanEmail =
            email &&
            String(email).trim()
                ? String(email)
                    .trim()
                    .toLowerCase()
                : null;

        const cleanDate =
            normalizeDate(booking_date);

        const cleanTime =
            normalizeTime(booking_time);


        // =================================================
        // VALIDATION
        // =================================================

        if (
            !cleanPhone ||
            cleanPhone.length !== 10
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please enter a valid 10-digit mobile number."
            });
        }

        if (!cleanDate) {
            return res.status(400).json({
                success: false,
                message: "Invalid booking date."
            });
        }

        if (!cleanTime) {
            return res.status(400).json({
                success: false,
                message: "Invalid booking time."
            });
        }


        // =================================================
        // PREVENT PAST DATE
        // =================================================

        const todayString =
            getTodayString();

        if (cleanDate < todayString) {
            return res.status(400).json({
                success: false,
                message:
                    "Past dates cannot be booked."
            });
        }


        await connection.beginTransaction();


        // =================================================
        // FIND SELECTED BRANCH
        // =================================================

        let branches = [];

        if (
            /^\d+$/.test(
                String(branch)
            )
        ) {
            [branches] =
                await connection.query(
                    `
                    SELECT
                        id,
                        name,
                        opening_time,
                        closing_time
                    FROM branches
                    WHERE
                        id = ?
                        AND is_active = 1
                    LIMIT 1
                    `,
                    [Number(branch)]
                );

        } else {
            [branches] =
                await connection.query(
                    `
                    SELECT
                        id,
                        name,
                        opening_time,
                        closing_time
                    FROM branches
                    WHERE
                        name = ?
                        AND is_active = 1
                    LIMIT 1
                    `,
                    [String(branch).trim()]
                );
        }

        if (branches.length === 0) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message:
                    "Selected branch is not available."
            });
        }

        const selectedBranch =
            branches[0];


        // =================================================
        // FIND SERVICE
        // =================================================

        let services = [];

        if (
            /^\d+$/.test(
                String(service)
            )
        ) {
            [services] =
                await connection.query(
                    `
                    SELECT
                        id,
                        name,
                        price,
                        duration,
                        branch_id
                    FROM services
                    WHERE
                        id = ?
                        AND is_active = 1
                        AND (
                            branch_id = ?
                            OR branch_id IS NULL
                        )
                    LIMIT 1
                    `,
                    [
                        Number(service),
                        selectedBranch.id
                    ]
                );

        } else {
            [services] =
                await connection.query(
                    `
                    SELECT
                        id,
                        name,
                        price,
                        duration,
                        branch_id
                    FROM services
                    WHERE
                        name = ?
                        AND is_active = 1
                        AND (
                            branch_id = ?
                            OR branch_id IS NULL
                        )
                    LIMIT 1
                    `,
                    [
                        String(service).trim(),
                        selectedBranch.id
                    ]
                );
        }

        if (services.length === 0) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message:
                    "Selected service is not available at the selected branch."
            });
        }

        const selectedService =
            services[0];


        // =================================================
        // SERVICE DURATION / PRICE
        // =================================================

        const serviceDuration =
            Number(selectedService.duration);

        const servicePrice =
            Number(selectedService.price);

        if (
            !Number.isFinite(serviceDuration) ||
            serviceDuration <= 0
        ) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message:
                    "Invalid service duration."
            });
        }


        // =================================================
        // SALON TIME VALIDATION
        // =================================================

        const openingMinutes =
            timeToMinutes(
                selectedBranch.opening_time
            );

        const closingMinutes =
            timeToMinutes(
                selectedBranch.closing_time
            );

        const startMinutes =
            timeToMinutes(cleanTime);

        const endMinutes =
            startMinutes + serviceDuration;

        if (
            Number.isNaN(startMinutes) ||
            Number.isNaN(openingMinutes) ||
            Number.isNaN(closingMinutes)
        ) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message:
                    "Invalid salon time configuration."
            });
        }

        if (
            startMinutes < openingMinutes ||
            endMinutes > closingMinutes
        ) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message:
                    `This service cannot be booked at ${cleanTime.substring(0, 5)}. ` +
                    `The service duration is ${serviceDuration} minutes and the salon is open from ` +
                    `${String(
                        selectedBranch.opening_time
                    ).substring(0, 5)} to ` +
                    `${String(
                        selectedBranch.closing_time
                    ).substring(0, 5)}.`
            });
        }


        // =================================================
        // PREVENT PAST TIME FOR TODAY
        // =================================================

        if (cleanDate === todayString) {
            const now = new Date();

            const currentMinutes =
                now.getHours() * 60 +
                now.getMinutes();

            if (startMinutes <= currentMinutes) {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message:
                        "This time has already passed. Please select a future time."
                });
            }
        }


        // =================================================
        // STAFF SELECTION
        //
        // Specific staff:
        //   ONLY selected staff is checked.
        //
        // Any Available Staff:
        //   Any available active staff can be selected.
        // =================================================

        const staffValue =
            staff === null ||
            staff === undefined
                ? ""
                : String(staff).trim();

        const isAnyStaff =
            !staffValue ||
            staffValue.toUpperCase() === "ANY" ||
            staffValue.toLowerCase() ===
                "any available staff";

        let selectedStaff = null;


        // =================================================
        // SPECIFIC STAFF
        // =================================================

        if (!isAnyStaff) {

            let staffRows = [];


            // -------------------------------------------------
            // STAFF ID
            // -------------------------------------------------

            if (
                /^\d+$/.test(staffValue)
            ) {

                [staffRows] =
                    await connection.query(
                        `
                        SELECT
                            id,
                            name,
                            role
                        FROM staff
                        WHERE
                            id = ?
                            AND branch_id = ?
                            AND is_active = 1
                        LIMIT 1
                        `,
                        [
                            Number(staffValue),
                            selectedBranch.id
                        ]
                    );

            }


            // -------------------------------------------------
            // STAFF NAME
            // -------------------------------------------------

            else {

                const staffName =
                    staffValue
                        .split(/\s+[—-]\s+/)[0]
                        .trim();

                [staffRows] =
                    await connection.query(
                        `
                        SELECT
                            id,
                            name,
                            role
                        FROM staff
                        WHERE
                            branch_id = ?
                            AND is_active = 1
                            AND (
                                name = ?
                                OR CONCAT(
                                    name,
                                    ' — ',
                                    role
                                ) = ?
                                OR CONCAT(
                                    name,
                                    ' - ',
                                    role
                                ) = ?
                            )
                        LIMIT 1
                        `,
                        [
                            selectedBranch.id,
                            staffName,
                            staffValue,
                            staffValue
                        ]
                    );
            }


            // -------------------------------------------------
            // STAFF NOT AVAILABLE AT BRANCH
            // -------------------------------------------------

            if (staffRows.length === 0) {

                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message:
                        "Selected staff is not available at the selected branch."
                });
            }


            selectedStaff =
                staffRows[0];


            // -------------------------------------------------
            // CHECK ONLY SELECTED STAFF
            // -------------------------------------------------

            const [
                existingBookings
            ] =
                await connection.query(
                    `
                    SELECT
                        booking_time,
                        service_duration,
                        status
                    FROM bookings
                    WHERE
                        staff_id = ?
                        AND branch_id = ?
                        AND DATE(booking_date) = ?
                        AND status IN (
                            'CONFIRMED',
                            'COMPLETED'
                        )
                    ORDER BY
                        booking_time ASC
                    `,
                    [
                        selectedStaff.id,
                        selectedBranch.id,
                        cleanDate
                    ]
                );


            for (
                const booking
                of existingBookings
            ) {

                const existingStart =
                    timeToMinutes(
                        booking.booking_time
                    );

                const existingDuration =
                    Number(
                        booking.service_duration || 30
                    );

                const existingEnd =
                    existingStart +
                    existingDuration;

                const overlaps =
                    startMinutes < existingEnd &&
                    endMinutes > existingStart;

                if (overlaps) {

                    await connection.rollback();

                    return res.status(400).json({
                        success: false,
                        message:
                            "Selected staff is not available for the selected date and time."
                    });
                }
            }

        }


        // =================================================
        // ANY AVAILABLE STAFF
        // =================================================

        else {

            let staffRows = [];

            [staffRows] =
                await connection.query(
                    `
                    SELECT
                        id,
                        name,
                        role
                    FROM staff
                    WHERE
                        branch_id = ?
                        AND is_active = 1
                    ORDER BY
                        id ASC
                    `,
                    [selectedBranch.id]
                );


            if (staffRows.length === 0) {

                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message:
                        "No active staff is available for the selected branch."
                });
            }


            // -------------------------------------------------
            // FIND AVAILABLE STAFF
            // -------------------------------------------------

            for (
                const candidate
                of staffRows
            ) {

                const [
                    existingBookings
                ] =
                    await connection.query(
                        `
                        SELECT
                            booking_time,
                            service_duration,
                            status
                        FROM bookings
                        WHERE
                            staff_id = ?
                            AND branch_id = ?
                            AND DATE(booking_date) = ?
                            AND status IN (
                                'CONFIRMED',
                                'COMPLETED'
                            )
                        ORDER BY
                            booking_time ASC
                        `,
                        [
                            candidate.id,
                            selectedBranch.id,
                            cleanDate
                        ]
                    );


                let isAvailable = true;


                for (
                    const booking
                    of existingBookings
                ) {

                    const existingStart =
                        timeToMinutes(
                            booking.booking_time
                        );

                    const existingDuration =
                        Number(
                            booking.service_duration || 30
                        );

                    const existingEnd =
                        existingStart +
                        existingDuration;

                    const overlaps =
                        startMinutes < existingEnd &&
                        endMinutes > existingStart;

                    if (overlaps) {
                        isAvailable = false;
                        break;
                    }
                }


                if (isAvailable) {
                    selectedStaff =
                        candidate;

                    break;
                }
            }


            // -------------------------------------------------
            // NO STAFF AVAILABLE
            // -------------------------------------------------

            if (!selectedStaff) {

                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message:
                        "No staff is available for the selected date and time."
                });
            }
        }


        // =================================================
        // FIND / CREATE CUSTOMER
        // =================================================

        const customerPhone =
            "+91 " + cleanPhone;

        const [
            customers
        ] =
            await connection.query(
                `
                SELECT
                    id,
                    email
                FROM customers
                WHERE phone = ?
                LIMIT 1
                `,
                [customerPhone]
            );

        let customerId;


        // =================================================
        // EXISTING PHONE
        // =================================================

        if (customers.length > 0) {

            customerId =
                customers[0].id;


            // -------------------------------------------------
            // CHECK EMAIL OWNER
            // -------------------------------------------------

            if (cleanEmail) {

                const [
                    emailOwners
                ] =
                    await connection.query(
                        `
                        SELECT
                            id
                        FROM customers
                        WHERE
                            email = ?
                            AND id <> ?
                        LIMIT 1
                        `,
                        [
                            cleanEmail,
                            customerId
                        ]
                    );


                if (
                    emailOwners.length > 0
                ) {

                    await connection.rollback();

                    return res.status(409).json({
                        success: false,
                        message:
                            "Email already registered. Please use your registered mobile number or another email."
                    });
                }
            }


            // -------------------------------------------------
            // UPDATE CUSTOMER
            // -------------------------------------------------

            await connection.query(
                `
                UPDATE customers
                SET
                    name = ?,
                    email = ?
                WHERE id = ?
                `,
                [
                    cleanName,
                    cleanEmail,
                    customerId
                ]
            );
        }


        // =================================================
        // NEW PHONE
        // =================================================

        else {

            if (cleanEmail) {

                const [
                    emailOwners
                ] =
                    await connection.query(
                        `
                        SELECT
                            id
                        FROM customers
                        WHERE email = ?
                        LIMIT 1
                        `,
                        [cleanEmail]
                    );


                if (
                    emailOwners.length > 0
                ) {

                    await connection.rollback();

                    return res.status(409).json({
                        success: false,
                        message:
                            "Email already registered. Please use your registered mobile number or another email."
                    });
                }
            }


            const [
                customerResult
            ] =
                await connection.query(
                    `
                    INSERT INTO customers
                    (
                        name,
                        phone,
                        email
                    )
                    VALUES (?, ?, ?)
                    `,
                    [
                        cleanName,
                        customerPhone,
                        cleanEmail
                    ]
                );


            customerId =
                customerResult.insertId;
        }


        // =================================================
        // FINAL OVERLAP CHECK
        // RACE-CONDITION PROTECTION
        // =================================================

        const [
            finalOverlap
        ] =
            await connection.query(
                `
                SELECT
                    id
                FROM bookings
                WHERE
                    staff_id = ?
                    AND branch_id = ?
                    AND DATE(booking_date) = ?

                    AND status IN (
                        'CONFIRMED',
                        'COMPLETED'
                    )

                    AND booking_time < ADDTIME(
                        ?,
                        SEC_TO_TIME(? * 60)
                    )

                    AND ADDTIME(
                        booking_time,
                        SEC_TO_TIME(
                            service_duration * 60
                        )
                    ) > ?

                LIMIT 1
                `,
                [
                    selectedStaff.id,
                    selectedBranch.id,
                    cleanDate,
                    cleanTime,
                    serviceDuration,
                    cleanTime
                ]
            );


        if (
            finalOverlap.length > 0
        ) {

            await connection.rollback();

            return res.status(400).json({
                success: false,
                message:
                    "This staff member is no longer available for the selected time."
            });
        }


        // =================================================
        // GENERATE BOOKING NUMBER
        // =================================================

        const [
            latest
        ] =
            await connection.query(
                `
                SELECT
                    id
                FROM bookings
                ORDER BY id DESC
                LIMIT 1
                `
            );


        const latestId =
            latest.length > 0
                ? Number(latest[0].id)
                : 0;


        const bookingNumber =
            generateBookingNumber(
                latestId
            );


        // =================================================
        // INSERT BOOKING
        // =================================================

        const [
            bookingResult
        ] =
            await connection.query(
                `
                INSERT INTO bookings
                (
                    booking_number,
                    customer_id,
                    branch_id,
                    service_id,
                    staff_id,
                    booking_date,
                    booking_time,
                    service_price,
                    service_duration,
                    payment_method,
                    payment_status,
                    status,
                    notes
                )
                VALUES
                (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?,
                    'PAY_AT_SALON',
                    'PENDING',
                    'CONFIRMED',
                    ?
                )
                `,
                [
                    bookingNumber,
                    customerId,
                    selectedBranch.id,
                    selectedService.id,
                    selectedStaff.id,
                    cleanDate,
                    cleanTime,
                    servicePrice,
                    serviceDuration,
                    notes || null
                ]
            );


        await connection.commit();


        // =================================================
        // SUCCESS
        // =================================================

        return res.status(201).json({

            success: true,

            message:
                "Booking confirmed successfully.",

            bookingId:
                bookingResult.insertId,

            bookingNumber,

            customer:
                cleanName,

            phone:
                customerPhone,

            email:
                cleanEmail,

            staff:
                selectedStaff.name,

            staffRole:
                selectedStaff.role,

            branch:
                selectedBranch.name,

            service:
                selectedService.name,

            bookingDate:
                cleanDate,

            bookingTime:
                cleanTime,

            serviceDuration,

            servicePrice,

            paymentMethod:
                "PAY_AT_SALON",

            paymentStatus:
                "PENDING",

            status:
                "CONFIRMED"
        });

    } catch (error) {

        try {
            await connection.rollback();
        } catch (_) {}


        console.error(
            "CREATE BOOKING ERROR:",
            error
        );


        if (
            error &&
            error.code === "ER_DUP_ENTRY" &&
            String(
                error.sqlMessage ||
                error.message ||
                ""
            ).includes(
                "unique_customer_email"
            )
        ) {

            return res.status(409).json({
                success: false,
                message:
                    "Email already registered. Please use your registered mobile number or another email."
            });
        }


        return res.status(500).json({
            success: false,
            message:
                "Unable to create booking.",
            error:
                error.message
        });

    } finally {
        connection.release();
    }
}

// =====================================================
// UPDATE BOOKING STATUS
// =====================================================

async function updateBookingStatus(req, res) {

    try {

        const requestedStatus =
            req.body &&
            req.body.status !== undefined
                ? String(req.body.status).trim().toUpperCase()
                : "";

        const allowedStatuses = [
            "CONFIRMED",
            "COMPLETED",
            "CANCELLED"
        ];


        // =================================================
        // VALIDATE STATUS
        // =================================================

        if (
            !allowedStatuses.includes(
                requestedStatus
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid booking status. Allowed values are CONFIRMED, COMPLETED and CANCELLED."
            });
        }


        // =================================================
        // VALIDATE BOOKING ID
        // =================================================

        const bookingId =
            Number(req.params.id);

        if (
            !Number.isInteger(bookingId) ||
            bookingId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid booking ID."
            });
        }


        // =================================================
        // CUSTOMER CANCELLATION
        //
        // CANCELLED requires:
        // 1. Bearer token
        // 2. Valid customer session
        // 3. Booking belongs to customer
        // 4. Booking is CONFIRMED
        // 5. Appointment has not already started
        // =================================================

        if (
            requestedStatus === "CANCELLED"
        ) {

            const authorization =
                req.headers.authorization || "";


            // -------------------------------------------------
            // CHECK AUTHORIZATION HEADER
            // -------------------------------------------------

            if (
                !authorization.startsWith(
                    "Bearer "
                )
            ) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Authentication token is required to cancel an appointment."
                });
            }


            const token =
                authorization
                    .substring(7)
                    .trim();


            if (!token) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Authentication token is required to cancel an appointment."
                });
            }


            // -------------------------------------------------
            // FIND VALID CUSTOMER SESSION
            // -------------------------------------------------

            const [
                customerRows
            ] =
                await pool.promise().query(
                    `
                    SELECT
                        c.id,
                        c.name,
                        c.phone,
                        c.email

                    FROM customer_sessions cs

                    INNER JOIN customers c
                        ON c.id = cs.customer_id

                    WHERE
                        cs.session_token = ?
                        AND cs.expires_at > NOW()

                    LIMIT 1
                    `,
                    [
                        token
                    ]
                );


            if (
                customerRows.length === 0
            ) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Session expired or invalid. Please login again."
                });
            }


            const customer =
                customerRows[0];

            const customerId =
                Number(customer.id);


            // -------------------------------------------------
            // FIND THIS CUSTOMER'S BOOKING
            // -------------------------------------------------

            const [
                bookingRows
            ] =
                await pool.promise().query(
                    `
                    SELECT
                        id,
                        customer_id,
                        booking_number,
                        booking_date,
                        booking_time,
                        status

                    FROM bookings

                    WHERE
                        id = ?
                        AND customer_id = ?

                    LIMIT 1
                    `,
                    [
                        bookingId,
                        customerId
                    ]
                );


            // -------------------------------------------------
            // BOOKING NOT FOUND / NOT OWNED BY CUSTOMER
            // -------------------------------------------------

            if (
                bookingRows.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Appointment not found."
                });
            }


            const booking =
                bookingRows[0];


            // -------------------------------------------------
            // ONLY CONFIRMED APPOINTMENTS CAN BE CANCELLED
            // -------------------------------------------------

            if (
                String(
                    booking.status
                ).toUpperCase() !== "CONFIRMED"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        `This appointment cannot be cancelled because its current status is ${booking.status}.`
                });
            }


            // -------------------------------------------------
            // PREVENT CANCELLING A PAST APPOINTMENT
            //
            // MySQL CURDATE() / CURTIME() use DB timezone.
            // This keeps validation consistent with the
            // appointment queries already used by the project.
            // -------------------------------------------------

            const [
                currentTimeRows
            ] =
                await pool.promise().query(
                    `
                    SELECT
                        CURDATE() AS today,
                        CURTIME() AS current_time
                    `
                );


            const today =
                currentTimeRows[0].today;

            const currentTime =
                currentTimeRows[0].current_time;


            const bookingDate =
                String(
                    booking.booking_date
                ).substring(0, 10);

            const bookingTime =
                String(
                    booking.booking_time
                ).substring(0, 8);


            // Past date
            if (
                bookingDate < today
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Past appointments cannot be cancelled."
                });
            }


            // Today's appointment whose time has passed
            if (
                bookingDate === today &&
                bookingTime < currentTime
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "This appointment time has already passed and cannot be cancelled."
                });
            }


            // -------------------------------------------------
            // CANCEL THE CUSTOMER'S OWN BOOKING
            // -------------------------------------------------

            const [
                updateResult
            ] =
                await pool.promise().query(
                    `
                    UPDATE bookings

                    SET
                        status = 'CANCELLED',
                        updated_at = CURRENT_TIMESTAMP

                    WHERE
                        id = ?
                        AND customer_id = ?
                        AND status = 'CONFIRMED'
                    `,
                    [
                        bookingId,
                        customerId
                    ]
                );


            // -------------------------------------------------
            // SAFETY CHECK
            // -------------------------------------------------

            if (
                updateResult.affectedRows === 0
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        "The appointment could not be cancelled. It may have already been updated."
                });
            }


            // -------------------------------------------------
            // CUSTOMER CANCEL SUCCESS
            // -------------------------------------------------

            return res.status(200).json({

                success: true,

                message:
                    "Appointment cancelled successfully.",

                data: {

                    id:
                        bookingId,

                    bookingNumber:
                        booking.booking_number,

                    previousStatus:
                        "CONFIRMED",

                    status:
                        "CANCELLED"
                }
            });
        }


        // =================================================
        // CONFIRMED / COMPLETED
        //
        // Keep existing status-update behaviour for the
        // admin side of the application.
        // =================================================

        const [
            existingRows
        ] =
            await pool.promise().query(
                `
                SELECT
                    id,
                    status

                FROM bookings

                WHERE
                    id = ?

                LIMIT 1
                `,
                [
                    bookingId
                ]
            );


        if (
            existingRows.length === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Booking not found."
            });
        }


        const previousStatus =
            existingRows[0].status;


        // -------------------------------------------------
        // UPDATE STATUS
        // -------------------------------------------------

        await pool.promise().query(
            `
            UPDATE bookings

            SET
                status = ?,
                updated_at = CURRENT_TIMESTAMP

            WHERE
                id = ?
            `,
            [
                requestedStatus,
                bookingId
            ]
        );


        // -------------------------------------------------
        // SUCCESS
        // -------------------------------------------------

        return res.status(200).json({

            success: true,

            message:
                "Booking status updated successfully.",

            data: {

                id:
                    bookingId,

                previousStatus:
                    previousStatus,

                status:
                    requestedStatus
            }
        });


    } catch (error) {

        console.error(
            "UPDATE BOOKING STATUS ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to update booking status.",

            error:
                error.message
        });
    }
}


// =====================================================
// GET MY APPOINTMENTS
// CUSTOMER
// =====================================================

async function getMyAppointments(req, res) {

    try {

        const authorization =
            req.headers.authorization || "";


        if (
            !authorization.startsWith(
                "Bearer "
            )
        ) {

            return res.status(401).json({
                success: false,
                message:
                    "Authentication token is required."
            });
        }


        const token =
            authorization
                .substring(7)
                .trim();


        if (!token) {

            return res.status(401).json({
                success: false,
                message:
                    "Authentication token is required."
            });
        }


        const [
            customerRows
        ] =
            await pool.promise().query(
                `
                SELECT
                    c.id,
                    c.name,
                    c.phone,
                    c.email
                FROM customer_sessions cs
                INNER JOIN customers c
                    ON c.id = cs.customer_id
                WHERE
                    cs.session_token = ?
                    AND cs.expires_at > NOW()
                LIMIT 1
                `,
                [token]
            );


        if (
            customerRows.length === 0
        ) {

            return res.status(401).json({
                success: false,
                message:
                    "Session expired or invalid. Please login again."
            });
        }


        const customer =
            customerRows[0];

        const customerId =
            customer.id;


        const [
            rows
        ] =
            await pool.promise().query(
                `
                SELECT

                    b.id,
                    b.booking_number,

                    DATE_FORMAT(
                        b.booking_date,
                        '%Y-%m-%d'
                    ) AS booking_date,

                    b.booking_time,
                    b.service_price,
                    b.service_duration,
                    b.payment_method,
                    b.payment_status,
                    b.status,
                    b.notes,
                    b.created_at,

                    br.id AS branch_id,
                    br.name AS branch_name,
                    br.address AS branch_address,
                    br.phone AS branch_phone,

                    s.id AS service_id,
                    s.name AS service_name,
                    s.category AS service_category,

                    st.id AS staff_id,
                    st.name AS staff_name,
                    st.role AS staff_role

                FROM bookings b

                INNER JOIN branches br
                    ON br.id = b.branch_id

                INNER JOIN services s
                    ON s.id = b.service_id

                INNER JOIN staff st
                    ON st.id = b.staff_id

                WHERE
                    b.customer_id = ?

                    AND b.status = 'CONFIRMED'

                    AND (
                        DATE(b.booking_date) > CURDATE()

                        OR (
                            DATE(b.booking_date) = CURDATE()
                            AND b.booking_time >= CURTIME()
                        )
                    )

                ORDER BY
                    b.booking_date ASC,
                    b.booking_time ASC,
                    b.id ASC
                `,
                [customerId]
            );


        return res.status(200).json({

            success: true,

            count:
                rows.length,

            customer: {

                id:
                    customer.id,

                name:
                    customer.name,

                phone:
                    customer.phone,

                email:
                    customer.email
            },

            data:
                rows
        });

    } catch (error) {

        console.error(
            "GET MY APPOINTMENTS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch appointments.",
            error:
                error.message
        });
    }
}


// =====================================================
// GET MY BOOKING HISTORY
// CUSTOMER
// =====================================================

async function getMyBookingHistory(req, res) {

    try {

        const authorization =
            req.headers.authorization || "";


        if (
            !authorization.startsWith(
                "Bearer "
            )
        ) {

            return res.status(401).json({
                success: false,
                message:
                    "Authentication token is required."
            });
        }


        const token =
            authorization
                .substring(7)
                .trim();


        if (!token) {

            return res.status(401).json({
                success: false,
                message:
                    "Authentication token is required."
            });
        }


        const [
            customerRows
        ] =
            await pool.promise().query(
                `
                SELECT
                    c.id,
                    c.name,
                    c.phone,
                    c.email
                FROM customer_sessions cs
                INNER JOIN customers c
                    ON c.id = cs.customer_id
                WHERE
                    cs.session_token = ?
                    AND cs.expires_at > NOW()
                LIMIT 1
                `,
                [token]
            );


        if (
            customerRows.length === 0
        ) {

            return res.status(401).json({
                success: false,
                message:
                    "Session expired or invalid. Please login again."
            });
        }


        const customer =
            customerRows[0];

        const customerId =
            customer.id;


        const [
            rows
        ] =
            await pool.promise().query(
                `
                SELECT

                    b.id,
                    b.booking_number,

                    DATE_FORMAT(
                        b.booking_date,
                        '%Y-%m-%d'
                    ) AS booking_date,

                    b.booking_time,
                    b.service_price,
                    b.service_duration,
                    b.payment_method,
                    b.payment_status,
                    b.status,
                    b.notes,
                    b.created_at,

                    br.id AS branch_id,
                    br.name AS branch_name,
                    br.address AS branch_address,
                    br.phone AS branch_phone,

                    s.id AS service_id,
                    s.name AS service_name,
                    s.category AS service_category,

                    st.id AS staff_id,
                    st.name AS staff_name,
                    st.role AS staff_role

                FROM bookings b

                INNER JOIN branches br
                    ON br.id = b.branch_id

                INNER JOIN services s
                    ON s.id = b.service_id

                INNER JOIN staff st
                    ON st.id = b.staff_id

                WHERE
                    b.customer_id = ?

                    AND (
                        b.status = 'COMPLETED'

                        OR b.status = 'CANCELLED'

                        OR (
                            b.status = 'CONFIRMED'
                            AND (
                                DATE(b.booking_date) < CURDATE()

                                OR (
                                    DATE(b.booking_date) = CURDATE()
                                    AND b.booking_time < CURTIME()
                                )
                            )
                        )
                    )

                ORDER BY
                    b.booking_date DESC,
                    b.booking_time DESC,
                    b.id DESC
                `,
                [customerId]
            );


        return res.status(200).json({

            success: true,

            count:
                rows.length,

            customer: {

                id:
                    customer.id,

                name:
                    customer.name,

                phone:
                    customer.phone,

                email:
                    customer.email
            },

            data:
                rows
        });

    } catch (error) {

        console.error(
            "GET MY BOOKING HISTORY ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch booking history.",
            error:
                error.message
        });
    }
}


// =====================================================
// EXPORTS
// =====================================================

module.exports = {

    getAllBookings,

    getBookingById,

    createBooking,

    updateBookingStatus,

    getMyAppointments,

    getMyBookingHistory

};