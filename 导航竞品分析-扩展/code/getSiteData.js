console.log('content js');


/**
 * 扁平化压榨数据（链接们） 1
 * opt = {
 *   rule 
 *   dom
 * } 
 * 
 * data={
 *  label: [{
 *      label,
 *      href
 *  },...]....
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
        for (let i = 0, len = links.length; i < len; i++) {
            let item = links[i];
            let protocol = item.protocol;
            if (protocol === 'http:' || protocol === 'https:') {
                let label = item.innerText.replace(/\s/g, '');
                let originHref = item.href;
                let href = item.origin + item.pathname; //（不要包含search）
                let key = href;//   //拿URL当key会比较合适。数据存储的key
                let count = (data[key]&&data[key].count) ? (++data[key].count) : 1; //文档中出现的次数
                let dataSN = label + (Math.random()+"").replace("0.","");   //建立数据和dom的唯一关联
                data[key] = ({
                    label: label,
                    href: href,
                    originHref: originHref,
                    count: count,
                    dataSN: dataSN,
                    cflag: ""
                });
                item.dataset.sn = dataSN;
            }
        }
    }
    return data;
}

var data = bleedAndMarkData();
console.log(data);
data;