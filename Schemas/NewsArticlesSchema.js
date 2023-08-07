const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NewsArticlesSchema = new Schema({
    title: {type: String, required: true},
    content: {type: String, required: true},
    author: {type: String, required: true},
    topic: {type: String, required: true},
    description: {type: String, required: true},
    approved: {type: Boolean, required: true},
    likes: {type: Number, required: false},
},{ timestamps: true, collection: 'NewsArticles' });

module.exports = mongoose.model('NewsArticles', NewsArticlesSchema);