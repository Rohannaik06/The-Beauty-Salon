const pool = require("../config/database");

const db = pool.promise();


async function updateAdminSettings(req, res) {

    try {

        const {
            adminId,
            currentEmail,
            newEmail,
            currentPassword,
            newPassword
        } = req.body;


        const id = Number(adminId);

        const oldEmail = String(
            currentEmail || ""
        )
            .trim()
            .toLowerCase();


        const updatedEmail = String(
            newEmail || ""
        )
            .trim()
            .toLowerCase();


        const oldPassword = String(
            currentPassword || ""
        );


        const updatedPassword = String(
            newPassword || ""
        );


        if (!id) {

            return res.status(400).json({
                success: false,
                message: "Admin ID is required."
            });

        }


        if (!oldEmail) {

            return res.status(400).json({
                success: false,
                message: "Current email is required."
            });

        }


        if (!oldPassword) {

            return res.status(400).json({
                success: false,
                message: "Current password is required."
            });

        }


        if (
            !updatedEmail &&
            !updatedPassword
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Please enter a new email or new password."
            });

        }


        if (
            updatedEmail &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                updatedEmail
            )
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Please enter a valid email address."
            });

        }


        if (
            updatedPassword &&
            updatedPassword.length < 6
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "New password must be at least 6 characters."
            });

        }


        const [adminRows] = await db.query(
            `
            SELECT
                id,
                email,
                password
            FROM admins
            WHERE id = ?
              AND email = ?
            LIMIT 1
            `,
            [
                id,
                oldEmail
            ]
        );


        if (adminRows.length === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "Administrator account not found."
            });

        }


        const admin = adminRows[0];


        if (
            admin.password !==
            oldPassword
        ) {

            return res.status(401).json({
                success: false,
                message:
                    "Current password is incorrect."
            });

        }


        if (
            updatedEmail &&
            updatedEmail !== admin.email
        ) {

            const [emailRows] = await db.query(
                `
                SELECT id
                FROM admins
                WHERE email = ?
                  AND id != ?
                LIMIT 1
                `,
                [
                    updatedEmail,
                    id
                ]
            );


            if (emailRows.length > 0) {

                return res.status(409).json({
                    success: false,
                    message:
                        "This email address is already being used."
                });

            }

        }


        const finalEmail =
            updatedEmail ||
            admin.email;


        const finalPassword =
            updatedPassword ||
            admin.password;


        await db.query(
            `
            UPDATE admins
            SET
                email = ?,
                password = ?
            WHERE id = ?
            `,
            [
                finalEmail,
                finalPassword,
                id
            ]
        );


        return res.status(200).json({

            success: true,

            message:
                "Administrator settings updated successfully.",

            admin: {
                id: id,
                email: finalEmail
            }

        });


    } catch (error) {

        console.error(
            "❌ Update Admin Settings Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to update administrator settings."

        });

    }

}


module.exports = {
    updateAdminSettings: updateAdminSettings
};