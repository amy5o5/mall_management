const express = require('express');
const router = express.Router();
const userAuth = require('./user-auth');

router.use('/userAuth', userAuth);

router.get("/user-profile", (req, res) => {
    res.send("hey");
  });
  
  router.get('/user-forgot-password', (req, res) => {
    res.render('user/user-forgot-password');
  });
  
  router.get("/user-reset-password/:token", (req, res) => {
    const { token } = req.params;
    res.render("user/user-reset-password", { token, errorMessage: null });
  });
  
  router.get("/login", (req, res) => {
    res.render("user/login");
  });
  
  router.get("/signup", (req, res) => {
    res.render("user/login");
  });

module.exports = router;