const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const db = require('./db');
const adminRouter = require('./Routes/admin.js');
const authRouter = require('./Routes/auth.js');
const userRouter = require('./Routes/user.js');
const cron = require('node-cron');
const moment = require('moment');
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

// Schemas
const ComingUp = require('./Schemas/ComingUpSchema');

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

// Cron scheduled job to soft delete expired coming up events
cron.schedule('0 1 * * *', () => {
    console.log("Running cron job...");
    ComingUp.find({visible: true}).then((docs, err) => {
        if(err) throw err;

        if(docs){
            docs.forEach((doc) => {
                if(moment(doc.date).isSame(moment().format('YYYY-MM-DD'))){
                    doc.visible = false;
                    doc.save();
                    console.log("Soft deleted " + doc.title);
                }else {
                    console.log("No events to delete...");
                }
            });
        }
    });
});

app.listen(process.env.port || 80, () => console.log("Running on port " + process.env.port || 80));