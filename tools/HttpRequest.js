const url = require('url');

// 用于调试
const isDebug = true;

function HttpRequest() {
    this.responseText = '';
    // this.responseURL = '';
    this.statusText = '';
    this.responseHeaders = '';
    this.requestURL = '';
    this.onload = null;
    this.onerror = null;
    this.requestConfig = {
        headers: {},
        // insecureHTTPParse: true
    };
}


function open(method, httpUrl) {

    this.requestURL = httpUrl;

    method = method.toUpperCase();

    if (method == 'GET' || method == 'POST') {
        this.requestConfig.method = method;
    } else {
        throw new Error('Request Method Error!');
    }

    httpUrl = new url.URL(httpUrl);

    this.requestConfig.host = httpUrl.hostname;
    this.requestConfig.path = httpUrl.pathname + httpUrl.search;
    this.requestConfig.port = httpUrl.port;
    this.requestConfig.protocol = httpUrl.protocol;
    // console.log(httpUrl);

}

function send(postData) {
    var http;

    if (!this.requestConfig.host) {
        throw new Error('The send method cannot be called without calling open!');

    }

    if (this.requestConfig.protocol === 'http:') {
        http = require('http');
        // this.requestConfig.agent = new http.Agent({ keepAlive: true });
    } else {
        http = require('https');

    }
    // this.requestConfig.agent = new http.Agent({ keepAlive: true });
    // console.log(http.globalAgent);

    const req = http.request(this.requestConfig, (res) => {

        var resData = '';

        res.on('data', data => {
            resData += data
        });

        res.on('end', () => {
            this.statusText = res.statusMessage;
            this.status = res.statusCode;
            this.responseHeaders = res.headers;
            // this.responseURL = ;
            this.responseText = resData;
            this.onload && this.onload({
                aborted: res.aborted,
                upgrade: res.upgrade,
                complete: res.complete,
                httpVersion: res.httpVersion,
                target: this
            });
        });

    });

    postData && req.write(postData);

    req.on('error', err => {
        this.onerror && this.onerror(err, this);
    });

    req.end();

    if (isDebug) {
        console.log(postData);
        console.log(this.requestConfig);
    }

    delete this.requestConfig;
}

function setRequestHeader(requestHeaderKey, requestHeaderValue) {

    this.requestConfig.headers[requestHeaderKey] = requestHeaderValue;
}

function getAllResponseHeaders() {
    return this.responseHeaders;
}

function getResponseHeader(key) {
    return this.responseHeaders[key];
}

HttpRequest.prototype = {
    constructor: HttpRequest,
    open,
    send,
    setRequestHeader,
    getAllResponseHeaders,
    getResponseHeader
};


module.exports = {
    HttpRequest,
    HttpRequestConfig: (req, res, next) => {
        HttpRequest.prototype.next = next;
        next();
    }
};