const mongoose = require('mongoose');

const SchemaDirect = mongoose.Schema({
    creator: String,
    to: String,
    comment: String,
    timeCreate: String,
    name: String,
    avatar: String,
    changed: Boolean,
    photo: String,
    photoId: String,
    photoSize: {
        width: String,
        height: String
    },
})

module.exports = mongoose.model('commentsDirect', SchemaDirect)