const express = require('express');
const router = express.Router();

router.get('/login', (req, res) => {
    res.render('admin/admin-login');
});

router.get('/admin-panel', checkRoles('admin'), (req, res) => {
    res.render('admin/mainPanel-admin');
});