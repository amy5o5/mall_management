const express = require('express');
const bcrypt = require('bcryptjs');
const connection = require('./../database/db_connect');
const router = express.Router();


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

module.exports = router;
