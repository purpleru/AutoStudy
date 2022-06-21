const { User } = require('../../mongo/user');

const { route, deURI } = require('./lemonSchool');

const { semester, subject, subjectitem, play } = route;

// 从一个数组对象里面提取指定的属性
function filterData(data) {
    var arr = [];

    for (let i = 0; i < this.length; i++) {
        var obj = {};
        Object.keys(this[i]).forEach(value => {
            for (let k in data) {
                if (k === value) {
                    obj[data[k]] = this[i][value];
                    break;
                }
            }
        });

        if (Object.keys(obj).length > 0) {
            arr.push(obj);
        }
    }

    return arr;
}

Array.prototype.filterData = filterData;

// 参数别乱传，懒得写判断
async function processing(params = {}, options = {}) {

    var { program, data } = params, msg = params['msg'] || '获取某个信息异常';

    try {
        var result = await program(data || {}, options);
        if (result['code'] === 1000) {
            return result['data'];
        } else {
            console.log(msg);
            console.log(result);
            return [];
        }
    } catch (err) {
        console.log(err);
        console.log(msg);
        return [];
    }

}

class Auto {
    constructor(params, callback) {
        this.user = params.user || {};
        this.options = params.options || {};
        this.cookie = deURI(this.options.cookie);
        this.test = {};
        this.callback = callback;
        this.subjectItem = 0;
    }

    // 获取所有学期
    async getAllSemester() {
        var result = await processing({
            program: semester,
            data: '',
            msg: '获取学期失败'
        }, this.options);

        return result.filterData({ termCode: 'termId', term: 'term', isCurrentTerm: 'currentTerm' });
    }

    // 获取学期所有课程
    async getAllSubject(termId) {
        var result = await processing({
            program: subject,
            data: {
                termId: termId
            },
            msg: `获取学期${termId}课程失败`
        }, this.options);

        return result['courseInfoList'].filterData({ courseName: 'courseName', courseId: 'course_id' }).filter(value => value['course_id'] > 0);
    }

    // 获取课程所有没有观看完成项
    async getAllSubjectItem(course_id) {
        var result = await processing({
            program: subjectitem,
            data: {
                course_id: course_id
            },
            msg: `获取课程${course_id}项失败`
        }, this.options);
        return result['listCourseLesson'] && result['listCourseLesson'].filterData({
            courseId: 'courseId',
            chapterName: 'chapterName',
            lessonId: 'item_id',
            timeLen: 'timeLen',
            useEnergyNum: 'useEnergyNum',
            lessonName: 'item_name',
            courseName: 'courseName',
            isFinish: 'isFinish',
            isChapter: 'isChapter'
        }).filter(value => value['timeLen'] > 0 && !value['isFinish'] && value['isChapter'] != true);
    }

    async play(query) {

        try {
            var result = await play({
                course_id: query['courseId'],
                item_id: query['item_id'],
                time: query['timeLen']
            }, this.options);
        } catch (err) {
            console.log(err);
            var msg = `刷取视频${query['item_id']}失败，课程ID:${query['courseId']}`;
            console.log(msg);
            return { code: 500, message: msg };
        }

        return result;
    }

    // 刷取课程
    async autoPlay(query) {

        var { course_id, time } = query;

        if (!course_id) return;

        var result = await this.getAllSubjectItem(course_id);

        if (!result || result.length === 0) return this.total();

        var rand = ('timer_' + Math.random() * 30).replace('.', '');

        this.test[rand] = {};
        // 全部课程项Array
        this.test[rand]['subjectItem'] = result;
        // 执行的索引
        this.test[rand]['index'] = 0;

        // 延时器执行时间 默认5秒
        this.test[rand]['time'] = time || 5000;

        // 用来关闭延时器的,(现在好像没有什么用了);
        this.test[rand]['timers'] = true;

        this.test[rand]['course_id'] = course_id;

        // 其实也可以传一个对象进去操作的,懒得改了
        this.timer(rand);

        return result;

    }

    // 记录课程项播放进度
    async timer(name) {

        const { subjectItem, index, time } = this.test[name];

        const { courseName, item_name, courseId, item_id } = subjectItem[index];

        const msg = `课程${courseName} => ${item_name}项`;
        const item_init = `[课程ID:${courseId} => 项ID:${item_id}]`;
        console.log(`正在刷取${msg}`);

        var result = await this.play(subjectItem[index], name);

        if (result['code'] == 1000) {
            console.log(`${msg},刷取成功 => [message:${result['message']}]${item_init}`);
        } else {
            console.log(`${msg},刷取失败 => [message:${result['message']}]${item_init}`);
            console.log(`${msg},刷取失败 => 正在尝试重新刷取.....`);
            this.test[name].index--;
        }

        // console.log(res);

        this.test[name].index++;

        // 记录某一课程刷取完毕
        if (this.test[name].index >= subjectItem.length) {
            console.log(`课程${courseName}刷取完毕！`);
            this.test[name].timers = false;
            delete this.test[name];
            this.total();
            return;
        }

        this.test[name].timers && setTimeout(this.timer.bind(this, name), time);
    }

    // 记录课程是否全部刷取完毕
    total() {
        this.subjectItem++;
        if (this.subjectItem >= this.subjectTotal) {
            this.callback && this.callback();
        }
    }

    // 快速完成 一个学期的所有课程
    async fast(term) {

        // term 刷取的学期 默认刷取当前学期
        if (!term) {
            term = await this.getAllSemester(), term = Array.isArray(term) && term.find(value => value['currentTerm']), term = term && term['termId'];
            if (!term) return;
        }

        var result = await this.getAllSubject(term);

        this.subjectTotal = result.length;

        result.forEach((item, index) => {
            // { courseName: '中国传统文化', course_id: 102129 }
            this.autoPlay({ course_id: item['course_id'], time: 5000 * index });
        });

    }

}

// 刷取的队列,防止多次提交造成服务器压力大。
var queue = {};

async function autoPlay(query, options) {

    var { user: zrUser, term } = query || {};

    var user = await User.findOne({ user: zrUser });

    if (!user) return { code: 201, msg: '请先进行登陆!' }

    if (queue[zrUser]) {
        return { code: 400, msg: '当前账号正在刷取中,请勿多次提交!' }
    } else { queue[zrUser] = zrUser }

    var result = new Auto({
        "user": user,
        "options": options
    }, function () {
        // 利用闭包操作,成功后删除已经刷取完毕的账号
        console.log(`账号:[${zrUser}]课程刷取完毕!`);
        delete queue[zrUser];
    });
    result.fast(term);

    return {
        code: 200,
        msg: '提交成功',
        queue: queue
    }

}

module.exports = autoPlay;