const express = require('express');
const router = express.Router();
const userAuth = require('./user-auth');
const connection = require('./../../database/db_connect');
const { checkRoles } = require('./../../middlewares/check-actor');

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


router.get('/test', (req,res) => {
  console.log('Session after login:', req.session);
  res.send('test')
})




module.exports = router;