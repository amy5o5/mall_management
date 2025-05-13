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

router.get("/shopPage/:shop_id", async (req, res) => {
  const { shop_id } = req.params;
  
  let seller = null;
  if (req.session.user && req.session.user.role === 'shpk') {
      seller = req.session.user;
  }

  try {
    
    const shops = await getShops(); // دریافت لیست مغازه‌ها
    const shop = shops.find(s => s.shop_id == shop_id); // پیدا کردن مغازه با شماره مربوطه

    if (!shop) {
      return res.status(404).send("مغازه مورد نظر یافت نشد.");
    }
    
    res.render("user/shopPage", { 
      currentUrl: req.originalUrl ||null,
      seller: seller,
      shop,
      user: req.session.user || null
     }); // ارسال اطلاعات مغازه به صفحه

     //console.log('shopId:', shopId);
  } catch (error) {
    console.error("Error fetching shop details:", error);
    res.status(500).send("خطا در دریافت اطلاعات مغازه.");
  }
});





module.exports = router;