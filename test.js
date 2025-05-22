const express = require('express');
const serverless = require('serverless-http');

const app = express();

app.get('/', (req, res) => {
  res.send('✅ Serverless App is Working!');
});

module.exports = serverless(app);
