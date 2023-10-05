const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const db = require('./db');
const adminRouter = require('./Routes/admin.js');
const authRouter = require('./Routes/auth.js');
const userRouter = require('./Routes/user.js');
require('dotenv').config();

app.use(bodyParser.urlencoded({extended: true}, {limit: '50mb'}));
app.use(bodyParser.json({limit: '50mb'}));
app.use(cookieParser());
app.set('trust proxy', 1);
app.use(cors({
    origin: ["http://localhost:3000", "https://jolly-smoke-00c45a603.3.azurestaticapps.net", "https://azureedu-ffbgbeb9h3ddgffx.z01.azurefd.net", "https://azure-edu.eu"],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true
}));

// DB connection check
db.on('error', console.error.bind(console, "mongo conn err"));

db.on('connected', () => {
   console.log('connected to mongodb');
});

// Routes
app.use(adminRouter);
app.use(authRouter);
app.use(userRouter);

// ping server
app.get('/ping', (req, res) => {
    res.send('pong');
});

// handle default route
app.get('*', (req, res) => {
    res.send('404');
});

app.listen(process.env.port || 80, () => console.log("Running on port " + process.env.port || 80));