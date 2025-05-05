const express = require('express');
const router = express.Router();
const { checkRoles } = require('./../../middlewares/check-actor');
const adminAuth = require('./adminAuth');
const { getDailyVisits } = require('./manageStuff');
const connection = require('../../database/db_connect');

const { sendEmail } = require('../../utils/mailer');

router.use('/adminAuth',adminAuth);

router.get('/login', (req, res) => {
    res.render('admin/login');
});


router.get('/admin-panel',checkRoles('admin') ,async (req, res) => {
    try {
        const dailyVisits = await getDailyVisits();

        // تبدیل تعداد بازدیدها به اعداد فارسی
        const formattedVisits = dailyVisits.map(visit => ({
            visit_date: visit.visit_date,
            total_visits: new Intl.NumberFormat('fa-IR').format(visit.total_visits)
        }));

        res.render('admin/mainPanel-admin', {
            dailyVisits: formattedVisits,
            date: new Intl.DateTimeFormat('fa-IR').format(new Date()),
            time: new Date().toLocaleTimeString('fa-IR')
        });
    } catch (error) {
        console.error('Error in /admin-panel route:', error);
        res.status(500).render('admin/mainPanel-admin', {
            dailyVisits: [],
            error: error.message
        });
    }
});

router.get('/add-shop', checkRoles('admin'), (req, res) => {
    res.render('admin/add-shop', {
        date: new Intl.DateTimeFormat('fa-IR').format(new Date()),
        time: new Date().toLocaleTimeString('fa-IR')
    });
});

router.use('/sendBulkEmails', checkRoles('admin'), require('./sendBulkEmails'));

router.use('/manageStuff', checkRoles('admin'), require('./manageStuff'));

module.exports = router;