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

app.use(bodyParser.urlencoded({extended: true}, {limit: '50mb'}));
app.use(bodyParser.json({limit: '50mb'}));
app.use(cookieParser());
app.set('trust proxy', 1);

// DB connection check
db.on('error', console.error.bind(console, "mongo conn err"));

db.on('connected', () => {
   console.log('connected to mongodb');
});

// Schemas
const Admin = require('./Schemas/AdminLoginSchema');
const NewsArticles = require('./Schemas/NewsArticlesSchema');

app.use(cors({
    origin: ["http://localhost:3000", "https://jolly-smoke-00c45a603.3.azurestaticapps.net"],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true
}));

app.post('/adminReg', (req, res) => {
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
                        res.cookie("token", token, {httpOnly: true, path: "/", sameSite: 'none', secure: true}).send("logged in");
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

app.post('/uploadNews', (req, res, err) => {
    if(req.body !== {}){
        const newArticle = new NewsArticles({
            title: req.body.title,
            content: req.body.content,
            author: req.body.author,
            topic: req.body.topic,
            description: req.body.description,
        });

        console.log("article uploaded");
        res.send('article uploaded');
        newArticle.save();
    }else {
        res.send('error', err);
    }
});

// get news articles
app.get('/getNews', (req, res) => {
    NewsArticles.find().limit(3).then((articles, err) => {
        if(err) throw err;
        
        const scrapedArticles = articles.map((article) => {
            return {
                title: article.title,
                author: article.author,
                topic: article.topic,
                description: article.description,
            }
        });
        
        if(scrapedArticles){
            res.send(scrapedArticles);
        }else {
            res.send("no articles");
        }
    });
});

app.listen(process.env.port || 80, () => console.log("Running on port " + process.env.port || 80));