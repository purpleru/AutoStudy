const express = require('express');

const app = express();

const cookieParser = require('cookie-parser');

const path = require('path');

// 端口
const port = 3001;

require('./mongo/mongodb');

app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieParser());

// 超星
app.use('/chaoxing', require('./modules/chaoxing/chaoxingRoute'));

// 柠檬学堂
app.use('/lemonSchool', require('./modules/lemonSchool/lemonSchoolRoute'));

app.listen(port, function() {
    console.log(`服务启动成功 地址:http://127.0.0.1:${port}`);
});