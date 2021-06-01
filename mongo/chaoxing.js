const mongoose = require('mongoose');

const { userMod, createUser } = require('./user');

const ChaoXing = mongoose.model('ChaoXing', userMod, 'chaoxing');


module.exports = {
    createUser,
    ChaoXing
}