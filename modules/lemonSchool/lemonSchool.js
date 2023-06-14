const request = require('./lemonRequest');

// request (url,method,data,options)

const queryString = require('querystring');

const { deURI, cookieParse, findKey } = require('../../tools/tools');

const { createUser } = require('../../mongo/user');

// 学习平台登陆
function learningLogin(params, options) {
    return request(`${options.urlHost}/login.jsp`, 'post', {
        txtLoginName: params['learning_login_name'],
        txtPassword: params['password'],
        txtSchoolCode: params['school_code'],
        txtGradeCode: params['grade_code']
    }, {
        headers: {
            'Cache-Control': 'max-age=0'
        },
        noCrypto: true
    });
}

// 使用能量获得课程 （不用使用能量也能完成视频播放，...好像没有什么用）
function useEnerg(query, options) {

    var params = {
        'learning_user_id': query['userId'], // 学习平台id
        'course_id': query['course_id'], // 课程id
        'type_code': 'progress',
        'item_id': query['item_id'] //课程项id
    }

    return request(`${options.urlHost}/newApp_use_energy.action?req=saveUseEnergyInfo`, 'post', params, options);

}

function checkPath(path, options) {
    const prefix = 'full_time_',
        userInfo = options.userInfo;

    // 是否全日制
    if (userInfo.isQRZ && userInfo.isQRZ != 'false') {
        path = '/' + prefix + path.substr(path.indexOf('/') + 1);
    }

    return path;
}

const route = {
    // 登陆
    login: async function (params, options) {

        var { user, pwd, code } = params || {};

        if (!params['user'] || !params['pwd']) {
            throw { code: 400, msg: '请输入完整' };
        }

        if (options['cookie']['gzcjzyxy_student_COOKIE']) throw { code: 400, msg: '已处于登陆状态!' }

        try {
            var url = new URL(options.baseURL),
                data = {
                    txtLoginName: user,
                    txtPassword: pwd
                };
                
            url.searchParams.set('req', 'login');

            url.pathname = url.pathname + '/index.action';

            var result = await request(url.toString(), 'post', data);

            // 登陆成功后需要获取cookie
            if (result['code'] === 1000 && result['data'].userType === 'student') {

                const query = queryString.stringify({
                    req: result.data.isQRZ ? 'doStudentLoginQRZ' : 'doStudentLogin',
                    debug: true,
                    login_name: user,
                    password: pwd
                });

                // nysy_student_COOKIE
                var response = await request(`${options.baseURL}_student/login.action?${query}`, 'get', '');
                // 合并 Cookie
                result['cookie'] = Object.assign(result.cookie, response.cookie);

                const schollName = url.pathname.split('/')[1],
                    cookies = result['cookie'],
                    keyName = schollName + '_student_COOKIE';

                // 登陆学习平台
                var info = cookies[keyName] || findKey(cookies, 'COOKIE');

                if (info) {
                    info = deURI(queryString.parse(info.value));
                    response = await learningLogin(info, options);
                    // console.log(response);
                }

                // isQRZ 是否全日制
                result['cookie'] = Object.assign(result.cookie, response.cookie, {
                    userInfo: {
                        name: 'userInfo',
                        value: queryString.stringify(Object.assign(info, { isQRZ: Boolean(result.data.isQRZ) })),
                        maxAge: 2592000,
                        path: '/'
                    }
                });

                // 保存到数据库
                createUser({
                    user: user,
                    password: pwd,
                    cookie: result['cookie'],
                    userInit: info,
                    baseURL: options.baseURL,
                    urlHost: options.urlHost,
                    isQRZ: Boolean(result.data.isQRZ)
                });
            }

        } catch (err) {
            if(err.status===404){
                return {
                    code:404,
                    msg:'请求出错误，您选择的学校已经不在柠檬平台服务范围内！'
                }
            }
            throw new Error(err);
        }

        return result;
    },
    // 102174,102140
    // 获取 semester
    semester: async function (params, options) {
        return request(`${options.baseURL}_student${checkPath('/student_learn.action', options)}?req=getTerm`, 'get', '', options);
    },

    // semester subject 学期科目
    subject: function (params, options) {
        return request(`${options.baseURL}_student${checkPath('/student_learn.action', options)}?req=getStudentLearnInfo`, 'post', {
            term_code: params['termId']
        }, options);
    },

    // subjectitem 科目项
    subjectitem: function (param, options) {
        return request(`${options.urlHost}/newApp_learn_course.action?req=getCourseScormItemList`, 'post', {
            course_id: param['course_id']
        }, options);
    },

    // 获取省份
    portal: async function (p) {
        return request('http://www.wencaischool.net/openlearning/portal/json/province.json', 'get');
    },

    // 学校列表
    schoollist: function (params) {
        const urlHost = params.urlHost || 'www.wencaischool.net/openlearning';
        delete params.urlHost;
        return request(`${urlHost}/school_info.action`, 'post', params);
    },

    // 完成视频播放
    play: async function (params, options) {

        var { time } = params || {}, time = time || 999;

        var info = options.userInfo;

        var data = {
            user_id: info['learning_user_id'], //学习平台账号id
            course_id: params['course_id'], //课程id
            time: time, //离开时间
            item_id: params['item_id'], //课程项id
            view_time: time,
            last_view_time: time,
            video_length: time, //视频总时间
            learning_user_id: info['user_id']
        }

        // 使用能量
        var result = await useEnerg({
            'userId': info['learning_user_id'], // 学习平台id
            'course_id': params['course_id'], // 科目id
            'type_code': 'progress',
            'item_id': params['item_id'] //科目项id
        }, options);
        // console.log(result);
        return request(`${options.urlHost}/learning.action?req=submitScormAndHistorySave`, 'post', data, options);

    }
}

module.exports = {
    route: route,
    learningLogin: learningLogin,
    useEnerg: useEnerg,
    cookieParse,
    deURI
};