const { HttpRequest } = require('./HttpRequest');

function ajax(options) {

    if (Object.prototype.toLocaleString.call(options) != '[object Object]') {
        throw new Error('Options is not a valid option!');
    }

    var defaults = {
        method: 'get',
        headers: {}
    };

    if (options.headers && Object.keys(options.headers).length > 0 && Object.prototype.toLocaleString.call(options.headers) === '[object Object]') {
        for (let key in options.headers) {
            defaults.headers[key.toLowerCase()] = options.headers[key] || '';
        }
        delete options.headers;
    }

    Object.assign(defaults, options);

    var xhr = new HttpRequest();

    // 设置请求头
    for (let key in defaults.headers) {
        xhr.setRequestHeader(key, defaults.headers[key]);
    }

    defaults.method = defaults.method.toLowerCase();

    var contentType = defaults.headers['content-type'] || '';

    if (!contentType && defaults.method === 'post') {
        contentType = 'application/x-www-form-urlencoded';
    }

    if (contentType.includes('application/json') && defaults.method === 'post') {
        defaults.data = JSON.stringify(defaults.data);
    } else {
        var str = '';
        for (let key in defaults.data) {
            str += key + '=' + defaults.data[key] + '&';
        }
        defaults.data = str.substr(0, str.length - 1);
    }

    contentType && xhr.setRequestHeader('content-type', contentType);

    if (defaults.method === 'get' && str) {
        defaults.url = defaults.url + '?' + defaults.data;
    }

    xhr.open(defaults.method, defaults.url);

    xhr.onload = function() {
        // var resContentType = this.getResponseHeader('content-type') && this.getResponseHeader('content-type').search(/^application\/json/i) != -1 ? true : false;

        if (true) {
            try {
                this.responseText = JSON.parse(this.responseText);
            } catch (e) {}

        }

        if (this.status >= 200 && this.status <= 302) {
            defaults.success && defaults.success(xhr.responseText, xhr);
        } else {
            defaults.error && defaults.error(xhr.responseText, xhr);
        }
    }

    xhr.onerror = function(err, xhr) {
        // console.log(err);
        console.log('远程服务器 ' + xhr.requestURL + '可能出现 DNS 解析错误、TCP 层的错误、或实际的 HTTP 解析错误');
        if (typeof defaults.onerror == 'function') {
            defaults.onerror(err, xhr);
        } else {
            defaults.error && defaults.error(err, xhr);
        }
    }

    if (defaults.method === 'post') {
        xhr.send(defaults.data);
    } else {
        xhr.send();
    }

}

function post() {
    ajax({
        method: 'post',
        data: arguments[1],
        url: arguments[0],
        success: (data, xhr) => {
            if (arguments[2] instanceof Function) {
                arguments[2](data, xhr);
            }
        }
    });
}

function get() {

    var i = 2;

    if (arguments[1] instanceof Function) {
        i = 1;
    }

    ajax({
        method: 'get',
        data: i === 1 ? {} : arguments[1],
        url: arguments[0],
        success: (data, xhr) => {
            if (arguments[i] instanceof Function) {
                arguments[i](data, xhr);
            }
        }
    });
}

// 深拷贝
function copyObject(newObject, coverObject) {
    for (var k in coverObject) {
        var coverObjectValue = coverObject[k];
        if (Array.isArray(coverObjectValue)) {
            newObject[k] = [];
            copyObject(newObject[k], coverObjectValue);
        } else if (coverObject instanceof Object) {
            newObject[k] = {};
            copyObject(newObject[k], coverObjectValue);
        } else {
            newObject[k] = coverObject[k];
        }
    }
}

function asynAjax(options = {}) {
    // var { url, method, headers, data } = options;
    return new Promise(function(resolve, reject) {
        ajax({
            ...options,
            success: function(data, xhr) {
                resolve({
                    data,
                    xhr
                });
            },
            error: function(err) {
                reject(err);
            }
        })
    });
}
module.exports = {
    ajax,
    post,
    get,
    asynAjax
}