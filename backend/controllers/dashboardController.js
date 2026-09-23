const pool = require("../config/database");

const db = pool.promise();


function timeAgo(value) {
    if (!value) {
        return "Recently";
    }

    const created = new Date(value);
    const now = new Date();

    const seconds = Math.max(
        0,
        Math.floor(
            (now.getTime() - created.getTime()) / 1000
        )
    );

    if (seconds < 60) {
        return "Just now";
    }

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
        return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
        return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    }

    const days = Math.floor(hours / 24);

    if (days < 7) {
        return `${days} day${days === 1 ? "" : "s"} ago`;
    }

    return created.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


function normalizeMonth(value) {
    if (!value) {
        return null;
    }

    const month = String(value).trim();

    if (!/^\d{4}-\d{2}$/.test(month)) {
        return null;
    }

    const [year, monthNumber] = month
        .split("-")
        .map(Number);

    if (
        year < 2000 ||
        year > 2100 ||
        monthNumber < 1 ||
        monthNumber > 12
    ) {
        return null;
    }

    return month;
}


async function getDashboardOverview(req, res) {
    try {

        const selectedMonth =
            normalizeMonth(
                req.query.month
            );


        const currentMonth = new Date();

        const defaultMonth =
            `${currentMonth.getFullYear()}-${String(
                currentMonth.getMonth() + 1
            ).padStart(2, "0")}`;


        const activeMonth =
            selectedMonth || defaultMonth;


        const [selectedYear, selectedMonthNumber] =
            activeMonth
                .split("-")
                .map(Number);


        const selectedDate =
            new Date(
                selectedYear,
                selectedMonthNumber - 1,
                1
            );


        if (
            selectedDate.getFullYear() !==
                selectedYear ||
            selectedDate.getMonth() !==
                selectedMonthNumber - 1
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid month selected."
            });
        }


        const [statsRows] = await db.query(
            `
            SELECT

                (
                    SELECT COUNT(*)
                    FROM bookings
                    WHERE YEAR(booking_date) = ?
                    AND MONTH(booking_date) = ?
                ) AS total_bookings,

                (
                    SELECT COUNT(*)
                    FROM bookings
                    WHERE YEAR(booking_date) = ?
                    AND MONTH(booking_date) = ?
                    AND status = 'CONFIRMED'
                ) AS confirmed_bookings,

                (
                    SELECT COUNT(DISTINCT customer_id)
                    FROM bookings
                    WHERE YEAR(booking_date) = ?
                    AND MONTH(booking_date) = ?
                ) AS total_customers,

                (
                    SELECT COALESCE(
                        SUM(service_price),
                        0
                    )
                    FROM bookings
                    WHERE status = 'COMPLETED'
                    AND YEAR(booking_date) = ?
                    AND MONTH(booking_date) = ?
                ) AS monthly_revenue
            `,
            [
                selectedYear,
                selectedMonthNumber,

                selectedYear,
                selectedMonthNumber,

                selectedYear,
                selectedMonthNumber,

                selectedYear,
                selectedMonthNumber
            ]
        );


        const [recentBookings] =
            await db.query(
                `
                SELECT

                    b.id,
                    b.booking_number,
                    b.booking_date,
                    b.booking_time,
                    b.status,
                    b.service_price,

                    c.name AS customer_name,

                    s.name AS service_name,

                    br.name AS branch_name

                FROM bookings b

                INNER JOIN customers c
                    ON c.id = b.customer_id

                INNER JOIN services s
                    ON s.id = b.service_id

                INNER JOIN branches br
                    ON br.id = b.branch_id

                WHERE YEAR(b.booking_date) = ?
                AND MONTH(b.booking_date) = ?

                ORDER BY
                    b.booking_date DESC,
                    b.booking_time DESC,
                    b.id DESC

                LIMIT 5
                `,
                [
                    selectedYear,
                    selectedMonthNumber
                ]
            );


        const [branches] =
            await db.query(
                `
                SELECT

                    id,
                    name,
                    address,
                    is_active

                FROM branches

                ORDER BY
                    is_active DESC,
                    id ASC
                `
            );


        const [recentBookingActivities] =
            await db.query(
                `
                SELECT

                    b.id,
                    b.booking_number,
                    b.status,
                    b.created_at,

                    c.name AS customer_name

                FROM bookings b

                INNER JOIN customers c
                    ON c.id = b.customer_id

                WHERE YEAR(b.booking_date) = ?
                AND MONTH(b.booking_date) = ?

                ORDER BY
                    b.created_at DESC,
                    b.id DESC

                LIMIT 10
                `,
                [
                    selectedYear,
                    selectedMonthNumber
                ]
            );


        const [recentCustomerActivities] =
            await db.query(
                `
                SELECT

                    c.id,
                    c.name,
                    c.created_at

                FROM customers c

                INNER JOIN bookings b
                    ON b.customer_id = c.id

                WHERE YEAR(b.booking_date) = ?
                AND MONTH(b.booking_date) = ?

                GROUP BY
                    c.id,
                    c.name,
                    c.created_at

                ORDER BY
                    c.created_at DESC,
                    c.id DESC

                LIMIT 10
                `,
                [
                    selectedYear,
                    selectedMonthNumber
                ]
            );


        const activities = [];


        recentBookingActivities.forEach(
            (booking) => {

                let title =
                    `Booking ${
                        booking.booking_number ||
                        "#" + booking.id
                    } received from ${
                        booking.customer_name
                    }`;


                let icon =
                    "fa-calendar-check";


                if (
                    booking.status ===
                    "CANCELLED"
                ) {

                    title =
                        `Booking ${
                            booking.booking_number ||
                            "#" + booking.id
                        } was cancelled`;

                    icon =
                        "fa-calendar-xmark";
                }


                if (
                    booking.status ===
                    "COMPLETED"
                ) {

                    title =
                        `Booking ${
                            booking.booking_number ||
                            "#" + booking.id
                        } was completed`;

                    icon =
                        "fa-circle-check";
                }


                activities.push({
                    type: "booking",

                    created_at:
                        booking.created_at,

                    title,

                    icon,

                    time_label:
                        timeAgo(
                            booking.created_at
                        )
                });

            }
        );


        recentCustomerActivities.forEach(
            (customer) => {

                activities.push({
                    type: "customer",

                    created_at:
                        customer.created_at,

                    title:
                        `Customer ${
                            customer.name
                        } had activity in this month`,

                    icon:
                        "fa-user",

                    time_label:
                        timeAgo(
                            customer.created_at
                        )
                });

            }
        );


        activities.sort(
            (a, b) => {

                return (
                    new Date(
                        b.created_at
                    ) -
                    new Date(
                        a.created_at
                    )
                );

            }
        );


        const stats = statsRows[0];


        return res.status(200).json({

            success: true,

            data: {

                selectedMonth:
                    activeMonth,

                stats: {

                    totalBookings:
                        Number(
                            stats.total_bookings ||
                            0
                        ),

                    confirmedBookings:
                        Number(
                            stats.confirmed_bookings ||
                            0
                        ),

                    totalCustomers:
                        Number(
                            stats.total_customers ||
                            0
                        ),

                    monthlyRevenue:
                        Number(
                            stats.monthly_revenue ||
                            0
                        )

                },

                recentBookings,

                activities:
                    activities.slice(0, 4),

                branches

            }

        });


    } catch (error) {

        console.error(
            "❌ Dashboard Overview Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to load dashboard data.",

            error:
                error.message

        });

    }
}


module.exports = {
    getDashboardOverview
};