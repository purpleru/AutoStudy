function deURI(deuri) {
    for (var k in deuri) {
        deuri[k] = deuri[k] && decodeURIComponent(deuri[k]);
    }
    return deuri;
}

// 对象转cookie字符串
function cookieStringify(cookie) {
    if (!(cookie instanceof Object && Object.keys(cookie).length > 0)) return '';
    return Object.keys(cookie).map((value) =>
        cookie[value] && encodeURIComponent(value) + '=' + encodeURIComponent(cookie[value])
    ).join(';');
}

// 解析cookie数组为对象，去重复
function cookieParse(cookieArr) {
    var cookies = {};
    if (Array.isArray(cookieArr)) {

        // 以后尽量不要用for in 遍历数组，因为for in 会遍历到原始链中自己添加的属性，原生的并不会遍历到。
        // for (var k in cookieArr) {
        //     var { name, value } = cookieArr[k];
        //     cookies[name] = value;
        // }

        cookieArr.forEach((item) => {
            var { name, value } = item;
            cookies[name] = value;
        })

    } else if (typeof cookieArr === 'string') {
        cookieArr.split(';').forEach(item => {
            const name = item.split('=')[0];
            const value = item.split('=')[1];
            cookies[name] = value;
        });
    }

    // return Object.keys(cookies).length > 0 ? cookies : '';
    return cookies;
}

function findKey(target, keyName, flags) {

    var reg = new RegExp(keyName, flags)

    for (var key in target) {
        if (reg.test(key)) return target[key];
    }

    return null;
}


module.exports = {
    deURI,
    cookieStringify,
    cookieParse,
    findKey
}