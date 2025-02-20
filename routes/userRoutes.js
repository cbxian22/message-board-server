// const express = require("express");
// const router = express.Router();
// const userController = require("../controllers/userController");
// const updateController = require("../controllers/updateController");

// router.put("/:name", updateController.updateUserProfile);
// router.get("/:name", userController.getUserByUsername);

// module.exports = router;

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
