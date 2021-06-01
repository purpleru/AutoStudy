const CryptoJS = require('crypto-js');

function k1() {
    return "NDY0NQ=="
}

function Encrypt(r) {
    var t = k2() + k4() + k1() + k3(),
        e = i2() + i1(),
        n = Base64.decode(t),
        o = Base64.decode(e),
        a = CryptoJS.enc.Latin1.parse(n),
        o = CryptoJS.enc.Latin1.parse(o);
    "string" != typeof r && (r = JSON.stringify(r));
    var c = CryptoJS.enc.Utf8.parse(r);
    return CryptoJS.AES.encrypt(c, a, {
        iv: o,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    }).toString()
}

function k2() {
    return "NTE2"
}

function k3() {
    return "OTYzMg=="
}

function i2() {
    return "ODY1NTYyNDU0Mw=="
}

function Decrypt(r) {
    var t = k2() + k4() + k1() + k3(),
        e = i2() + i1(),
        n = Base64.decode(t),
        o = Base64.decode(e),
        a = CryptoJS.enc.Latin1.parse(n),
        o = CryptoJS.enc.Latin1.parse(o),
        c = r.replace("\n", "").replace("\r", "").replace(" ", ""),
        i = CryptoJS.AES.decrypt(c, a, {
            iv: o,
            padding: CryptoJS.pad.Pkcs7
        });
    return CryptoJS.enc.Utf8.stringify(i).toString()
}

function k4() {
    return "NTMyNTk="
}

function i1() {
    return "OTU5MjMz"
}
var Base64 = {
    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    encode: function(r) {
        var t, e, n, o, a, c, i, d = "",
            C = 0;
        for (r = Base64._utf8_encode(r); C < r.length;)
            o = (t = r.charCodeAt(C++)) >> 2,
            a = (3 & t) << 4 | (e = r.charCodeAt(C++)) >> 4,
            c = (15 & e) << 2 | (n = r.charCodeAt(C++)) >> 6,
            i = 63 & n,
            isNaN(e) ? c = i = 64 : isNaN(n) && (i = 64),
            d = d + this._keyStr.charAt(o) + this._keyStr.charAt(a) + this._keyStr.charAt(c) + this._keyStr.charAt(i);
        return d
    },
    decode: function(r) {
        var t, e, n, o, a, c, i = "",
            d = 0;
        for (r = r.replace(/[^A-Za-z0-9\+\/\=]/g, ""); d < r.length;)
            t = this._keyStr.indexOf(r.charAt(d++)) << 2 | (o = this._keyStr.indexOf(r.charAt(d++))) >> 4,
            e = (15 & o) << 4 | (a = this._keyStr.indexOf(r.charAt(d++))) >> 2,
            n = (3 & a) << 6 | (c = this._keyStr.indexOf(r.charAt(d++))),
            i += String.fromCharCode(t),
            64 != a && (i += String.fromCharCode(e)),
            64 != c && (i += String.fromCharCode(n));
        return i = Base64._utf8_decode(i)
    },
    _utf8_encode: function(r) {
        r = r.replace(/\r\n/g, "\n");
        for (var t = "", e = 0; e < r.length; e++) {
            var n = r.charCodeAt(e);
            n < 128 ? t += String.fromCharCode(n) : n > 127 && n < 2048 ? (t += String.fromCharCode(n >> 6 | 192),
                t += String.fromCharCode(63 & n | 128)) : (t += String.fromCharCode(n >> 12 | 224),
                t += String.fromCharCode(n >> 6 & 63 | 128),
                t += String.fromCharCode(63 & n | 128))
        }
        return t
    },
    _utf8_decode: function(r) {
        for (var t = "", e = 0, n = c1 = c2 = 0; e < r.length;)
            (n = r.charCodeAt(e)) < 128 ? (t += String.fromCharCode(n),
                e++) : n > 191 && n < 224 ? (c2 = r.charCodeAt(e + 1),
                t += String.fromCharCode((31 & n) << 6 | 63 & c2),
                e += 2) : (c2 = r.charCodeAt(e + 1),
                c3 = r.charCodeAt(e + 2),
                t += String.fromCharCode((15 & n) << 12 | (63 & c2) << 6 | 63 & c3),
                e += 3);
        return t
    }
};


function encrypt(obj) {
    var cryptos = {}

    if (!obj || !(obj instanceof Object)) return cryptos;

    for (var k in obj) {
        cryptos[k] = encodeURIComponent(Encrypt(obj[k]));
    }

    return cryptos;
}

function decrypt(str) {
    try {
        return JSON.parse(Decrypt(str));
    } catch (err) {}
}

module.exports = {
    encrypt,
    decrypt,
    Encrypt
}