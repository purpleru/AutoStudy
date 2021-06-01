// 路由
const lemonSchool = require('./lemonSchool');
const autoplay = require('./autoPlay');

module.exports = async(req, res) => {
    const program = req.path.replace(/^\//, '');
    // console.log(program);

    var route = program === 'autoplay' ? autoplay : lemonSchool['route'][program];

    if (!route) {
        return res.json({
            code: 401,
            msg: 'err'
        });
    }


    try {
        var result = route && await route({
            ...req.query
        }, { cookie: Object.keys(req.cookies).length === 0 ? '' : req.cookies });
    } catch (err) {
        return res.send(err);
    }

    // console.log(result);
    if (result['cookie']) {
        setCookie.call(res, result['cookie']);
        delete result['cookie'];
    }

    // setTimeout(() => {
    //     res.send(result);
    // }, 3000);

    res.json(result);
}

function setCookie(cookieArr) {
    // var cookieObject = {...cookieArr };
    cookieArr.forEach((item) => {
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