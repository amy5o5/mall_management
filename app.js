const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello, world!');
});



app.listen(3000, () => {
  console.log('Server is running on http://192.168.1.183:3000');
});
///