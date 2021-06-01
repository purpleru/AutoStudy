const request = require('../chaoxingRequest');

const CryptoJS = require('crypto-js');

const { cookieParse, cookieStringify } = require('../../../tools/tools');

const { createUser, ChaoXing } = require('../../../mongo/chaoxing');

module.exports = async(params, options = {}) => {

    var { cookie: cookies } = options;

    if (cookies['UID'] && cookies['fid']) {
        return {
            code: 301,
            msg: '当前已处于登陆状态'
        }
    }

    var { uname, password } = params;
    if (!uname || !password) {
        return {
            code: 400,
            msg: '请输入完整'
        }
    }

    var password = CryptoJS.enc.Utf8.parse(password);
    var { data, cookie } = await request('http://passport2.chaoxing.com/fanyalogin', 'post', {
        fid: options.fid || '-1',
        uname: uname,
        password: CryptoJS.enc.Base64.stringify(password),
        refer: encodeURIComponent('http://i.chaoxing.com'),
        t: true,
        forbidotherlogin: 0
    });

    if (!data.status) {
        return {
            code: 201,
            msg: data.msg2 || '登陆失败,请稍后重试!'
        }
    }

    var response = await request('http://i.chaoxing.com', 'get', {}, {
        cookie: cookieStringify(cookieParse(cookie))
    });

    var location = response._http['responseHeaders']['location'],
        cookies = cookie.concat(response.cookie);
    return request(location, 'get', {}, {
        cookie: cookieStringify(cookieParse(cookies))
    }).then(({ data, cookie }) => {

        createUser({
            user: uname,
            password: password,
            cookie: cookieStringify(cookieParse(cookies.concat(cookie))),
            userInit: {
                login_time: Date.now()
            }
        }, { model: ChaoXing });

        return Promise.resolve({
            msg: '登陆成功',
            code: 200,
            cookie: cookies.concat(cookie)
        })
    });

}