const express = require("express");
const router = express.Router();
const uploadController = require("../controllers/uploadController");

router.get("/generate-signed-url", uploadController.generateSignedUrl);

module.exports = router;
