const mongoose = require('mongoose');

const ChaoXingSchema = new mongoose.Schema({
    user: String,
    password: String,
    cookie: String,
    userInit: Object
});

const ChaoXing = mongoose.model('ChaoXing', ChaoXingSchema, 'chaoxing');

async function createUser(docs) {

    const query = { user: docs.user };

    try {
        const isExist = await ChaoXing.findOne(query);

        if (isExist) {
            return await ChaoXing.updateOne(query, docs);
        } else {
            return await ChaoXing.create(docs);
        }
    } catch (err) {
        throw new Error(err);
    }
}

module.exports = {
    createUser,
    ChaoXing
}