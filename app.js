require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
// const bcrypt = require("bcrypt");
// const saltRounds = 10;
// const md5 = require("md5");
// const encrypt= require("mongoose-encryption");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

main().catch((err) => console.log(err));

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

async function main() {
  try {
    const userSchema = new mongoose.Schema({
      email: {
        type: String,
      },
      password: {
        type: String,
      },
    });

    userSchema.plugin(passportLocalMongoose);
    //using binary encryption

    // userSchema.plugin(encrypt,{secret: process.env.SECRET,encryptedFields: ["password"]});

    const User = mongoose.model("User", userSchema);

    passport.use(User.createStrategy());

    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());

    app.get("/", function (req, res) {
      res.render("home");
    });

    app.get("/login", function (req, res) {
      res.render("login");
    });

    app.get("/register", function (req, res) {
      res.render("register");
    });

    app.get("/secrets", function (req, res) {
      if(req.isAuthenticated()){
        res.render("secrets");
      } else {
        res.redirect("/login");
      }
    });
    app.get("/logout",function (req,res){
      req.logout(function (err){
        if(err){
          console.log(err);
        } else {
          res.redirect("/");
        }
      });
      
    });

    app.post("/register", async function (req, res) {

      User.register({username: req.body.username},req.body.password,function(err,user){
        if(err){
          console.log(err);
          res.redirect("/register");
        } else {
          passport.authenticate("local")(req,res,function (){
            res.redirect("/secrets");
          });
        }

      });
      // bcrypt.hash(req.body.password, saltRounds, async function (err, hash) {
      //   const newUser = new User({
      //     email: req.body.username,
      //     password: hash,
      //   });
      //   const saveUser = await newUser.save();
      //   if (saveUser.$session === null) {
      //     res.send("User not added! Try Again...");
      //   } else {
      //     //res.send("Successfully added a new user.");
      //     res.render("secrets");
      //   }
      // });
    });
    app.post("/login", async function (req, res) {
      // const username = req.body.username;
      // const password = req.body.password;
      // const matchUser = await User.findOne({ email: username });
      // if (matchUser === null) {
      //   console.log("No such user found.");
      // } else {
      //   bcrypt.compare(password, matchUser.password, function(err, result) {
      //     if (result === true) {
      //       res.render("secrets");
      //     } else {
      //       console.log(err);
      //     }
      //   });
      // }
      const user = new User({
        username: req.body.username,
        password: req.body.password,
      });
      req.login(user,function (err){
        if(err){
          console.log(err);
          res.redirect("/login");
        } else {
          passport.authenticate("local")(req,res,function (){
            res.redirect("/secrets");
          });
        }
      });
    });

    app.listen(3000, function () {
      console.log("Server started on port 3000.");
    });
  } catch (error) {
    console.log(error);
  }
}
