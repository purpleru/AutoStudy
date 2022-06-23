const request = require('../chaoxingRequest');

const host = 'http://mooc1.chaoxing.com';

const cheerio = require('cheerio');

async function getResource(params = {}, options = {}) {

    /*
      courseId: 219802873
      clazzid: 54961318
      chapterId: 470144782
      cpi: 170786324
      verificationcode:
      mooc2: 1
    */

    var { courseId, clazzid, chapterId } = params;
    var result = await request('http://mooc1.chaoxing.com/mycourse/studentstudyAjax', 'post', {
        courseId: courseId,
        clazzid: clazzid,
        chapterId: chapterId,
        verificationcode: '',
        mooc2: 1
    }, options);

    var $ = cheerio.load(result.data),
        Concurrencys = [];

    var $tabBtns = $('#prev_tab .prev_ul > li'),
        iframeSrc = $('#iframe').prop('src');

    // 并发请求获取iframe资源
    $tabBtns.each(function (index) {
        var url = new URL(iframeSrc, host);
        url.searchParams.set('num', index);
        Concurrencys.push(request(url.toString(), 'get', {}, options));
    });

    return Promise.all(Concurrencys).then(documents => {
        var resources = [],
            mArgRule = /mArg\s*=\s*{(.+)}/;
        documents.forEach(function (doc) {
            var mArg = doc.data.match(mArgRule) || [''];
            resources.push(JSON.parse(mArg[0].replace(/mArg\s*=\s*/, '') || '{}'));
        });
        return resources;
    });
}

module.exports = getResource;