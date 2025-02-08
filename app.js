const express = require("express");
const app = express();
const path = require('path');
const bodyParser = require('body-parser');

// const db_connect = require('./database/db_connect');
require('dotenv').config();
app.set("view engine", "ejs");



app.use(express.static("public"));
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Hello, world!");
});

const authRoutes = require('./routes/auth.routes');

app.use('/auth', authRoutes);

const IP = process.env.IP;
const PORT = process.env.PORT;

app.listen(PORT, IP,() => {
  console.log(`App listening on port ${PORT} and ${IP}`);
});
