const mongodbObjectID = require('mongodb').ObjectID;
const loggie = require('../lib/loggie').logger;
// Object.hasOwnProperty的封装。因为NodeJS最新版本里，res.body虽然是object，但是hasOwnProperty被去掉了。
function hasOwnKey(object, keyName) {
    let rel = false;
    if (object.hasOwnProperty) {
        rel = object.hasOwnProperty(keyName);
    } else {
        rel = Object.hasOwnProperty.call(object, keyName);
    }
    return rel;
}

class CaptureEntriesQueryCondition {
    constructor(_condition) {
        const condition = {};
        // 处理模糊搜索的字段. 作为URL的模糊字段
        if (hasOwnKey(_condition, 'hazy')) {
            const value = _condition.hazy.trim();
            if (value) {
                condition.url = new RegExp(value, 'i');
            }
        }
        // 处理task id
        if (hasOwnKey(_condition, 'taskid')) {
            const value = _condition.taskid;
            if (value) {
                if (typeof value === 'string' && value.length === 12) {
                    condition.taskid = mongodbObjectID(value);
                } else {
                    loggie.error('Task id is illegal in CaptureEntriesQueryCondition');
                }

            }
        }
        // 变化率（其实这里应该是：最低变化率）
        if (hasOwnKey(_condition, 'mismatch')) {
            const value = +_condition.mismatch;
            if (value > 0) condition['diffinfo.misMatchPercentage'] = { $gte: value };
        }

        return condition;
    }
}

module.exports = {
    factory: {
        create(data) {
            return new CaptureEntriesQueryCondition(data);
        }
    }
}
