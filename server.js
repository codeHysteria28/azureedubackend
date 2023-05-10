const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require("cookie-parser");
const db = require('./db');
const moment = require('moment');
require('dotenv').config();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());

// DB connection check
db.on('error', console.error.bind(console, "mongo conn err"));

db.on('connected', () => {
   console.log('connected to mongodb');
});

// Schemas
const Admin = require('./Schemas/AdminLoginSchema');

app.use(cors({
    origin: ["http://localhost:3000", "https://jolly-smoke-00c45a603.3.azurestaticapps.net"],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true
}));

app.post('/adminReg', (req, res) => {
    console.log(req.body);

    if(req.body !== {}){
        Admin.findOne({username: req.body.username}).then((doc, err) => {
            if(err) throw err;
            if(doc) res.send('user already exists');
            if(!doc){
                const newAdmin = new Admin({
                    username: req.body.username,
                    password: req.body.password,
                    fullName: req.body.fullName,
                    email: req.body.email,
                    repPassword: req.body.repPassword
                });

                newAdmin.save();

                res.send('registration of admin successful');
            }else {
                res.send(err);
            }
        });
    }else {
        res.send('empty body');
    }
});


app.post('/adminLogin', (req, res) => {
    if(req.body !== {}){
        const username = req.body.username;
        const password = req.body.password;

        Admin.findOne({username: username}).then((admin, err) => {
            if(err) throw err;

            if(!admin){
                res.send("No user exists");
            }else {
                bcrypt.compare(password, admin.password, (err, result) => {
                    if(err) throw err;

                    if(result){
                        const token = jwt.sign({username: admin.username}, process.env.JWT_SECRET, {expiresIn: "1h"});
                        res.cookie("token", token, {httpOnly: true, path: "/"}).send("logged in");
                    }else {
                        res.send("Incorrect password");
                    }
                });
            }
        });
    }
});

app.post('/admin', (req,res) => {
    const token = req.cookies.token;

    if(!token){
        res.send("not authenticated");
    }else {
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if(err) throw err;

            if(decoded){
                Admin.findOne({username: decoded.username}).then((admin, err) => {
                    if(err) throw err;

                    const dataAdmin = {
                        username: admin.username
                    }

                    if(admin){
                        Admin.findOneAndUpdate({username: decoded.username}, {loggedIn: true}).then((admin,err )=> {
                            try{
                                if(err) throw err;
                                if(admin){
                                    res.send(dataAdmin);
                                    console.log(`Admin: ${decoded.username} is authenticated and logged in at ${moment().format('MMMM Do YYYY, h:mm:ss a')}.`);
                                }
                            }catch{
                                console.log(err);
                                res.send(err);
                            }
                        });
                    }else {
                        res.send("not authenticated");
                    }
                });
            }else {
                res.send("not authenticated");
            }
        });
    }
});

app.post('/logout', (req, res) => {
    jwt.verify(req.cookies.token, process.env.JWT_SECRET,(err, decoded) => {
        if(err) throw err;

        Admin.findOneAndUpdate({username: decoded.username}, {loggedIn: false}).then((admin,err )=> {
            try{
                if(err) throw err;
                if(admin){
                    res.clearCookie("token").send("logged out");
                    console.log(`Admin: ${decoded.username} logged out at ${moment().format('MMMM Do YYYY, h:mm:ss a')}`);
                }
            }catch{
                console.log(err);
                res.send(err);
            }
        });
    });
});

app.listen(process.env.port || 1337, () => console.log("Running on port " + process.env.port || 1337));