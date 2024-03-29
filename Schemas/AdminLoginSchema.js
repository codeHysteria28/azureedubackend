const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const adminLoginSchema = new Schema({
    username: {type: String, required: true},
    password: {type: String, required: true},
    isAdmin: { type: Boolean, required: true },
    fullName: {type: String, required: true},
    email: {type: String, required: true},
    repPassword: {type: String, required: true},
    loggedIn: {type: Boolean, required: false}
},{ timestamps: true, collection: 'Admin' });

module.exports = mongoose.model('Admin', adminLoginSchema);