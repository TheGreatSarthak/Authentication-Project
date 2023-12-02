require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt= require("mongoose-encryption");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

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

    //using binary encryption
    
    userSchema.plugin(encrypt,{secret: process.env.SECRET,encryptedFields: ["password"]});

    const User = mongoose.model("User", userSchema);

    app.get("/", function (req, res) {
      res.render("home");
    });

    app.get("/login", function (req, res) {
      res.render("login");
    });

    app.get("/register", function (req, res) {
      res.render("register");
    });

    app.post("/register", async function (req, res) {
      const newUser = new User({
        email: req.body.username,
        password: req.body.password,
      });
      const saveUser = await newUser.save();
      if (saveUser.$session === null) {
        res.send("User not added! Try Again...");
      } else {
        //res.send("Successfully added a new user.");
        res.render("secrets");
      }
    });
    app.post("/login",async function (req,res){
        const username=req.body.username;
        const password=req.body.password;
        const matchUser=await User.findOne({email: username});
        if(matchUser===null){
            console.log("No such user found.");
        } else {
            if(matchUser.password===password){
                res.render("secrets");
            }
            else {
                console.log("Enter correct password.");
            }
        
        }
    });

    app.listen(3000, function () {
      console.log("Server started on port 3000.");
    });
  } catch (error) {
    console.log(error);
  }
}
