const express = require('express');
const bcrypt = require('bcryptjs');
const connection = require('../database/db_connect');
const router = express.Router();
const nodemailer = require('nodemailer');
const crypto = require('crypto');


// ثبت نام پزشک
router.post('/signup', async (req, res) => {
    const { full_name, email, username, password, mobile } = req.body;
    console.log(req.body);

    // بررسی اینکه همه فیلدهای ضروری ارسال شده باشند
    if (!full_name || !email || !username || !password || !mobile) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    try {
        // بررسی اینکه ایمیل، نام کاربری یا شماره موبایل تکراری نباشد
        connection.query(
            'SELECT * FROM security_guy WHERE email = ? OR username = ? OR mobile = ?',
            [email, username, mobile],
            async (err, result) => {
                if (err) {
                    console.error("❌ Database error:", err);
                    return res.status(500).json({ message: 'Database error', error: err });
                }

                if (result.length > 0) {
                    return res.status(400).json({ message: 'Email, username, or mobile already exists' });
                }

                // هش کردن رمز عبور
                const hashedPassword = await bcrypt.hash(password, 10);

                // ثبت اطلاعات در دیتابیس
                connection.query(
                    'INSERT INTO security_guy (full_name, email, username, password, mobile) VALUES (?, ?, ?, ?, ?)',
                    [full_name, email, username, hashedPassword, mobile],
                    (err, result) => {
                        if (err) {
                            console.error("❌ Database insert error:", err);
                            return res.status(500).json({ message: 'Database error', error: err });
                        }

                        res.status(201).json({ message: 'Security guy registered successfully' });
                    }
                );
            }
        );
    } catch (error) {
        console.error("❌ Server error:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
router.post('/login', (req, res) => {
    const { emailOrPhone, password } = req.body;
    console.log("📩 درخواست لاگین دریافت شد:", emailOrPhone, password);

    if (!emailOrPhone || !password) {
        console.log("⚠️ فیلدها خالی هستند!");
        return res.status(400).json({ message: 'Please provide email/phone and password' });
    }

    connection.query(
        'SELECT * FROM security_guy WHERE email = ? OR mobile = ?',
        [emailOrPhone, emailOrPhone],
        async (err, result) => {
            if (err) {
                console.log("❌ خطای دیتابیس:", err);
                return res.status(500).json({ message: 'Database error' });
            }

            console.log("✅ نتیجه جستجو از دیتابیس:", result);

            if (result.length === 0) {
                console.log("⚠️ کاربر یافت نشد!");
                return res.status(400).json({ message: 'Invalid email, phone, or password' });
            }

            const secGuy = result[0];
            console.log(secGuy);
            console.log("🔑 کاربر پیدا شد:", secGuy);

            try {
                const isMatch = await bcrypt.compare(password, secGuy.password);
                console.log("🔍 بررسی رمز عبور:", isMatch);

                if (!isMatch) {
                    console.log("❌ رمز اشتباه است!");
                    return res.status(400).json({ message: 'Invalid email, phone, or password' });
                }

                req.session.secGuy = {
                    id: secGuy.security_guy_id,
                    full_name: secGuy.full_name,
                    email: secGuy.email,
                    mobile: secGuy.mobile
                };
                console.log("✅ ورود موفق!");

                res.json({ message: 'Login successful' });

            } catch (error) {
                console.log("❌ خطای bcrypt:", error);
                return res.status(500).json({ message: 'Server error' });
            }
        }
    );
});



router.post('/secGuy/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed' });
        }
        res.clearCookie('connect.sid'); // حذف کوکی سشن
        res.json({ message: 'Logged out successfully' });
    });
});





const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS 
    }
});


router.post("/forgot-password", (req, res) => {
    const { emailOrPhone } = req.body;

    console.log(emailOrPhone);

    // جستجو در دیتابیس برای پزشک بر اساس ایمیل یا شماره موبایل
    connection.query(
        "SELECT email FROM security_guy WHERE email = ? OR mobile = ?",
        [emailOrPhone, emailOrPhone],
        (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Database error" });
            }

            if (result.length === 0) {
                return res.status(400).json({ message: "Doctor not found" });
            }

            const userEmail = result[0].email;

            // ایجاد توکن ریست پسورد
            const resetToken = crypto.randomBytes(32).toString("hex");

            // ذخیره توکن در دیتابیس
            connection.query(
                "UPDATE security_guy SET reset_token = ?, reset_token_expiry = DATE_ADD(NOW(), INTERVAL 30 MINUTE) WHERE email = ?",
                [resetToken, userEmail],
                (err) => {
                    if (err) {
                        return res.status(500).json({ message: "Database error" });
                    }

                    // ارسال ایمیل به پزشک
                    const resetLink = `http://192.168.1.183:5000/securityGuy-reset-password/${resetToken}`;
                    const mailOptions = {
                        from: process.env.EMAIL_USER,
                        to: userEmail,
                        subject: "بازیابی رمز عبور پزشک",
                        text: `برای تغییر رمز عبور روی لینک زیر کلیک کنید:\n${resetLink}`
                    };

                    transporter.sendMail(mailOptions, (err, info) => {
                        if (err) {
                            return res.status(500).json({ message: "Failed to send email" });
                        }

                        res.json({ message: "Password reset link sent to your email" });
                    });
                }
            );
        }
    );
});




router.post("/set-new-docPassword", async (req, res) => {
    const { token, password, confirm_password } = req.body;
    console.log(req.body);

    if (password !== confirm_password) {
        return res.status(400).json({ message: "Passwords do not match" });
    }

    try {
        // هش کردن رمز عبور جدید
        const hashedPassword = await bcrypt.hash(password, 10);

        // بررسی توکن و تنظیم رمز جدید
        connection.query(
            "SELECT email FROM security_guy WHERE reset_token = ? AND reset_token_expiry > NOW()",
            [token],
            (err, result) => {
                if (err) {
                    return res.status(500).json({ message: "Database error" });
                }

                if (result.length === 0) {
                    return res.status(400).json({ message: "Invalid or expired token" });
                }

                const userEmail = result[0].email;

                connection.query(
                    "UPDATE security_guy SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE email = ?",
                    [hashedPassword, userEmail],
                    (err) => {
                        if (err) {
                            return res.status(500).json({ message: "Database error" });
                        }

                        res.json({ message: "Password successfully reset" });
                    }
                );
            }
        );
    } catch (error) {
        return res.status(500).json({ message: "Error hashing password", error });
    }
});




module.exports = router;
