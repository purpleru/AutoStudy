const getCourseList = require('./courseList');

const getAttachments = require('./attachment');

const saveStatus = require('./saveStatus');

const { ChaoXing } = require('../../../mongo/chaoxing');

var queue = {};

module.exports = async (params, options) => {

    var { uname, courseId, clazzid, personid } = params;
    console.log(params);

    if (!(courseId && clazzid && personid)) {
        return {
            code: 400,
            msg: '参数不能为空'
        };
    }

    var user = await ChaoXing.findOne({ user: uname });

    if (!user) return { code: 201, msg: '请先进行登陆' }

    if (queue[uname]) {
        return { code: 400, msg: '当前账号正在刷取中,请勿多次提交!' }
    } else { queue[uname] = uname }


    var des = new Auto({ user, options, courseInfo: params }, function () {
        // 利用闭包操作,成功后删除已经刷取完毕的账号
        console.log(`账号:[${uname}]课程刷取完毕!`);
        delete queue[uname];
    });

    des.autoPlay();

    return {
        msg: '提交成功',
        queue,
        info: randomStr()
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


class Auto {

    constructor(params, callback) {

        this.user = params.user || {};

        this.options = params.options || {};

        this.courseInfo = params.courseInfo || {};

        this.callback = callback;

        // 课程总项
        this.subjects = [];

        // 已经完成课程项的总数
        this.completeCount = 0;

    }

    // 获取课程下科目项
    async getSubjects(params, options) {
        var { data: subjects } = await getCourseList(params, options);
        if (subjects.length === 0) {
            console.log(`获取课程项 [失败] 可能已限制访问 需要手动输入验证码`);
        }
        // 筛选还没有完成的科目
        return subjects.filter(item => !item.isPass);
    }

    async getAttachments(params, options) {
        var { attachments } = await getAttachments(params, options);
        return attachments.filter(item => item.attachments.length > 0);
    }

    async autoPlay() {
        this.subjects = await this.getSubjects(this.courseInfo, this.options);
        if (this.subjects.length === 0) {
            console.log(`当前课程中暂时没发现还没有完成的课程项`);
            this.callback && this.callback();
            return false;
        }
        this.subjects.forEach((item, index) => {
            this.timer(item, (index + 1) * 5000);
        });

    }

    timer(subjectItem, time) {
        setTimeout(this.callStack.bind(this, subjectItem), time || 2000);
    }

    async callStack(target = {}) {

        var currentTarget = target,
            { chapter_name, section_name, data } = currentTarget || {};

        console.log(`正在搜查 [${chapter_name}] 中的 [${section_name}] 可执行任务`);

        var params = {
            'courseId': data[0],
            'clazzid': data[1],
            'chapterId': data[2]
        }

        // 获取当前章节中的任务附件
        try {
            currentTarget.taskTotal = await this.getAttachments(params, this.options);
        } catch (err) {
            console.log(`搜查 [${chapter_name}] 中的 [${section_name}] 可执行任务 [失败]`);
            this.total();
            return false;
        }

        console.log(`在 [${chapter_name}] 中的 [${section_name}] 发现 [${currentTarget.taskTotal.length}] 个可执行任务`);

        currentTarget.taskCount = 0;

        this.attachmentTask(currentTarget);

    }

    total() {
        this.completeCount++;
        if (this.completeCount >= this.subjects.length) {
            this.callback && this.callback();
        }
    }

    attachmentTask(currentTarget) {
        // var c = {
        //     taskTotal: [
        //         {
        //             attachments: [],
        //             defaults: {}
        //         },
        //         {
        //             attachments: [],
        //             defaults: {}
        //         },
        //         {
        //             attachments: [],
        //             defaults: {}
        //         }
        //     ]
        // }
        const { chapter_name, section_name, taskTotal } = currentTarget,
            currentTask = taskTotal[currentTarget.taskCount];

        if (currentTarget.taskCount >= taskTotal.length) {
            console.log(`${chapter_name}中的${section_name}任务已经全部完成`);
            this.total();
            return;
        }

        currentTask['currentIndex'] = currentTarget.taskCount;

        currentTarget.taskCount++;

        currentTask['chapter_name'] = chapter_name;
        currentTask['section_name'] = section_name;

        this.saveStatus(currentTask, 0);

        setTimeout(this.attachmentTask.bind(this), 2000, currentTarget);
    }

    async saveStatus(currentTask, count) {

        var { chapter_name, section_name, attachments, defaults, currentIndex } = currentTask;

        if (count >= attachments.length) {
            console.log(`当前 [${chapter_name}] [${section_name}] [${currentIndex}] 项的附件任务已经全部完成`);
            return;
        }

        var currentAttas = attachments[count], rules = /video|\.mp4/i,
            { type, property } = currentAttas || {},
            fileName = property.name || property.title || property.module;


        if (!(rules.test(type) || rules.test(property['type']))) {
            console.log(`当前 [${chapter_name}] [${section_name}] 中的 [${fileName}] 不是视频附件已跳过此附件任务`);
            this.saveStatus(currentTask, count + 1);
            return;
        }

        console.log(`正在开始发送请求完成 [${chapter_name}] [${section_name}] 中的 [${property.name}] 附件任务`);

        var params = {
            clazzId: defaults['clazzId'],
            objectId: currentAttas['objectId'],
            otherInfo: currentAttas['otherInfo'],
            jobid: property['_jobid'],
            userid: defaults['userid'],
            reportUrl: defaults['reportUrl'],
            rt: property['rt']
        }

        try {
            var { data } = await saveStatus(params, this.options);
        } catch (err) {
            // console.log(err);
            console.log(`当前 [${chapter_name}] [${section_name}] 中的 [${property.name}] 保存状态失败`);
        }

        console.log(data);

        if (data.isPassed) {
            console.log(`当前 [${chapter_name}] [${section_name}] 中的 [${property.name}] 保存状态成功`);
        }

        count++;

        setTimeout(this.saveStatus.bind(this), 5000, currentTask, count);
    }

}