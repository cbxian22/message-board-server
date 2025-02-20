const express = require("express");
const {
  getUserByUsername,
  updateUserProfile,
  deleteUser,
} = require("../controllers/userController");

const router = express.Router();

router.get("/:name", getUserByUsername);
router.put("/:name", updateUserProfile);
router.delete("/:name", deleteUser);

module.exports = router;
