console.log('content js');


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

function bleedAndMarkData(opt) {
    opt = opt || {};
    let rule = opt.rule;
    let dom = opt.dom||document.body;
    let data = {};
    let urlReg = /http|htts/;
    if (rule) {
        
    } else {
        let links = dom.getElementsByTagName("a");
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
    return data;
}

var data = bleedAndMarkData();
console.log(data);
data;