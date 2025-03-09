const express = require('express');
const bcrypt = require('bcryptjs');
const connection = require('./../database/db_connect');
const router = express.Router();
const nodemailer = require('nodemailer');
const crypto = require('crypto');


// ثبت نام پزشک
router.post('/signup', async (req, res) => {
    const { full_name, specialty, medical_license_number, email, username, password } = req.body;

    // بررسی اینکه همه فیلدها ارسال شده باشند
    if (!full_name || !specialty || !medical_license_number || !email || !username || !password) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    try {
        // بررسی اینکه ایمیل یا نام کاربری قبلاً ثبت شده است
        connection.query(
            'SELECT * FROM Doctors WHERE email = ? OR username = ?',
            [email, username],
            async (err, result) => {
                if (err) {
                    return res.status(500).json({ message: 'Database error' });
                }
                if (result.length > 0) {
                    return res.status(400).json({ message: 'Email or username already exists' });
                }

                // هش کردن رمز عبور
                const hashedPassword = await bcrypt.hash(password, 10);

                // ذخیره پزشک در پایگاه داده
                connection.query(
                    'INSERT INTO Doctors (full_name, specialty, medical_license_number, email, username, password) VALUES (?, ?, ?, ?, ?, ?)',
                    [full_name, specialty, medical_license_number, email, username, hashedPassword],
                    (err, result) => {
                        if (err) {
                            return res.status(500).json({ message: 'Database error' });
                        }
                        res.status(201).json({ message: 'Doctor registered successfully' });
                    }
                );
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/login', (req, res) => {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
        return res.status(400).json({ message: 'Please provide email/phone and password' });
    }

    // جستجو در دیتابیس با ایمیل یا شماره موبایل
    connection.query(
        'SELECT * FROM Doctors WHERE email = ? OR mobile = ?',
        [emailOrPhone, emailOrPhone],
        async (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Database error' });
            }

            if (result.length === 0) {
                return res.status(400).json({ message: 'Invalid email, phone, or password' });
            }

            const doctor = result[0];

            // بررسی رمز عبور
            const isMatch = await bcrypt.compare(password, doctor.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Invalid email, phone, or password' });
            }

            req.session.doctor = {
                id: doctor.doctor_id,
                full_name: doctor.full_name,
                email: doctor.email,
                mobile: doctor.mobile
            };

            res.json({ message: 'Login successful' });
        }
    );
});



router.post('/doctor/logout', (req, res) => {
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
        "SELECT email FROM Doctors WHERE email = ? OR mobile = ?",
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
                "UPDATE Doctors SET reset_token = ?, reset_token_expiry = DATE_ADD(NOW(), INTERVAL 30 MINUTE) WHERE email = ?",
                [resetToken, userEmail],
                (err) => {
                    if (err) {
                        return res.status(500).json({ message: "Database error" });
                    }

                    // ارسال ایمیل به پزشک
                    const resetLink = `http://192.168.1.183:5000/doctor-reset-password/${resetToken}`;
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
            "SELECT email FROM Doctors WHERE reset_token = ? AND reset_token_expiry > NOW()",
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
                    "UPDATE Doctors SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE email = ?",
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
