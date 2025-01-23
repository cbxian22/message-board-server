const { body, validationResult } = require("express-validator");

// 請求驗證
const validatePost = [
  body("title").isLength({ min: 3 }).withMessage("標題至少 3 個字"),
  body("content").isLength({ min: 10 }).withMessage("內容至少 10 個字"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

module.exports = {
  validatePost,
};
