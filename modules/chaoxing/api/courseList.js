const request = require('../chaoxingRequest');

// 和jQuery一样的选择器
const cheerio = require('cheerio');

module.exports = async function getCourseLists_v1(params, options) {
    var { courseId, chapterId, clazzid, personid } = params;

    var result = await request('http://mooc1.chaoxing.com/mycourse/studentstudycourselist', 'get', {
        courseId: courseId,
        chapterId: '',
        clazzid: clazzid,
        mooc2: 1,
        cpi: personid || ''
    }, options);

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
        });

    });

    return result['data'] = course_data, result;
}