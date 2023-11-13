const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ComingUpSchema = new Schema({
    title: {type: String, required: true},
    date: {type: String, required: true},
    description: {type: String, required: true},
    visible: {type: Boolean, default: true}
}, { timestamps: true, collection: 'ComingUp' });

module.exports = mongoose.model('ComingUp', ComingUpSchema);