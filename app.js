const express = require("express");
const app = express();
const path = require("path");
const env = require("dotenv").config();
const session = require('express-session')
const db = require("./config/db");
const passport = require('./config/passport')
const userRouter = require("./routes/userRouter")
const adminRouter = require("./routes/adminRouter")
const errorRouter = require("./controllers/error/errorController")
const flash = require('connect-flash');
app.use(flash());
db() // dataBase connected

app.set('view engine', "ejs")
app.set('views', [
  path.join(__dirname, 'views/user'),
  path.join(__dirname, 'views/admin')
])

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 72 * 60 * 60 * 1000
  }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/', userRouter);
app.use('/admin', adminRouter);
app.use(errorRouter.pageNotFound);

app.listen(process.env.PORT, () => console.log("Server Running....!"));

