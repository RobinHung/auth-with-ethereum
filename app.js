const express = require("express");
const Web3 = require("web3");
const crypto = require("crypto");
const bodyParser = require("body-parser");
const ethUtil = require("ethereumjs-util");
const sigUtil = require("eth-sig-util");

// const web3 = new Web3(
//   Web3.givenProvider ||
//     "https://rinkeby.infura.io/v3/65cb4e0a0f0440b7b5b7512b70fab1a7"
// );

// const web3 = new Web3(
//   new Web3.providers.HttpProvider(
//     "https://mainnet.infura.io/v3/65cb4e0a0f0440b7b5b7512b70fab1a7"
//   )
// );

const web3 = new Web3(
  new Web3.providers.WebsocketProvider("wss://mainnet.infura.io/ws")
);

const app = express();

let userData;
let tempNonce;

// set up view engine
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  // if (typeof web3 === "undefined") {
  //   console.log("no web3!");
  // }

  // console.log(web3.currentProvider);
  res.render("main");
});

app.get("/login", (req, res) => {
  let nonce = crypto.randomBytes(10).toString("hex");
  tempNonce = nonce;
  res.render("login", { nonce: nonce });
});

app.post("/ethinfo", (req, res) => {
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

const verify = (req, res, next) => {
  const msg = `You're about to sign this random string: ${tempNonce} to prove your identity.`;
  const msgBufferHex = ethUtil.bufferToHex(Buffer.from(msg, "utf8"));
  const addr = sigUtil.recoverPersonalSignature(
    msgBufferHex,
    userData.signature
  );

  console.log(addr);
  next();
};

app.get("/profile", isLogin, (req, res) => {
  // Verify the address from the signed signature!
  const msg = `You're about to sign this random string: '${tempNonce}' to prove your identity.`;
  const msgBufferHex = ethUtil.bufferToHex(Buffer.from(msg, "utf8"));
  const recoveredAddress = sigUtil.recoverPersonalSignature({
    data: msgBufferHex,
    sig: userData.signature
  });

  if (recoveredAddress == userData.address) {
    res.render("profile", { user: recoveredAddress });
  } else {
    res.send("Opps! The address verification failed!");
  }
});

app.listen(9487, () => {
  console.log("app now listening on port 9487...");
});
