const express = require('express');
const router = express.Router();
const userAuth = require('./user-auth');
const connection = require('./../../database/db_connect');
const { checkRoles } = require('./../../middlewares/check-actor');
const { getShops } = require('./../../utils/getShops');


router.use('/userAuth', userAuth);

const userProfile = require('./user-profile');
router.use('/profile',userProfile);



router.get("/login", (req, res) => {
  res.render("user/login");
});

router.get("/signup", (req, res) => {
  res.render("user/login");
});

router.get('/user-forgot-password', (req, res) => {
  res.render('user/user-forgot-password');
});

router.get("/user-reset-password/:token", (req, res) => {
  const { token } = req.params;
  res.render("user/user-reset-password", { token, errorMessage: null });
});
const moment = require('moment-jalaali'); // وارد کردن moment-jalaali

// تابع برای تبدیل اعداد انگلیسی به فارسی
function toPersianNumber(number) {
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return number.toString().replace(/\d/g, (digit) => persianNumbers[digit]);
}

router.get("/shopPage/:shop_id", async (req, res) => {
  const { shop_id } = req.params;
const user = req.session.user;
  let seller = null;
  if (req.session.user && req.session.user.role === 'shpk') {
      seller = req.session.user;
  }

  console.log(user);
  try {
    // دریافت لیست مغازه‌ها
    const shops = await getShops(); 
    const shop = shops.find(s => s.shop_id == shop_id); // پیدا کردن مغازه با شماره مربوطه

    if (!shop) {
      return res.status(404).send("مغازه مورد نظر یافت نشد.");
    }

    // دریافت نظرات برای shopId خاص
    const sql = 'SELECT * FROM comments WHERE shop_id = ?';
    
    connection.query(sql, [shop_id], (err, comments) => {
      if (err) {
        console.error('خطا در دریافت نظرات:', err);
        return res.status(500).send("مشکلی در دریافت نظرات رخ داده است");
      }

      // فرمت کردن تاریخ و ساعت به تاریخ هجری شمسی و تبدیل اعداد به فارسی
      comments.forEach(comment => {
        const date = moment(comment.created_at).format('jYYYY-jMM-jDD HH:mm:ss'); // تبدیل به تاریخ شمسی
        comment.created_at = toPersianNumber(date); // تبدیل اعداد به فارسی
      });

      // ارسال اطلاعات مغازه و نظرات به صفحه
      res.render("user/shopPage", { 
        currentUrl: req.originalUrl || null,
        seller: seller,
        shop,
        comments: comments, // ارسال نظرات به صفحه
        iSuser: req.session.user || null,
        user
      });
    });

  } catch (error) {
    console.error("Error fetching shop details:", error);
    res.status(500).send("خطا در دریافت اطلاعات مغازه.");
  }
});




module.exports = router;