console.log('content js');

/* 爬取 规则*/
var rules = {

    "1 酷站分类": {
        "www.uc123.com":{
            //container:document.body,
            selector: ".cool-list dt a"
        },
        "www.hao123.com":{
            //container:document.body,
            selector: ".coolsite-itemname"
        }
    },
    "2 全部链接": {
        container:document.body,
            selector: "a" // 必须的字段
    }
}




/**
 * 提前页面所有的链接，并且对链接进行sn标记
 * opt = {
 *   rule 
 *   dom
 * } 
 * 
 * data={
 *  key-url: {
 *      key-label: [
 *          link, link...
 *      ]
 *  }
 * 
 * }
 * 
 */

function bleedAndMarkData(rules) {
    rules = rules || {};
    let result = {};
    let urlReg = /http|htts/;
    debugger
    for(let rulekey in rules) {
        if(!rules.hasOwnProperty(rulekey))break;
        let data = result[rulekey] =  {};
        let rule = rules[rulekey];
        if(!rule.selector){
            rule = rule[location.host];
        }
        if(!rule)break;
        let container = rule.dom;
        let selector = rule.selector;
        container =container?((typeof container==='string')?document.querySelector(container):container):document.body;

        let links = container.querySelectorAll(selector);
        // debugger;
        for (let i = 0, len = links.length; i < len; i++) {
            let item = links[i];
            let protocol = item.protocol;
            if (protocol === 'http:' || protocol === 'https:') {
                let label = item.innerText.replace(/\s/g, '');
                let originHref = item.href;
                let href = item.hostname + item.pathname; //（不要包含search和protocol和端口号）
                let key_url = href;   //拿URL当key会比较合适。数据存储的key
                let key_label = label;  //label作为第二层Key
                // let count = (data[key]&&data[key].count) ? (++data[key].count) : 1; //文档中出现的次数
                let dataSN = label + (Math.random()+"").replace("0.","");   //建立数据和dom的唯一关联
                data[key_url] = data[key_url] || {
                    cflag:"",
                    items:{}
                };
                data[key_url]["items"][key_label] = data[key_url]["items"][key_label] || [];
                data[key_url]["items"][key_label].push({
                    label: label,
                    href: href,
                    originHref: originHref,
                    // count: count,
                    dataSN: dataSN
                });
                item.dataset.sn = dataSN;
                item.dataset.url = href;
            }
        }
    }
    return result;
}

var data = bleedAndMarkData(rules);
console.log(data);
data;