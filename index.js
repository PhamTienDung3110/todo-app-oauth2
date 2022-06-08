const express = require("express");
const session = require("express-session");
const passport = require("passport");
const path = require("path");
const mongoose = require("mongoose");
const exphbs = require("express-handlebars");
const Users = require("./models/user");
require("./auth");
const app = express();

app.engine(
  "hbs",
  exphbs.engine({
    defaultLayout: "main",
    extname: ".hbs",
  })
);

app.set("view engine", "hbs");

function isLoggedIn(req, res, next) {
  req.user ? next() : res.sendStatus(401);
}

app.use(session({ secret: "cats", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(__dirname + "/public"));

app.get("/login", (req, res) => {
  res.render("login");
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

app.get(
  "/google/callback",
  passport.authenticate("google", {
    successRedirect: "/",
    failureRedirect: "/auth/google/failure",
  })
);

app.get("/", isLoggedIn, async (req, res) => {
  try {
    const {email } = req.user;
    const user = await Users.findOne({ email }) .lean();
    if(user) {
      res.render("home", {user:user});
    }
    else {
      const newUser = new Users({
        name: req.user.displayName,
        email: req.user.email,
        avatar: req.user.picture,
      });
      await newUser.save();
      res.render("home", {user: newUser});
    }

  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
});

app.get("/logout", (req, res) => {
  req.logout();
  req.session.destroy();
  res.send("Goodbye!");
});

app.get("/auth/google/failure", (req, res) => {
  res.send("Failed to authenticate..");
});

const url = `mongodb+srv://PhamCongDanh:DanhCon2309@ss2.ny94d.mongodb.net/ss2?retryWrites=true&w=majority`;

const connectionParams = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};
mongoose
  .connect(url, connectionParams)
  .then(() => {
    console.log("Connected to the database ");
  })
  .catch((err) => {
    console.error(`Error connecting to the database. n${err}`);
  });

app.listen(5000, () => console.log("listening on port: 5000"));
