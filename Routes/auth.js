const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const moment = require("moment/moment");
const authRouter = express.Router();
require('dotenv').config();
const Admin = require('../Schemas/AdminLoginSchema');
const UserCreator = require('../Schemas/UserCreatorSchema');

authRouter.post('/signup', (req, res) => {
    if(req.body !== {}){
        UserCreator.findOne({username: req.body.username}).then((doc, err) => {
            if(err) throw err;
            if(doc) res.send('user already exists');
            if(!doc){
                const newUser = new UserCreator({
                    username: req.body.username,
                    password: req.body.password,
                    fullName: req.body.fullName,
                    email: req.body.email,
                    repPassword: req.body.repPassword
                });

                newUser.save();
                res.send('registration of user-creator successful');
            }else {
                res.send(err);
            }
        });
    }else {
        res.send('empty body');
    }
});

authRouter.post('/signin', (req, res) => {
    if(req.body !== {}){
        const username = req.body.username;
        const password = req.body.password;

        UserCreator.findOne({username: username}).then((user, err) => {
            if(err) throw err;

            if(!user){
                res.send("No user exists");
            }else {
                bcrypt.compare(password, user.password, (err, result) => {
                    if(err) throw err;

                    if(result){
                        const token = jwt.sign({username: user.username}, process.env.JWT_SECRET, {expiresIn: "1h"});
                        res.cookie("token", token, {httpOnly: true, path: "/", sameSite: 'none', secure: true}).send("logged in");
                    }else {
                        res.send("Incorrect password");
                    }
                });
            }
        });
    }
});

authRouter.post('/logout', (req, res) => {
    if(req.body.logoutType === "user"){
        jwt.verify(req.cookies.token, process.env.JWT_SECRET,(err, decoded) => {
            if(err) throw err;

            UserCreator.findOneAndUpdate({username: decoded.username}, {loggedIn: false}).then((user,err )=> {
                try{
                    if(err) throw err;
                    if(user){
                        res.clearCookie("token").send("logged out");
                        console.log(`User: ${decoded.username} logged out at ${moment().format('MMMM Do YYYY, h:mm:ss a')}`);
                    }
                }catch{
                    console.log(err);
                    res.send(err);
                }
            });
        });
    }else {
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
    }
});

module.exports = authRouter;