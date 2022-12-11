const express = require("express");
const { databaseQuery, databaseConfig } = require("../database");
const { responseHelper } = require("../helper");
const jwt = require("jsonwebtoken");
const Auth = require("../middleware/auth");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const bcrypt = require("bcrypt");
const { service } = require("../services");
SECRET = process.env.SECRET;

//* register user begin //
const registerUser = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashedPass = await bcrypt.hash(password, 10);
    const user = await service.addUser(username, email, hashedPass);
    if (user instanceof Error) {
      throw new Error(user);
    }
    console.log(hashedPass);
    res.status(responseHelper.status.success).json(user);
  } catch (err) {
    res.status(responseHelper.status.error).json(err.message);
  }
};
//* register user end //

//* login user begin //
const login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await service.login(email);
    console.log(user);
    const userData = user;
    if (userData.length === 0) {
      res
        .status(responseHelper.status.error)
        .json({ message: "User not found" });
    } else {
      bcrypt.compare(password, userData[0].password, (err, result) => {
        if (err) {
          res.status(responseHelper.status.error).json(err.message);
        } else if (result === true) {
          const token = jwt.sign(
            {
              id: userData[0].id,
              username: userData[0],
              email: userData[0].email,
              password: userData[0].password,
            },
            process.env.SECRET
          );
          res.cookie("tokenJWT", token, { httpOnly: true, sameSite: "strict" });
          res.status(responseHelper.status.success).json({
            message: "User logged id",
            id: userData[0].id,
            username: userData[0].username,
            email: userData[0].email,
            token: token,
          });
        } else {
          if (result != false) {
            res.status.send("Wrong password");
          }
        }
      });
    }
  } catch (err) {
    console.log(err);
    res.status(responseHelper.status.error).json({ message: "Database error" });
  }
};

module.exports = { registerUser, login };
