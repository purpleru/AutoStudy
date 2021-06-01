const { ajax } = require('../../tools/request');

const setCookie = require('set-cookie-parser');

// 加解密
const { encrypt, decrypt, Encrypt } = require('./crypto');


function createRequest(url = '', method = 'get', data = {}, options) {
    var options = options || {},
        cookie = options['cookie'],
        headers = {
            'Proxy-Connection': 'keep-alive',
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36'
        };

    // 附加请求头
    if (options['headers'] && options['headers'] instanceof Object) {
        for (var k in options['headers']) {
            headers[k] = options['headers'][k];
        }
    }

    // 参数是否需要加密 默认:true
    if (!options['noCrypto']) {
        data = encrypt(data);
    }


    // Cookie
    if (cookie instanceof Object) {
        headers['cookie'] = Object.keys(cookie).map((value) =>
            cookie[value] && encodeURIComponent(value) + '=' + encodeURIComponent(cookie[value])
        ).join(';');

    } else if (cookie) headers['cookie'] = cookie;


    method = method.toLowerCase();

    if (url.includes('site.wencaischool.net')) {
        headers['Host'] = 'site.wencaischool.net';
        headers['Origin'] = 'http://site.wencaischool.net';
    } else {
        headers['Host'] = 'learning.wencaischool.net';
        headers['Origin'] = 'http://learning.wencaischool.net';
    }

    if (method === 'post') {
        headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
        headers['X-Requested-With'] = 'XMLHttpRequest'
    }
    if (method === 'get') {
        headers['Origin'] = 'http://site.wencaischool.net/gzcjzyxy/console/';
        headers['Upgrade-Insecure-Requests'] = '1'
    }

    return new Promise(function(resolve, reject) {
        ajax({
            url: url,
            method: method,
            data: data,
            headers: headers,
            success: function(response, xhr) {
                var container = {};

                if (response['data']) {
                    response['data'] = decrypt(response['data']);
                }

                response instanceof Object ? container = {...response } : container['data'] = response;

                // set cookie parse
                container['cookie'] = xhr.responseHeaders['set-cookie'] ? setCookie.parse(xhr.responseHeaders['set-cookie'], {
                    decodeValues: true, // Calls dcodeURIComponent on each value - default: true
                    map: false, // Return an object instead of an array - default: false
                    silent: false, // Suppress the warning that is loged when called on a request instead of a response - default: false
                }) : [];

                resolve(container);
            },
            // http状态码错误
            error: function(err, xhr) {
                console.log(xhr);
                reject(err);
            },
            // http解析错误
            onerror: function(err) {
                reject(err);
            }
        });
    });
}

module.exports = createRequest;