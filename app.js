const express = require("express");
const web3 = require("web3");
const crypto = require("crypto");
const bodyParser = require("body-parser");

const app = express();

let userData;

// set up view engine
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.render("main");
});

app.get("/login", (req, res) => {
  let nonce = crypto.randomBytes(10).toString("hex");
  res.render("login", { nonce: nonce });
});

app.post("/logged", function(req, res) {
  // res.render("profile", { user: req.body.address });
  userData = req.body;
  console.log(req.body);
});

const isLogin = (req, res, next) => {
  if (userData == null) {
    // Not logged in!
    res.redirect("/login");
  } else {
    next();
  }
};

app.get("/profile", isLogin, (req, res) => {
  res.render("profile", { user: userData.address });
});

app.listen(9487, () => {
  console.log("app now listening on port 9487...");
});
