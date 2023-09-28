const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const moment = require("moment/moment");
const adminRouter = express.Router();
require('dotenv').config();

const Admin = require('../Schemas/AdminLoginSchema');
const NewsArticles = require('../Schemas/NewsArticlesSchema');

adminRouter.post('/adminLogin', (req, res) => {
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

adminRouter.post('/adminReg', (req, res) => {
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
    NewsArticles.find().sort({_id: 'desc'}).then((articles, err) => {
        if(err) throw err;

        const scrapedArticles = articles.map((article) => {
            return {
                id: article._id,
                title: article.title,
                author: article.author,
                approved: article.approved,
                topic: article.topic,
                description: article.description,
                createdAt: article.createdAt,
                content: article.content
            }
        });

        if(scrapedArticles){
            res.send(scrapedArticles);
        }else {
            res.send("no articles");
        }
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
        console.log(`Article with title ${article.title} deleted at ${moment().format('MMMM Do YYYY, h:mm:ss a')}`);
        res.send('article deleted');
    });
});

module.exports = adminRouter;