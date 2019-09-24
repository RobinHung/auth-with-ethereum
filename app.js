const express = require("express");
const Web3 = require("web3");
const crypto = require("crypto");
const bodyParser = require("body-parser");
const ethUtil = require("ethereumjs-util");
const sigUtil = require("eth-sig-util");
const mongoose = require("mongoose");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const keys = require("./config/keys");
const logger = require("morgan");
const User = require("./models/user-model");
const MongoStore = require("connect-mongo")(session);

// @dev: passport.js related
const passport = require("passport");

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
let loginStatus = false;

// set up view engine
app.set("view engine", "ejs");

app.use(logger("dev"));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cookieParser());

mongoose.connect(
  keys.mongodb.dbURI,
  { useNewUrlParser: true },
  () => {
    console.log("connected to mLab MongoDB");
  }
);

app.use(
  session({
    secret: keys.session.cookieKey,
    resave: false,
    saveUninitialized: false, // only create cookies when user is logged in
    // cookie: { secure: true }
    // Persistent Session Store
    store: new MongoStore({
      mongooseConnection: mongoose.connection,
      ttl: 2 * 24 * 60 * 60 // expires after two days
    })
  })
);

// @dev: passport.js related
app.use(passport.initialize());
app.use(passport.session());

// @dev: passport.js related
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

const checkAuth = (req, res, next) => {
  console.log(
    `req.session.passport.user: ${JSON.stringify(req.session.passport)}`
  );

  if (req.isAuthenticated()) {
    return next();
  } else {
    console.log("** Not authenticated! **");
    res.redirect("/login");
  }
};

app.get("/", (req, res) => {
  // web3.eth.net.getNetworkType().then(console.log);
  res.render("main");

  console.log(req.user);
  console.log(req.isAuthenticated());
});

app.get("/login", (req, res) => {
  if (req.isAuthenticated()) {
    // user is already authenticated!
    res.redirect("/profile");
  } else {
    let nonce = crypto.randomBytes(10).toString("hex");
    tempNonce = nonce;
    res.render("login", { nonce: nonce });
  }
});

// Verify the signature after the client signs the nonce and passes the signature
app.post("/submit", (req, res) => {
  // res.render("profile", { user: req.body.address });
  userData = req.body;
  console.log(req.body);

  // Verify the address from the signed signature!
  const msg = `You're about to sign this random string: '${tempNonce}' to prove your identity.`;
  const msgBufferHex = ethUtil.bufferToHex(Buffer.from(msg, "utf8"));
  const recoveredAddress = sigUtil.recoverPersonalSignature({
    data: msgBufferHex,
    sig: userData.signature
  });

  console.log("=========");

  if (recoveredAddress == userData.address) {
    console.log("verified!");
    User.findOne({ address: recoveredAddress }).then(currentUser => {
      if (currentUser) {
        // if found user in DB
        console.log("Found user: " + currentUser);

        currentUser.loginCount += 1;
        // TODO: update nonce

        currentUser.save((err, updatedUser) => {
          // after login() function, will call `serializeUser()`
          // and return the userID from database
          req.login(updatedUser, err => {
            console.log("*** LOGIN? ***");

            if (err) {
              console.log(err);
            }

            return res.redirect("/profile");
          });
        });
      } else {
        // this account has not logged in before, create new record in DB!
        console.log("Create new User record in DB..");
        new User({
          address: recoveredAddress,
          nonce: tempNonce,
          loginCount: 1
        })
          .save()
          .then(newUser => {
            console.log("new user created: " + newUser);

            req.login(newUser, err => {
              return res.redirect("/profile");
            });
          });
      }
    });
  } else {
    res.send("Opps! The address verification failed!");
    userData = null;
  }
});

app.get("/profile", checkAuth, (req, res) => {
  res.render("profile", {
    user: req.user.address,
    loginCount: req.user.loginCount
  });
});

app.get("/logout", (req, res) => {
  req.logout();
  req.session.destroy();
  res.redirect("/");
});

app.listen(9487, () => {
  console.log("app now listening on port 9487...");
});
