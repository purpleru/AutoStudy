const request = require('../chaoxingRequest');

const cheerio = require('cheerio');

module.exports = async function (params, options) {

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