const connection = require('../database/db_connect');

const visit_recorder = async (req, res, next) => {
    const ipAddress = req.ip || req.connection.remoteAddress; 
    const userAgent = req.headers['user-agent']; 
    const today = new Date().toISOString().split('T')[0]; 

    try {
       
        const query = `
            SELECT * FROM Requests_Log
            WHERE ip_address = ? AND user_agent = ? AND visit_date = ?
        `;
        const [results] = await connection.promise().query(query, [ipAddress, userAgent, today]);

        if (results.length > 0) {
            // اگر بازدید وجود دارد، شمارنده را افزایش بده
            const updateQuery = `
                UPDATE Requests_Log
                SET visit_count = visit_count , last_visit = NOW()
                WHERE log_id = ?
            `;
            await connection.promise().query(updateQuery, [results[0].log_id]);
        } else {
            // اگر بازدید جدید است، آن را ثبت کنید
            const insertQuery = `
                INSERT INTO Requests_Log (ip_address, user_agent, visit_date, visit_count)
                VALUES (?, ?, ?, 1)
            `;
            await connection.promise().query(insertQuery, [ipAddress, userAgent, today]);
        }
    } catch (error) {
        console.error('Error in visit_recorder:', error);
    }

    next(); 
};

module.exports = visit_recorder;