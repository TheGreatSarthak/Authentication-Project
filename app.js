require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

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
      googleId: {
        type: String,
      },
      secret: {
        type: String,
      },
    });

    userSchema.plugin(passportLocalMongoose);
    userSchema.plugin(findOrCreate);

    const User = mongoose.model("User", userSchema);

    passport.use(User.createStrategy());

    passport.serializeUser(function(user, cb) {
      process.nextTick(function() {
        cb(null, { id: user.id, username: user.username, name: user.displayName });
      });
    });
    
    passport.deserializeUser(function(user, cb) {
      process.nextTick(function() {
        return cb(null, user);
      });
    });

    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.CLIENT_ID,
          clientSecret: process.env.CLIENT_SECRET,
          callbackURL: "http://localhost:3000/auth/google/secrets",
        },
        function (accessToken, refreshToken, profile, cb) {
          console.log(profile);
          User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
          });
        }
      )
    );

    app.get("/", function (req, res) {
      res.render("home");
    });

    app.get("/auth/google",
      passport.authenticate("google",{scope: ["profile"]})
    );

    app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });

    app.get("/login", function (req, res) {
      res.render("login");
    });

    app.get("/register", function (req, res) {
      res.render("register");
    });

    app.get("/secrets",async function (req, res) {
      // if (req.isAuthenticated()) {
      //   res.render("secrets");
      // } else {
      //   res.redirect("/login");
      // }
    // }
      const foundSecrets=await User.find({"secret": {$ne:null}});
      res.render("secrets",{userWithSecrets: foundSecrets});
      }
    );

    app.get("/submit", function (req,res){
      if (req.isAuthenticated()) {
        res.render("submit");
      } else {
        res.redirect("/login");
      }
    });

    app.get("/logout", function (req, res) {
      req.logout(function (err) {
        if (err) {
          console.log(err);
        } else {
          res.redirect("/");
        }
      });
    });

    app.post("/register", async function (req, res) {
      User.register(
        { username: req.body.username },
        req.body.password,
        function (err, user) {
          if (err) {
            console.log(err);
            res.redirect("/register");
          } else {
            passport.authenticate("local")(req, res, function () {
              res.redirect("/secrets");
            });
          }
        }
      );
    });

    app.post("/login", async function (req, res) {
      const user = new User({
        username: req.body.username,
        password: req.body.password,
      });
      req.login(user, function (err) {
        if (err) {
          console.log(err);
          res.redirect("/login");
        } else {
          passport.authenticate("local")(req, res, function () {
            res.redirect("/secrets");
          });
        }
      });
    });

    app.post("/submit",async function (req,res){
      const submittedSecret=req.body.secret;
      const findUser= await User.findById(req.user.id);
      if(findUser===null){
        console.log("User not find.");
      } else {
        findUser.secret=submittedSecret;
        findUser.save();
        res.redirect("/secrets");
      }

    });

    app.listen(3000, function () {
      console.log("Server started on port 3000.");
    });
  } catch (error) {
    console.log(error);
  }
}
