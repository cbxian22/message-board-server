const express = require("express");
const router = express.Router();
const likeController = require("../controllers/likeController");

router.post("/:userId", likeController.likeItem);

module.exports = router;
