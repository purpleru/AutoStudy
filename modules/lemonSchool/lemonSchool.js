const request = require('./lemonRequest');

// request (url,method,data,options)

const queryString = require('querystring');

const { deURI, cookieStringify, cookieParse } = require('../../tools/tools');

const { createUser } = require('../../mongo/user');

// 学习平台登陆
function learningLogin(param) {
    return request('http://learning.wencaischool.net/openlearning/login.jsp', 'post', {
        txtLoginName: param['learning_login_name'],
        txtPassword: param['password'],
        txtSchoolCode: param['school_code'],
        txtGradeCode: param['grade_code']
    }, {
        headers: {
            'Cache-Control': 'max-age=0'
        },
        noCrypto: true
    });
}

// 使用能量获得课程 （不用使用能量也能完成视频播放，...好像没有什么用）
function useEnerg(param, options) {

    var params = {
        'learning_user_id': param['userId'], // 学习平台id
        'course_id': param['course_id'], // 课程id
        'type_code': 'progress',
        'item_id': param['item_id'] //课程项id
    }

    return request('http://learning.wencaischool.net/openlearning/newApp_use_energy.action?req=saveUseEnergyInfo', 'post', params, options);

}

const route = {
    // 登陆
    login: async function(param, options) {

        var { user, pwd } = param || {};

        if (!param['user'] || !param['pwd']) {
            throw { code: 400, msg: '请输入完整' };
        }

        if (options['cookie']['gzcjzyxy_student_COOKIE']) throw { code: 400, msg: '已处于登陆状态!' }

        try {
            var result = await request('http://site.wencaischool.net/gzcjzyxy/index.action?req=login', 'post', {
                txtLoginName: param['user'],
                txtPassword: param['pwd']
            });

            // 登陆成功后需要获取cookie
            if (result['code'] == 1000) {
                var response = await request(`http://site.wencaischool.net/gzcjzyxy_student/login.action?req=doStudentLoginQRZ&debug=true&login_name=${param['user']}&password=${param['pwd']}`, 'get', '');
                result['cookie'] = Array.isArray(result['cookie']) ? result['cookie'].concat(response['cookie']) : response['cookie'];

                // 顺便登陆学习平台
                var gzcjzyxy_student_COOKIE = cookieParse(result['cookie'])['gzcjzyxy_student_COOKIE'];

                if (gzcjzyxy_student_COOKIE) {
                    gzcjzyxy_student_COOKIE = deURI(queryString.parse(gzcjzyxy_student_COOKIE));
                    response = await learningLogin(gzcjzyxy_student_COOKIE);
                }
                result['cookie'] = result['cookie'].concat(response['cookie']);

                // 保存到数据库
                createUser({
                    user: user,
                    password: pwd,
                    cookie: cookieStringify(cookieParse(result['cookie'])),
                    userInit: gzcjzyxy_student_COOKIE
                });
            }

        } catch (err) {

        }
        return result;
    },
    // 102174,102140
    // 获取 semester
    semester: function(param, options) {
        return request('http://site.wencaischool.net/gzcjzyxy_student/full_time_student_learn.action?req=getTerm', 'get', '', options);
    },

    // semester subject 学期科目
    subject: function(param, options) {
        return request('http://site.wencaischool.net/gzcjzyxy_student/full_time_student_learn.action?req=getStudentLearnInfo', 'post', {
            term_code: param['termId']
        }, options);
    },

    // subjectitem 科目项
    subjectitem: function(param, options) {
        return request('http://learning.wencaischool.net/openlearning/newApp_learn_course.action?req=getCourseScormItemList', 'post', {
            course_id: param['course_id']
        }, options);
    },

    // 完成视频播放
    play: async function(param, options) {

        var { time } = param || {}, time = time || 999;

        var userInit = deURI(queryString.parse(options['cookie']['gzcjzyxy_student_COOKIE']));

        var data = {
            user_id: userInit['learning_user_id'], //学习平台账号id
            course_id: param['course_id'], //课程id
            time: time, //离开时间
            item_id: param['item_id'], //课程项id
            view_time: time,
            last_view_time: time,
            video_length: time,
            learning_user_id: userInit['user_id']
        }

        // 没卵用(开启了还浪费能量)
        // var result = await useEnerg({
        //     'userId': userInit['learning_user_id'], // 学习平台id
        //     'course_id': param['course_id'], // 科目id
        //     'type_code': 'progress',
        //     'item_id': param['item_id'] //科目项id
        // }, options);
        // console.log(result);

        return request('http://learning.wencaischool.net/openlearning/learning.action?req=submitScormAndHistorySave', 'post', data, options);

    }
}

module.exports = {
    route: route,
    learningLogin: learningLogin,
    useEnerg: useEnerg,
    cookieParse,
    deURI
};