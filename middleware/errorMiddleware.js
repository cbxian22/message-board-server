// 通用錯誤處理
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "伺服器錯誤" });
};

module.exports = errorHandler;
