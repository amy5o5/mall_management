const express = require('express');
const bcrypt = require('bcryptjs');
const connection = require('./../database/db_connect');
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


router.post('/login', (req, res) => {
    const { emailOrPhone, password } = req.body;

    // بررسی اینکه آیا ایمیل یا شماره تلفن و رمز عبور ارسال شده است
    if (!emailOrPhone || !password) {
        return res.status(400).json({ message: 'Please provide email/phone and password' });
    }

    // تشخیص اینکه ورودی ایمیل است یا شماره تلفن
    const query = emailOrPhone.includes('@') ? 
        'SELECT * FROM Users WHERE email = ?' : 
        'SELECT * FROM Users WHERE mobile = ?';

    // بررسی اینکه آیا کاربر در سیستم موجود است
    connection.query(query, [emailOrPhone], async (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }

        if (result.length === 0) {
            return res.status(400).json({ message: 'Invalid email/phone or password' });
        }

        const user = result[0];

        // مقایسه رمز عبور ورودی با رمز عبور ذخیره‌شده
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email/phone or password' });
        }

        req.session.user = {
            id: user.user_id,
            full_name: user.full_name,
            email: user.email,
            role: user.role
        };

        res.json({ message: 'Login successful' });
    });
});

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ message: 'Logout failed' });
        }

        // حذف کوکی سشن
        res.clearCookie('connect.sid');

        // هدایت به صفحه لاگین
        res.redirect('/login');
    });
});

module.exports = router;
