const request = require('../chaoxingRequest');

const host = 'http://mooc1.chaoxing.com';

const cheerio = require('cheerio');

async function studentstudy(params = {}, options = {}) {
    var { courseId, clazzid, chapterId } = params;
    var result = await request('http://mooc1.chaoxing.com/mycourse/studentstudyAjax', 'post', {
        courseId: courseId,
        clazzid: clazzid,
        chapterId: chapterId
    }, options);


    var $ = cheerio.load(result.data);

    // 视频资源存在的页数 默认在 0
    var videoPage = $('[title=视频]').attr('onclick'),
        iframeLink = `${host}${$('#iframe').attr('src')}`,
        url = '';

    if (videoPage) {
        videoPage = videoPage.match(/\((.+)\)/)[1];
        url = new URL(iframeLink);
        url.searchParams.set('num', videoPage.slice(0, 1) - 1);
        iframeLink = url.toString();
    }

    return requestIframeLink(iframeLink, options);
}


// 请求 iframe 框架 src 链接
async function requestIframeLink(link = '', options) {
    var result = await request(link, 'get', {}, options);

    var mArg = result.data.match(/mArg\s*=\s*{(.+)}/g) || [''];

    var $ = cheerio.load(result.data),
        iframeTask = [];

    //如果 iframeTask 为空 则说明 此页面没有发现未有完成的任务资源

    var rule = /(mp4)$/;

    $('iframe').each((index, el) => {
        var iframe_info = JSON.parse($(el).attr('data') || '{}');
        if (rule.test(iframe_info['type'])) {
            iframeTask.push(iframe_info);
        }
    });

    try {
        return {
            task: iframeTask,
            course_info: JSON.parse(mArg[0].replace(/mArg\s*=\s*/, '') || '{}')
        }
    } catch (err) {}
}

module.exports = studentstudy;