require("dotenv").config();
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const db_connect = require("../database/db_connect");

router.get("/login", (req, res) => {
  res.render("login", { error: null });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  db_connect.query(
    "SELECT * FROM shop_owners WHERE email = ?",
    [email],
    (err, results) => {
      if (err) {
        console.error("❌ Database error:", err);
        return res.status(500).json({ error: "خطای سرور" });
      }

      // بررسی اینکه آیا کاربر وجود دارد یا نه
      if (results.length === 0) {
        return res
          .status(401)
          .json({ error: "نام کاربری یا رمز عبور اشتباه است" });
      }

      const user = results[0];

      // بررسی رمز عبور (بدون هش)
      if (user.password !== password) {
        return res
          .status(401)
          .json({ error: "نام کاربری یا رمز عبور اشتباه است" });
      }

      // بررسی اینکه کاربر ادمین است یا نه
      const isAdmin = user.is_admin === 1;

      // ایجاد توکن JWT
      const token = jwt.sign(
        {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          admin: isAdmin,
        },
        process.env.JWT_SECRET,
        { expiresIn: "20m" }
      );

      // ذخیره توکن در کوکی
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 120 * 1000, // 2 دقیقه
      });

      // هدایت (Redirect) به صفحه مناسب
      if (isAdmin) {
        return res.redirect("/admin/panel");
      } else {
        return res.redirect("/");
      }
    }
  );
});

module.exports = router;
