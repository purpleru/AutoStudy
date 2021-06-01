// 获取学期课程
const course = require('./course');

const subject = require('./courseList');

const saveStatus = require('./saveStatus');

const { ChaoXing } = require('../../../mongo/chaoxing');

var queue = {};

module.exports = async(params, options) => {

    var { uname } = params;

    var user = await ChaoXing.findOne({ user: uname });

    if (!user) return { code: 201, msg: '请先进行登陆' }

    if (queue[uname]) {
        return { code: 400, msg: '当前账号正在刷取中,请勿多次提交!' }
    } else { queue[uname] = uname }


    var test = new Auto(user, function() {
        // 利用闭包操作,成功后删除已经刷取完毕的账号
        console.log(`账号:[${uname}]课程刷取完毕!`);
        delete queue[uname];
    });

    // // 2020年秋季学期
    test.play();

    return {
        msg: '提交成功',
        queue
    }
}

// 生成随机Str
function randomStr(prefix = 'zzr') {

    var init = [prefix],
        I = Math.random() * 13,
        Love = Math.random() * 14,
        You = Math.random() * 520,
        GoodBye = I + Love + You;

    // console.log(I, Love, You, GoodBye);

    init[init.length] = Math.ceil(Date.now() / GoodBye);

    return init.join('_');
}

async function getAllCourseID(courseLists, options) {
    var lists = courseLists,
        requestArray = [];
    lists.forEach((item, index) => {
        requestArray.push(course.getCourseParams({
            link: item.link
        }, options));
    });

    var result = await Promise.all(requestArray);

    result.forEach((item, index) => {
        if (item.data) {
            lists[index].data = item.data;
        } else {
            lists[index].data = {};
        }
    });

    return lists;
}

// 解析参数
function courseParamsParse(courseId, clazzid, chapterId, cpi, chapterVerCode) {
    return {
        courseId,
        clazzid,
        chapterId,
        cpi,
        chapterVerCode
    }
}

class Auto {

    constructor(user, callback) {

        this.user = user;

        this.options = {
            cookie: this.user.cookie
        };

        this.callback = callback;

        // 执行栈的任务队列
        this.queue = {};

        // 已刷取完毕课程数目
        this.courseCount = 0;

        // 课程总数
        this.courseTotal = 0;
    }

    // 课程执行栈（任务队列）
    async execute(course_info, time) {
        var { link, data } = course_info;

        if (!link) {
            this.record();
            return { code: 400 };
        };


        // 获取课程列表项 data => courseId, chapterId, clazzid
        try {
            var result = await subject({ link: data['url'] }, this.options);
        } catch (err) {
            console.log(`获取课程 => ${course_info.name} 项列表失败 error => ${err.message}`);
            this.record();
            return { code: 500 };
        }

        // 筛选没有通过的课程项
        result.data = result.data.filter((item) => !item.isPass);

        if (result.data.length === 0) {
            console.log(`课程 => ${course_info.name} 任务已全部通过完成!`);
            return this.record();
        }

        var rand = randomStr();

        this.queue[rand] = new Object();

        this.queue[rand]['course_info'] = course_info;

        this.queue[rand]['subject_lists'] = result.data;

        // 执行队列的索引
        this.queue[rand]['index'] = 0;

        this.queue[rand]['timer'] = true;

        this.queue[rand]['name'] = rand;

        this.queue[rand]['time'] = time || 5000;

        // console.log(this.queue[rand]);

        this.saveStatus(this.queue[rand]);

    }

    // 记录课程完成进度
    record() {
        this.courseCount++;
        if (this.courseCount >= this.courseTotal) {
            this.callback && this.callback(this);
        }
    }

    // 保存视频状态
    async saveStatus(currentQueue) {
        var { subject_lists, course_info, index, time } = currentQueue;

        var { chapter_name, section_name, data } = subject_lists[index];

        console.log(`正在刷取[课程] => ${course_info.name} => ${chapter_name} > ${section_name}`);

        try {
            var result = await saveStatus(data, this.options);
            console.log(result.msg);
        } catch (err) {
            console.log(err);
            console.log(`[课程] => ${course_info.name} => ${chapter_name} > ${section_name} 刷取失败`);
            console.log(`${section_name}刷取失败 => 正在尝试重新刷取`);
            currentQueue['index']--;
        }

        if (currentQueue['index'] == index) {
            console.log(`[课程] => ${course_info.name} => ${chapter_name} > ${section_name} 刷取成功`);
        }

        currentQueue['index']++;

        if (currentQueue['index'] >= subject_lists.length) {
            console.log(`课程 => ${course_info.name} 刷取完毕!`);
            currentQueue['timer'] = false;
            delete this.queue[currentQueue['name']];
            // console.log(this.queue);
            this.record();
            return {};
        }

        currentQueue['timer'] && setTimeout(this.saveStatus.bind(this, currentQueue), time);
    }

    async play(term) {
        this.term_course = await course({ type: 'link' }, this.options);

        if (term) {
            term = this.term_course.find((item) => {
                return item.term_name.includes(term);
            })
        }

        this.term_course = term ? term : this.term_course[0];

        // 获取学期课程信息
        await getAllCourseID(this.term_course['course'], this.options);

        this.courseTotal = this.term_course['course'].length;

        this.term_course['course'].forEach((item, index) => {
            this.execute(item, index * 20000);
        });

        return {
            code: 200,
            msg: '提交成功'
        }
    }
}