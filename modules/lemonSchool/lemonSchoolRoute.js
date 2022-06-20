// 路由
const lemonSchool = require('./lemonSchool');

const autoplay = require('./autoPlay');

const cookie = require('cookie');

const queryString = require('querystring');

module.exports = async (req, res) => {
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
        const baseURL = req.cookies.baseURL || 'http://site.wencaischool.net/gzcjzyxy',
            urlHost = req.cookies.urlHost || 'http://learning.wencaischool.net',
            userInfo = req.cookies.userInfo;

        delete req.cookies.baseURL;
        delete req.cookies.urlHost;
        delete req.cookies.userInfo;

        console.log(userInfo);


        var result = route && await route({
            ...req.query
        }, {
            "cookie": Object.keys(req.cookies).length === 0 ? '' : req.cookies,
            "baseURL": baseURL,
            "urlHost": urlHost,
            "userInfo": queryString.parse(userInfo)
        });
    } catch (err) {
        console.log(err);

        return res.send(err);
    }

    // console.log(result);
    if (result['cookie']) {
        res.setHeader('Set-Cookie', setCookie(result['cookie']));
        delete result['cookie'];
    }

    if (typeof result.data === 'string') {
        res.send(result.data);
    } else {
        res.json(result);
    }
}

function setCookie(objs) {

    var str = [];

    for (var k in objs) {
        var { name, value, ...options } = objs[k];
        if (options['expires']) {
            options['expires'] = new Date(options['expires']);
        }

        if (options['path'] && options['path'] !== '/') {
            options['path'] = '/';
        }

        if (options['domain']) {
            delete options['domain'];
        }
        str.push(cookie.serialize(name, value, options));
    }

    return str;
}