const { ajax, asynAjax } = require('../../tools/request');

const setCookieParser = require('set-cookie-parser');

const { cookieStringify } = require('../../tools/tools');

function createRequest(url = '', method = 'get', data = {}, options = {}) {

    var headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36'
    };

    if (options.cookie instanceof Object) {
        headers.cookie = cookieStringify(options.cookie);
    } else if (typeof options.cookie === 'string') headers.cookie = options.cookie;

    if (url.includes('mooc1.chaoxing.com')) {
        headers['Host'] = 'mooc1.chaoxing.com';
        headers['Upgrade-Insecure-Requests'] = '1';
    } else if (url.includes('passport2.chaoxing.com')) {
        headers['Host'] = 'passport2.chaoxing.com';
        headers['Origin'] = 'http://passport2.chaoxing.com';
    }

    headers['X-Real-IP'] = '223.24.197.23';

    method = method.toLocaleLowerCase();

    if (method === 'post') {
        headers['X-Requested-With'] = 'XMLHttpRequest';
    }

    return asynAjax({
        url: url,
        method: method,
        data: data,
        headers: headers
    }).then(({ data, xhr }) => {
        var set_cookie = xhr.responseHeaders['set-cookie'];
        return Promise.resolve({
            data: data,
            cookie: set_cookie ? setCookieParser(set_cookie) : [],
            _http: xhr
        })
    }).catch(err => Promise.reject(err));
}

module.exports = createRequest;