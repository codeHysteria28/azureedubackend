const express = require('express');
const userRouter = express.Router();
const { AudioConfig, SpeechSynthesizer, SpeechConfig } = require('microsoft-cognitiveservices-speech-sdk');
const { convert } = require('html-to-text');
const { BlobServiceClient } = require('@azure/storage-blob');
const { PassThrough } = require('stream');
require('dotenv').config();
const UserCreator = require('../Schemas/UserCreatorSchema');
const NewsArticles = require('../Schemas/NewsArticlesSchema');

// create blob service client
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

userRouter.post('/usercreator', (req,res) => {
    const token = req.cookies.token;

    if(!token){
        res.send("not authenticated");
    }else {
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if(err) throw err;

            if(decoded){
                UserCreator.findOne({username: decoded.username}).then((user, err) => {
                    if(err) throw err;

                    const userName = {
                        username: user.username
                    }

                    if(user){
                        UserCreator.findOneAndUpdate({username: decoded.username}, {loggedIn: true}).then((user,err )=> {
                            try{
                                if(err) throw err;
                                if(user){
                                    NewsArticles.find({author: userName.username}).then((articles, err) => {
                                        if(err) throw err;
                                        
                                        const scrapedArticles = articles.map((article) => {
                                            return {
                                                title: article.title,
                                                topic: article.topic,
                                                description: article.description,
                                                approved: article.approved,
                                                createdAt: article.createdAt
                                            }
                                        });
                                        
                                        if(scrapedArticles){
                                            res.send({scrapedArticles, userName});
                                            console.log(`User: ${decoded.username} is authenticated and logged in at ${moment().format('MMMM Do YYYY, h:mm:ss a')}.`);
                                        }else {
                                            res.send("no articles");
                                        }
                                    });
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

userRouter.post('/uploadNews', async (req, res, err) => {
    if(req.body !== {}){
        const blobName = `${req.body.title}.mp3`;

        // converting html to plain text
        const text = convert(req.body.content);

        // removing base64 image data from text
        const finalText = text.replace(/\[data:.*\].*/g, "");

        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blobClient = containerClient.getBlockBlobClient(blobName);

        // speech configuration
        const speechConfig = SpeechConfig.fromSubscription(process.env.SPEECH_KEY, process.env.SPEECH_REGION);
        speechConfig.speechSynthesisVoiceName = "en-US-JennyNeural"; 
        speechConfig.speechSynthesisLanguage = "en-US"; 

        // audio configuration
        const audioConfig = AudioConfig.fromAudioFileOutput(blobName);

        // synthesizer configutation
        const synthesizer = new SpeechSynthesizer(speechConfig, audioConfig);

        const newArticle = new NewsArticles({
            title: req.body.title,
            content: req.body.content,
            author: req.body.author,
            topic: req.body.topic,
            description: req.body.description,
            approved: req.body.approved,
            textToSpeechAudioUrl: `https://speechtotextaudio.blob.core.windows.net/${containerName}/${blobName}`,
        });

        // synthesizing text to speech/audio file and uploading to azure blob storage
        synthesizer.speakTextAsync(
            finalText,
            result => {
                const { audioData } = result;

                // convert array buffer to stream
                const bufferStream = new PassThrough();
                bufferStream.end(Buffer.from(audioData));

                // upload stream to azure blob storage
                blobClient.uploadStream(bufferStream);
                console.log('Audio File uploaded to Azure Blob storage');
            },
            error => {
                console.log(error);
                synthesizer.close();
            }
        );

        console.log(`New article ${req.body.title} uploaded by ${req.body.author} at ${moment().format('MMMM Do YYYY, h:mm:ss a')}`);
        res.send('article uploaded');
        newArticle.save();
    }else {
        res.send('error', err);
    }
});

// get news articles
userRouter.get('/getNews', async (req, res) => {
    NewsArticles.find({ approved: true }).sort({_id: -1}).limit(3).then((articles, err) => {
        if(err) throw err;
        res.send(articles);
    });
});

// get single article by title
userRouter.get('/getArticle/:title', (req, res) => {
    NewsArticles.findOne({title: req.params.title}).then((article, err) => {
        if(err) throw err;
        res.send(article);
    });
});
// editing article by title

// TODO

// likeDislikeArticle by title
userRouter.post('/likeDislikeArticle/:title', (req, res) => {
    const type = req.body.type;
    const title = req.params.title;

    if(type === "like"){
        NewsArticles.findOneAndUpdate({title: title}, {$inc: {likes: 1}}).then((article, err) => {
            if(err) throw err;
            res.send({
                count: article.likes
            });
        });
    }else if(type === "unLike"){
        NewsArticles.findOneAndUpdate({title: title}, {$inc: {likes: -1}}).then((article, err) => {
            if(err) throw err;
            res.send({
                count: article.likes
            });
        });
    }else {
        res.send('error');
    }
});

// get likes and dislikes by title
userRouter.get('/getLikesDislikes/:title', (req, res) => {
    NewsArticles.findOne({title: req.params.title}).then((article, err) => {
        if(err) throw err;
        res.send({
            likes: article.likes,
            dislikes: article.dislikes
        });
    });
});

module.exports = userRouter;