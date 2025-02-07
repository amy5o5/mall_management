const express = require("express");
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
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


app.listen(2000, () => {
  console.log("Server is running on http://192.168.1.183:3000");
});
