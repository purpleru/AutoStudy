const request = require('../chaoxingRequest');

const cheerio = require('cheerio');

route.getCourseParams = getCourseParams;
module.exports = route;

async function route(params, options) {

    var { data } = await request('https://mooc1-1.chaoxing.com/visit/courselistdata', 'get', {
        courseType: 1,
        courseFolderId: 0,
        baseEducation: 0,
        courseFolderSize: 0
    }, options);

    var $ = cheerio.load(data),
        lists = [];

    $('#courseList').children('li').each(function (index, el) {
        var $el = $(el);
        lists.push({
            name: $el.find('.course-name').text(),
            courseid: $el.attr('courseid'),
            personid: $el.attr('personid'),
            clazzid: $el.attr('clazzid'),
            link: $el.children('.course-cover').find('a').prop('href')
        });
    });

    return {
        data: lists
    }
}

async function getCourseParams(params, options) {
    if (!params.link) {
        return {
            code: 400,
            msg: '课程link不能为空'
        }
    }
    var { _http, cookie, data } = await request(params.link, 'get', {}, options),
        url = new URL(_http.responseHeaders.location), searchParams = url.searchParams;

    return {
        data: {
            courseId: searchParams.get('courseId'),
            clazzid: searchParams.get('clazzid'),
            url: url.toString()
        },
        cookie
    }
}

function parseData(html) {
    var data = [];
    var $ = cheerio.load(html);
    $('.bxCourse').each((index, item) => {

        var term = {
            term_name: $(item).children('.smalTitle').html(),
            course: []
        }

        $(item).children('.courseDetail').each((index, item) => {
            var link = $(item).children('.topBtn').attr('href');
            var name = $(item).find('.detailRIght>h3>a').text();
            var cover = $(item).find('.courseImg>img').attr('src');
            term.course.push({
                link: link ? 'http://mmvtc.jxjy.chaoxing.com' + link : null,
                name: name.replace(/^\s*|\s*$/g, ''),
                cover: cover.replace(/\s*/g, '')
            })
        });
        data.push(term);
    })
    return data;
}