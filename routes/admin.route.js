require("dotenv").config();
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const db_connect = require("../database/db_connect");
const checkAccess = require('./../middlewares/check-actor.middleware')


router.get("/panel",checkAccess(["admin"]), (req, res) => {
  res.render("admin", { error: null });
});

module.exports = router;
