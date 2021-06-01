const mongoose = require('mongoose');

const userMod = new mongoose.Schema({
    user: String,
    password: String,
    cookie: String,
    userInit: Object
});

const User = mongoose.model('User', userMod, 'user');

async function createUser(createParam, options = {}) {

    var model = options.model || User;

    try {
        var result = await model.findOne({ user: createParam['user'] });

        if (!result) {
            result = await model.create(createParam);
        }
    } catch (err) {
        console.log(err);
        console.log('保存用户失败' + createParam['user']);
    }
    return result;
}


module.exports = { createUser, User, userMod };