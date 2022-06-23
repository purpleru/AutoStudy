const request = require('../chaoxingRequest');

const md5 = require('md5-node');

module.exports = async (params, options) => {

    var { data: info, cookie } = await getAttachmentInfo(params, options);

    params['dtoken'] = info['dtoken'];
    params['duration'] = info['duration'];

    var { data: result, cookie: resCookie } = await saveStatus(params, options);

    return {
        data: result,
        attachmentInfo: info,
        cookie: cookie.concat(resCookie)
    };
}

async function saveStatus(params, options) {

    var duration = params['duration'],
        playTime = duration * 1000,
        clazzId = params['clazzId'],
        clipTime = 0 + '_' + duration,
        objectId = params['objectId'],
        otherInfo = params['otherInfo'],
        jobid = params['jobid'],
        userid = params['userid'],
        enc = `[${clazzId}][${userid}][${jobid}][${objectId}][${playTime}][d_yHJ!$pdA~5][${playTime}][${clipTime}]`;

    return request(`${params['reportUrl']}/${params['dtoken']}`, 'get', {
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
        rt: params['rt'] || '0.9',
        dtype: 'Video',
        _t: new Date().getTime()
    }, options);
}

//  获取附件信息
function getAttachmentInfo(params, options) {
    return request(`https://mooc1.chaoxing.com/ananas/status/${params.objectId}`, 'get', {
        k: options.cookie.fid,
        flag: 'normal',
        _dc: Date.now()
    }, {
        headers: {
            Referer: 'https://mooc1.chaoxing.com/ananas/modules/video/index.html'
        },
        ...options
    });
}