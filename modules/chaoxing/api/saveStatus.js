const request = require('../chaoxingRequest');

const studentstudy = require('./studentstudy');

const md5 = require('md5-node');

module.exports = async(params, options) => {

    var result = await getTasks(params, options),
        course_info = result['course_info'];

    if (result['tasks'].length === 0) {
        return {
            code: 201,
            ...result
        }
    }

    var queue = [],
        response = [];

    result['tasks'].forEach(item => {
        queue.push(sendRequest(item['request_data'], course_info, options))
    });

    await Promise.all(queue).then(res => {
        res.forEach(item => {
            response.push(item.data);
        })
    });

    return {
        msg: `当前页面共发现 ${result['tasks'].length} 任务,已发送请求完成 ${response.length} 个任务!`,
        task_res: response,
        tasks: result['tasks'],
        course_info: course_info,
        code: 200
    }
}

async function sendRequest(requestData, course_info, options) {

    var defaults = course_info.defaults;

    var duration = requestData['duration'],
        playTime = duration * 1000,
        clazzId = defaults['clazzId'],
        clipTime = 0 + '_' + duration,
        objectId = requestData['objectId'],
        otherInfo = requestData['otherInfo'],
        jobid = requestData['jobid'],
        userid = defaults['userid'],
        enc = `[${clazzId}][${userid}][${jobid}][${objectId}][${playTime}][d_yHJ!$pdA~5][${playTime}][${clipTime}]`;

    return request(`${defaults['reportUrl']}/${requestData['dtoken']}`, 'get', {
        clazzId: clazzId,
        playingTime: duration,
        duration: duration,
        clipTime: clipTime,
        objectId: objectId,
        otherInfo: otherInfo,
        jobid: jobid,
        userid: userid,
        isdrag: '0',
        view: 'pc',
        enc: md5(enc),
        rt: '0.9',
        dtype: 'Video',
        _t: new Date().getTime()
    }, options);
}

/*

[params.reportUrl, "/", params.dtoken, 
"?clazzId=", params.clazzId, 
"&playingTime=", currentTimeSec, 
"&duration=", params.duration, 
"&clipTime=", clipTime, 
"&objectId=", params.objectId, 
"&otherInfo=", params.otherInfo, 
"&jobid=", params.jobid, 
"&userid=", params.userid, 
"&isdrag=", isdrag, 
"&view=pc", 
"&enc=", md5(enc), 
"&rt=", params.rt, 
"&dtype=Video", 
"&_t=", new Date().getTime()].join("");

*/

async function getTasks(params, options) {

    var { task, course_info } = await studentstudy(params, options);

    if (task.length === 0) {
        return {
            tasks: [],
            msg: '此页面没有发现未有完成的任务资源!'
        }
    }

    var queue = [];

    task.forEach((item) => queue.push(getDetailed(item['objectid'], options)));

    await Promise.all(queue).then(response => {
        response.forEach((item, index) => {
            task[index]['task_info'] = item['data'];
        });
    })


    task.forEach(item => {
        item['request_data'] = getRequestData(item, course_info, item['task_info']);
    });

    return {
        tasks: task,
        course_info: course_info
    };
    // return Object.assign({}, result, filter(iframe_video, setting, result || {}));
}

async function getDetailed(objectid, options) {
    if (!objectid) {
        return {
            code: 201
        }
    }
    return await request('http://mooc1.chaoxing.com/ananas/status/' + objectid, 'get', {
        k: options.cookie['fid'],
        flag: 'normal'
    }, options);
}

function getRequestData(iframeVideo, course_info, task_info) {

    var duration = task_info['duration'],
        jobid = iframeVideo['jobid'],
        startDuration = 0,
        request_data = {
            duration: duration,
            dtoken: task_info['dtoken']
        },
        item = {},
        son = '';


    if (course_info && course_info.control) {
        var attachments = course_info['attachments'],
            father = task_info.objectid + "-" + startDuration + "-" + duration + "-" + jobid;
        for (var i = 0; i < attachments.length; i++) {
            item = attachments[i];
            son = item.objectId + "-" + startDuration + "-" + duration + "-" + item.jobid;
            if (father == son) {
                request_data.headOffset = item.headOffset ? Math.floor(parseInt(item.headOffset) / 1000) : 0;
                request_data.objectId = item.objectId;
                request_data.otherInfo = item.otherInfo;
                request_data.isPassed = item.isPassed || false;
                request_data.jobid = jobid;
                break;
            }
        }
    }

    return request_data;
}