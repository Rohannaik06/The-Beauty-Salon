const express = require("express");

const router = express.Router();

const {
    getAllBranches,
    getBranchById,
    createBranch,
    updateBranch,
    deleteBranch
} = require("../controllers/branchController");


// GET ALL BRANCHES
router.get("/", getAllBranches);


// GET SINGLE BRANCH
router.get("/:id", getBranchById);


// ADD BRANCH
router.post("/", createBranch);


// UPDATE BRANCH
router.put("/:id", updateBranch);


// DELETE BRANCH
router.delete("/:id", deleteBranch);


module.exports = router;