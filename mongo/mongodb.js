const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/AutoStudy', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('数据库链接成功 连接地址:mongodb://localhost/AutoStudy');
    }).catch(err => {
        console.log(err);
        console.log('数据库链接失败');
    });