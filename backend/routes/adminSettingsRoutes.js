const express = require("express");

const router = express.Router();


const {
    updateAdminSettings
} = require("../controllers/adminSettingsController");


router.put(
    "/",
    updateAdminSettings
);


module.exports = router;