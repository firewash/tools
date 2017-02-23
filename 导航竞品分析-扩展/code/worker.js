
// 结果列表的html
function calResultTableHTMLForOneCat(sitesArr){
    let equalHTML = [];
    let diffCountHTML = [];
    let diffLabelHTML = [];
    let otherHTML = [];
    let headFragments = [];
    let htmlFragments = [];
    const subscript = {
        "equal": 0,
        "diff-count": 1,
        "diff-label": 2,
        "new": 3
    }
    sitesArr.forEach(function(site, siteIndex) {
        let tabInfo = site.tab;
        let siteData = site.data;
        if (headFragments.length === 0) {
            headFragments.push('<tr>');
        }
        headFragments.push(`<td colspan=6>${tabInfo.title}</td>`)
        if (siteIndex === sitesArr.length - 1) {
            headFragments.push('</tr>');
        }
        let tempSiteHTML = [
            [],
            [],
            [],
            []
        ];

        let dataKeys = Object.keys(siteData);
        dataKeys.forEach(function(dataKey, dataIndex) {
            let url = dataKey;
            let link = siteData[dataKey];
            let cflag = link.cflag;
            let items = link.items;
            let labels = Object.keys(items).join(";");
            let count = labels.length;
            let str = ` <td class="${link.cflag}">${link.cflag}</td>
                    <td class="${link.cflag}" title='出现${count}次'>${count>1?count:''}</td>
                    <td class="${link.cflag}">${labels}</td>
                    <td class="${link.cflag}">${url}</td>
                    <td class="${link.cflag}"><button data-tabid="${tabInfo.id}" data-url="${url}" title="在tab页中查看"></button></td>`; //<td class='counter'></td>
            tempSiteHTML[subscript[cflag]].push(str);

        });
        var cc = [];
        tempSiteHTML.forEach(function(set) {
            cc = cc.concat(set);
        });
        htmlFragments.push(cc);
    });

    let maxLength = 0;
    let siteCount = htmlFragments.length;
    htmlFragments.forEach(function(set) {
        maxLength = Math.max(maxLength, set.length);
    });
    let concatStr = '';
    for (var i = 0; i < maxLength; i++) {
        concatStr += "<tr>"
        for (var j = 0; j < siteCount; j++) {
            concatStr += `<td class="counter">${i+1}</td>${htmlFragments[j][i]||"<td></td><td></td><td></td><td></td><td></td>"}`;
        }
        concatStr += "</tr>"
    }

    let html = `<table id="resultTable">
                <thead>
                    ${ headFragments.join('')}
                    <tr style="background:#BDD7EE;text-align:center;font-weight:bold;">
                        <td style='width:20px;'>序号</td><td style='width:40px;'>标识</td><td style='width:20px;'>出现次数</td><td style='width:200px;'>标题</td><td style='width:200px;'>URL</td><td style='width:60px;'>操作</td>
                        <td style='width:20px;'>序号</td><td style='width:40px;'>标识</td><td style='width:20px;'>出现次数</td><td style='width:200px;'>标题</td><td style='width:200px;'>URL</td><td style='width:60px;'>操作</td>
                    </tr>
                </thead>
                <tbody>
                    ${concatStr}
                </tbody>
                </table>`;
     return html;           
}

function calResultTableHTML(sitesArr) {
    var result = {};
    var cats = Object.keys(sitesArr[0].data);
    var siteLength = sitesArr.length;
    cats.forEach(function(cat, index){
        var newsitesArr = [];
        for(let i=0;i<siteLength;i++){
            newsitesArr.push({
                tab: sitesArr[i].tab,
                data: sitesArr[i].data[cat]
            });
        }
        result[cat] = calResultTableHTMLForOneCat(newsitesArr);
    });
    return result;
}

onmessage =function(event) {
    var data = event.data;
    switch(data.type) {
        case 'calResultTableHTML':
            postMessage({
                type: 'calResultTableHTML',
                    value: calResultTableHTML(data.value)
            });
            break;
    }
};