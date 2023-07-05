const mongoose = require("mongoose");
// mongoose.connect("mongodb://127.0.0.1:27017/golonSports");
mongoose.connect("mongodb+srv://shahabas:w5hkEKjnPqX8H8zo@cluster0.faenisk.mongodb.net/?retryWrites=true&w=majority");
const express = require("express");
const app = express();
const nocache = require("nocache");
const session = require("express-session");
const config = require("./config/config");
const bodyParser = require("body-parser");
const path = require("path");

app.set("view engine", "ejs");
app.use(nocache());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: config.SESSIONSECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use("/public", express.static(path.join(__dirname, "/public")));

const user_route = require("./routes/userRoute");
app.use("/", user_route);

const admin_route = require("./routes/adminRoute");
app.use("/admin", admin_route);

app.listen(3000, (req, res) => {
  console.log("server is running...");
});
