const express = require("express");
const web3 = require("web3");

const app = express();

// set up view engine
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("main");
});

app.get("/login", (req, res) => {
  res.render("login");
});

// app.get("/eth-login", (req, res) => {
//   res.send("hahaa");
// });

app.listen(9487, () => {
  console.log("app now listening on port 9487...");
});
