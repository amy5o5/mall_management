const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connection = require('./../database/db_connect'); // اتصال به پایگاه داده
const router = express.Router();

// ثبت‌نام کاربر
router.post('/signup', async (req, res) => {
    const { full_name, national_id, mobile, email, password } = req.body;

    // بررسی اینکه آیا اطلاعات لازم ارسال شده است
    if (!full_name || !national_id || !mobile || !email || !password) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    try {
        // بررسی اینکه آیا ایمیل یا شماره موبایل قبلاً در سیستم ثبت شده است
        const checkExistingUserQuery = 'SELECT * FROM Users WHERE email = ? OR mobile = ?';
        const [existingUsers] = await connection.promise().query(checkExistingUserQuery, [email, mobile]);

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // هش کردن رمز عبور
        const hashedPassword = await bcrypt.hash(password, 10);

        // ذخیره کاربر در پایگاه داده
        const insertUserQuery = 'INSERT INTO Users (full_name, national_id, mobile, email, password) VALUES (?, ?, ?, ?, ?)';
        const [result] = await connection.promise().query(insertUserQuery, [full_name, national_id, mobile, email, hashedPassword]);

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// ورود کاربر
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    // بررسی اینکه آیا ایمیل و رمز عبور ارسال شده است
    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password' });
    }

    // بررسی اینکه آیا کاربر در سیستم موجود است
    connection.query('SELECT * FROM Users WHERE email = ?', [email], async (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }

        if (result.length === 0) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const user = result[0];

        // مقایسه رمز عبور ورودی با رمز عبور ذخیره‌شده
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // ایجاد توکن JWT
        const token = jwt.sign(
            { user_id: user.user_id, email: user.email },
            process.env.JWT_SECRET,  // باید در فایل .env تعریف شده باشد
            { expiresIn: '1h' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
        });
    });
});

module.exports = router;
