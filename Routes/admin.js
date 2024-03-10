const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const moment = require("moment/moment");
const adminRouter = express.Router();
const axios = require("axios");
require('dotenv').config();

const Admin = require('../Schemas/AdminLoginSchema');
const NewsArticles = require('../Schemas/NewsArticlesSchema');
const ComingUp = require('../Schemas/ComingUpSchema');

adminRouter.post('/adminLogin', (req, res) => {
    if(Object.keys(req.body).length > 0){
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

adminRouter.post('/adminReg', (req, res) => {
    if(Object.keys(req.body).length > 0){
        Admin.findOne({username: req.body.username}).then((doc, err) => {
            if(err) throw err;
            if(doc) res.send('user already exists');
            if(!doc){
                const newAdmin = new Admin({
                    username: req.body.username,
                    password: req.body.password,
                    isAdmin: true,
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

adminRouter.post('/admin', (req,res) => {
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

adminRouter.get('/getNewsAdmin', (req, res) => {
    NewsArticles.find({ approved: true }).sort({_id: 'desc'}).then((articles, err) => {
        if(err) throw err;
        res.send(articles);
    });
});

adminRouter.get('/getNewsAdminAll', (req, res) => {
    NewsArticles.find().sort({_id: 'desc'}).then((articles, err) => {
        if(err) throw err;
        res.send(articles);
    });
});

// approve article by title
adminRouter.post('/approveArticle', (req, res) => {
    NewsArticles.findOneAndUpdate({title: req.body.articleTitle}, {approved: true}).then((article, err) => {
        if(err) throw err;
        res.send('article with title ' + req.body.articleTitle + ' approved');
    });
});

// deleting article by title
adminRouter.post('/deleteArticle', (req, res) => {
    NewsArticles.findOneAndDelete({_id: req.body.articleID}).then((article, err) => {
        if(err) throw err;
        console.log(`Article deleted at ${moment().format('MMMM Do YYYY, h:mm:ss a')}`);
        res.send('article deleted');
    });
});

// uploading coming up event
adminRouter.post('/comingUpUpload', (req, res) => {
    const newComingUp = new ComingUp({
        title: req.body.title,
        date: req.body.date,
        description: req.body.description
    });

    newComingUp.save();
    res.send('coming up event saved');
});

// get coming up events
adminRouter.get('/getComingUp', (req, res) => {
    ComingUp.find({ visible: true }).sort({date: 'asc'}).then((events, err) => {
        if(err) throw err;
        res.send(events);
    });
});

adminRouter.post('/aichat', (req, res) => {  
    axios({
        method: 'post',
        url: `${process.env.FN_URL}`,
        data: req.body, // or the data you want to send
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => {
        res.send(response.data);
    })
    .catch(error => {
        console.error(error);
    });
});

module.exports = adminRouter;