const db = require("../config/db");
const bcrypt = require("bcrypt");

// 初始化資料
const seedData = async () => {
  try {
    // 清空資料表
    await db.promise().query("DELETE FROM users");
    await db.promise().query("DELETE FROM posts");
    await db.promise().query("DELETE FROM replies");

    // 新增管理員
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await db
      .promise()
      .query("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", [
        "admin",
        hashedPassword,
        "admin",
      ]);

    // 新增一般使用者
    await db
      .promise()
      .query("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", [
        "user1",
        hashedPassword,
        "user",
      ]);
    await db
      .promise()
      .query("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", [
        "user2",
        hashedPassword,
        "user",
      ]);

    console.log("資料初始化完成");

    // 程式結束
    process.exit();
  } catch (err) {
    console.error("初始化資料錯誤:", err);
    process.exit(1); // 若發生錯誤，退出程式
  }
};

// 呼叫初始化種子資料
seedData();
