require("dotenv").config();
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const db_connect = require("../database/db_connect");

router.get("/login", (req, res) => {
  res.render("login", { error: null });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  // console.log("req:", req.body);

  try {
    db_connect.query(
      "SELECT * FROM shop_owners WHERE email = ?",
      [email],
      (err, results) => {
        if (err) {
          console.error("❌ Database error:", err);
          return res.status(500).json({ error: "خطای سرور" });
        }
        if (results.length === 0 || results[0].password !== password) {
          return res
            .status(401)
            .json({ error: "نام کاربری یا رمز عبور اشتباه است" });
        }

        const user = {
          id: results[0].id,
          full_name: results[0].full_name,
          email: results[0].email,
        };

        const token = jwt.sign(user, process.env.JWT_SECRET, {
          expiresIn: "1m", // توکن بعد از 1 دقیقه منقضی می‌شود
        });

        res.cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 1000, // کوکی هم بعد از 1 دقیقه منقضی می‌شود
        });

        res.json({ message: "ورود موفق", token });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطایی رخ داده" });
  }
});

module.exports = router;
