const express = require('express');
const router = express.Router();
const { checkRoles } = require('./../../middlewares/check-actor');
const adminAuth = require('./adminAuth');


router.use('/adminAuth',adminAuth);

router.get('/login', (req, res) => {
    res.render('admin/login');
});

router.get('/admin-panel', checkRoles('admin'), (req, res) => {
    res.render('admin/mainPanel-admin');
});

module.exports = router;