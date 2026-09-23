const express = require("express");

const router = express.Router();


const {
    getDashboardOverview
} = require(
    "../controllers/dashboardController"
);


router.get(
    "/overview",
    getDashboardOverview
);


module.exports = router;