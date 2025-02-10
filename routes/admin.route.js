require("dotenv").config();
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const db_connect = require("../database/db_connect");
const authMiddleware = require("./../middlewares/auth.middleware");

router.get("/panel",authMiddleware, (req, res) => {
  res.render("admin", { error: null });
});

module.exports = router;