const express = require('express');
const router = express.Router();
const { checkRoles } = require('./../../middlewares/check-actor');
const adminAuth = require('./adminAuth');
const { getDailyVisits } = require('./../../utils/dailyVisites');
const connection = require('../../database/db_connect');

const { sendEmail } = require('../../utils/mailer');

router.use('/adminAuth',adminAuth);

router.get('/login', (req, res) => {
    res.render('admin/login');
});


router.get('/admin-panel',checkRoles('admin') ,async (req, res) => {
    try {
        const dailyVisits = await getDailyVisits();
        //console.log(dailyVisits);


        const formattedVisits = dailyVisits.map(visit => ({
            visit_date: visit.visit_date,
            total_visits: new Intl.NumberFormat('fa-IR').format(visit.total_visits),
            time: new Date().toLocaleTimeString('fa-IR')
        }));

        res.render('admin/mainPanel-admin', {
            title: 'پنل مدیریت', 
            dailyVisits: formattedVisits,
            date: new Intl.DateTimeFormat('fa-IR').format(new Date()),
            time: new Date().toLocaleTimeString('fa-IR')
        });
    } catch (error) {
        console.error('Error in /admin-panel route:', error);
        res.status(500).render('admin/mainPanel-admin', {
            dailyVisits: [],
            error: error.message,
            date: new Intl.DateTimeFormat('fa-IR').format(new Date()),
            time: new Date().toLocaleTimeString('fa-IR') 
        });
    }
});



router.use('/sendBulkEmails', checkRoles('admin'), require('./sendBulkEmails'));

router.use('/manageShpks', checkRoles('admin'), require('./manageShpks'));

module.exports = router;