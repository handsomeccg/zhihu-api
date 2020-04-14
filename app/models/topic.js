const mongoose = require('mongoose')

const { Schema, model } = mongoose

const topicScema = new Schema({
    __v: { type: Number, select: false },
    name: { type: String, required: true },
    avatar_url: { type: String },
    introduction: { type: String, selec: false }

})

module.exports = model('Topic', topicScema)