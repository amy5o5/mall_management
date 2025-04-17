const express = require('express');
const app = express();
const router = express.Router();
const { checkRoles } = require('./../../middlewares/check-actor');
const connection = require('./../../database/db_connect');
const shopkeeperAuth = require('./shopkeeper-auth');



router.use('/shopkeeperAuth', shopkeeperAuth);

router.get("/login", (req, res) => {
  res.render("shop_keeper/shopkeeper-login");
});


router.get('/shkeeper-forgot-password', (req, res) => {
  res.render('shop_keeper/shkeeper-forgot-password');
});

router.get("/set-shkeeper-new-Password/:token", (req, res) => {
  const { token } = req.params;
  
  res.render("shop_keeper/shkeeper-reset-password", { token, errorMessage: null });
});

router.get("/shk-profile", (req, res) => {

  
  res.render("shop_keeper/shop_owner_profile");
});



module.exports = router;