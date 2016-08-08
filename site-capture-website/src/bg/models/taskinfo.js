
class TaskInfo {
    constructor(data) {
        const newData = {
            domain: data.domain,
            url: /^https?:/i.test(data.url) ? data.url : `http://${data.url}`,
            startdate: data.startdate,
            starttime: data.starttime,
            scheduled: data.scheduled || 'onetime',
            name_prefix: data.name_prefix,
            email_notify_enabled: data.email_notify_enabled === true
            || data.email_notify_enabled === 'true'
            || data.email_notify_enabled === 'on',
            email_list: data.email_list,
            enabled: data.enabled === true || data.enabled === 'true' || data.enabled === 'on',
            agent_width: +data.agent_width,
            agent_height: +data.agent_height,
            useragent: data.useragent,
            ignore: data.ignore,
            createtime: new Date()
        };

        return newData;
    }
}

module.exports = {
    factory: {
        create(data) {
            return new TaskInfo(data);
        }
    }
}
