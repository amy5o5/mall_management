const express = require('express');
const router = express.Router();
const { sendEmail } = require('./../../utils/mailer');
const connection = require('./../../database/db_connect');

// Helper function to execute database queries with Promises
const executeQuery = (query, params = []) => {
    return new Promise((resolve, reject) => {
        connection.query(query, params, (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};

router.post('/', async (req, res) => {
    const { subject, text } = req.body;

    // Validate input
    if (!subject || !text) {
        return res.status(400).json({ message: 'موضوع و متن ایمیل الزامی است.' });
    }

    try {
        // Fetch users who have opted in for newsletters
        const query = "SELECT email FROM Users WHERE get_news = 1";
        const results = await executeQuery(query);

        if (results.length === 0) {
            return res.status(404).json({ message: 'هیچ کاربری با get_news = 1 یافت نشد.' });
        }

        // Send emails to all users
        const emailPromises = results.map(user => 
            sendEmail(user.email, subject, text)
                .then(() => console.log(`Email sent to: ${user.email}`))
                .catch(err => console.error(`Failed to send email to: ${user.email}`, err))
        );

        await Promise.all(emailPromises);

        res.json({ message: 'ایمیل‌ها با موفقیت ارسال شدند!' });
    } catch (error) {
        console.error("Error in /send-bulk-emails route:", error);
        res.status(500).json({ message: 'خطا در ارسال ایمیل‌ها.' });
    }
});

module.exports = router;