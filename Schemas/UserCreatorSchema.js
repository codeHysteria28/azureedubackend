const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userCreatorSchema = new Schema({
    username: {type: String, required: true},
    password: {type: String, required: true},
    fullName: {type: String, required: true},
    email: {type: String, required: true},
    repPassword: {type: String, required: true},
    loggedIn: {type: Boolean, default: false, required: false},
    isCreator: {type: Boolean, default: false, required: false}
},{ timestamps: true, collection: 'UserCreator' });

module.exports = mongoose.model('UserCreator', userCreatorSchema);