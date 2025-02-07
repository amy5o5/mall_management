const express = require('express');
const router = express.Router();


router.get("/login", (req, res) => {
    res.render('login', { error: null });
  });

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    console.log("hi");
    // چک کردن صحت نام کاربری و رمز عبور
    if (username !== 'validUsername' || password !== 'validPassword') {
        return res.render('login', { error: 'نام کاربری یا رمز عبور اشتباه است' });
    }

    // ادامه‌ی روند ورود
    res.redirect('/dashboard');
});

module.exports = router;