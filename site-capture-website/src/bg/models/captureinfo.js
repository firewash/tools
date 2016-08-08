
class CaptureInfo {
    constructor(data) {
        // todo 这里应该全新构造一个新的数据而不是直接修改原来的数据
        const doc = data;
        if (doc.interval) {
            doc.interval = +doc.interval;
        }
        return doc;
    }
}


module.exports = {
    factory: {
        create(data) {
            return new CaptureInfo(data);
        }
    }
}
