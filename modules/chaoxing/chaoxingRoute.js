const route = {
    // 获取课程
    course: require('./api/course'),
    // 获取课程列表项
    subject: require('./api/courseList'),
    // 获取视频信息
    studentstudy: require('./api/studentstudy'),
    // 保存视频状态 (完成视频任务)
    savestatus: require('./api/saveStatus'),
    // 登陆
    login: require('./api/login'),
    // auto play
    auto: require('./api/auto')
}

function setCookie(cookies) {
    cookies.forEach((item) => {
        var { name, value, ...options } = item;
        if (options['expires']) {
            options['expires'] = new Date(options['expires']);
        }

        if (options['maxAge']) {
            options['maxAge'] = options['maxAge'] * 1000;
        }

        if (options['domain']) {
            delete options['domain'];
        }
        this.cookie(name, value, options);
    });
}

module.exports = async (req, res) => {
    const program = req.path.replace(/^\//, '');

    var cx = route[program]
    if (!cx) {
        return res.json({
            code: 400,
            msg: 'error'
        })
    }

    var { cookies } = req;

    // 服务端不做任何回话状态保存，只是做了一个简单的cookie判断
    if ((!cookies['UID'] || !cookies['fid']) && req.path !== '/login') {
        return res.json({
            code: 400,
            msg: '请先进行登陆'
        })
    }

    try {
        var result = await cx(req.query, { cookie: req.cookies })
    } catch (err) {
        // console.log(err);
        return res.json({
            code: 500,
            msg: '服务器内部错误'
        })
    }

    if (!result) {
        result = {};
    }

    if (result['_http'] && result['_http']['requestURL']) {
        delete result._http;
    }

    if (result['cookie']) {
        setCookie.call(res, result['cookie']);
        delete result['cookie'];
    }

    if (typeof result === 'string') {
        res.send(result);
    } else {
        res.json(Object.assign(result, { code: result.code || 200 }));

    }


}