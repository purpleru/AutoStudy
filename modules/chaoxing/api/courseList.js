const request = require('../chaoxingRequest');

// 和jQuery一样的选择器
const cheerio = require('cheerio');

module.exports = async(params, options) => {
    var { version } = options;
    if (version == 'v1') {
        return getCourseLists_v1(params, options);
    } else {
        return getCourseLists_v2(params, options);
    }
}

async function getCourseLists_v2(params, options) {

    var { link } = params;

    if (!link) {
        return {
            msg: '获取v2课程项列表link不能为空',
            code: 400
        }
    }

    var result = await request(link, 'get', {}, options);

    var $ = cheerio.load(result['data']),
        lists = [];

    $('.timeline > .units a').each((index, element) => {
        var href = $(element).attr('href'),
            reg = /courseId/;

        if (reg.test(href)) {
            var url = new URL('http://mooc1.chaoxing.com' + href),
                chapterId = url.searchParams.get('chapterId'),
                courseId = url.searchParams.get('courseId'),
                clazzid = url.searchParams.get('clazzid'),
                icon = $(element).find('.icon > em').attr('class');
            lists.push({
                section_name: $(element).find('.articlename').attr('title'),
                chapter_name: $(element).parents('.units').find('h2 > a').attr('title'),
                data: {
                    chapterId,
                    courseId,
                    clazzid
                },
                isPass: icon == 'openlock' ? true : false,
                link: url.toString()
            });
        }
    });

    return result['data'] = lists, result;
}

async function getCourseLists_v1(params, options) {
    var { courseId, chapterId, clazzid } = params;
    var result = await request('http://mooc1.chaoxing.com/mycourse/studentstudycourselist', 'get', {
        courseId: courseId,
        chapterId: '',
        clazzid: clazzid,
        mooc2: 1
    }, {
        cookie: options.cookie
    })

    var $ = cheerio.load(result['data']);

    var course_data = [];

    $('[onclick^=getTeacherAjax]').each((index, element) => {

        var data = $(element).attr('onclick');
        var posCatalog_select = $(element).parents('.posCatalog_level').siblings('.posCatalog_select')

        course_data.push({
            section_name: $(element).attr('title'),
            data: data.match(/\((.+)\)/)[1].replace(/'/g, '').split(','),
            chapter_name: posCatalog_select.find('span').attr('title'),
            id: posCatalog_select.attr('id')
        })

    });

    return result['data'] = course_data, result;
}