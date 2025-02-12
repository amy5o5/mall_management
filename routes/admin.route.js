require("dotenv").config();
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const db_connect = require("./../database/db_connect");
const checkAccess = require('./../middlewares/check-actor.middleware');
const bcrypt = require('bcrypt');


router.get("/panel",checkAccess(["admin"]), (req, res) => {
  res.render("admin", { error: null });
});


router.post("/add-user", checkAccess(["admin"]), (req, res) => {
  const { full_name, email, password, phone_number, shop_name, address, description } = req.body;

  if (!full_name || !email || !password || !shop_name || !address) {
    return res.status(400).send("همه فیلدهای ضروری را پر کنید!");
  }

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error("❌ Error hashing password:", err);
      return res.status(500).send("خطای سرور");
    }

    const sql = `INSERT INTO shop_owners (full_name, email, password, phone_number, shop_name, address, description) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;

    const values = [full_name, email, hashedPassword, phone_number || null, shop_name, address, description || null];

    // استفاده از query به جای execute
    db_connect.query(sql, values, (err, results) => {
      if (err) {
        console.error("❌ Error executing query:", err);
        return res.status(500).send("خطا در افزودن کاربر!");
      }

      res.redirect("/admin/panel"); // بعد از ثبت، صفحه را دوباره بارگذاری می‌کند
    });
  });
});
module.exports = router;
