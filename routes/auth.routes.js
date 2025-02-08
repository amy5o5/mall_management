const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const session = require("express-session");
const db_connect = require("./../database/db_connect");

router.use(session({
    secret: "mySecretKey",  // مقدار دلخواه
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }  // برای HTTPS باید true باشه
  }));

router.get("/login", (req, res) => {
  res.render("login", { error: null });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("req:", req.body);

  try {
    db_connect.query(
      "SELECT * FROM shop_owners WHERE email = ?",
      [email],
      async (err, rows) => {
        if (err) {
          console.error("❌ Error in DB query:", err);
          return res.render("login", { error: "خطایی رخ داده" });
        }

        console.log("Rows type:", typeof rows);

        if (rows.length === 0) {
          return res.render("login", {
            error: "نام کاربری یا رمز اشتباه است خالی",
          });
        }

        const user = rows[0];
        console.log("🔹 Query Result:", rows);

        // مقایسه رمز عبور
        if (password !== user.password) {
          return res.render("login", { error: "نام کاربری یا رمز اشتباه است" });
        }

        req.session.user = {
            id: user.id,
            full_name: user.full_name,
            email: user.email
          };
        res.redirect("/");
      }
    );
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    res.render("login", { error: "خطایی رخ داده" });
  }
});

module.exports = router;
