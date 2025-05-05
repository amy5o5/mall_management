const connection = require('../database/db_connect');

async function getDailyVisits() {
  try {
    const query = `
      SELECT visit_date, SUM(visit_count) AS total_visits
      FROM Requests_Log
      GROUP BY visit_date
      ORDER BY visit_date DESC
    `;
    const [dailyVisits] = await connection.promise().query(query);
   
    return dailyVisits;
  } catch (error) {
    console.error('Error fetching daily visits:', error);
    throw new Error('خطا در دریافت اطلاعات بازدیدها.');
  }
}

module.exports = { getDailyVisits}