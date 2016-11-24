'use strict';

// 数据对比
// 比别人多出：+
// 和别人相同：=
// 比别人不同: ~
// 比别人少
function dataCompare(curTab, toTab) {
    let cur = curTab.data;
    let to = toTab.data;
    let url = null;
    for (url in cur) {
        if (!to[url]) {
            cur[url].cflag = 'new';
            cur[url].des = "本页面有，而对方没有";
            continue;
        }
        let toItemsKeys = Object.keys(to[url].items);
        let curItemsKeys = Object.keys(cur[url].items);

        if (toItemsKeys.length !== curItemsKeys.length) {
            cur[url].cflag = 'diff-count';
            to[url].cflag = 'diff-count';
            cur[url].des = `本页面有${curItemsKeys.length}相同链接，对方有${toItemsKeys.length}相同链接`;
            to[url].des = `本页面有${toItemsKeys.length}相同链接，对方有${curItemsKeys.length}相同链接`;
            continue;
        }

        if (toItemsKeys.join(";") === curItemsKeys.join(";")) {
            cur[url].cflag = 'equal';
            to[url].cflag = 'equal';
            continue;
        }

        cur[url].cflag = 'diff-label';
        to[url].cflag = 'diff-label';
        cur[url].des = cur[url].des = "两个页面的标签内容不同。"
    }
    for (url in to) {
        if (!to[url].cflag) {
            to[url].cflag = 'new';
            to[url].des = "本页面有，而对方没有";
        }
    }
    window.forDebugAndWillRemoved = [curTab, toTab];
    return [curTab, toTab];
}

// 获取页面的数据
function getPageData(tab) {
    return new Promise(function(resolve, reject) {
        chrome.tabs.executeScript(+tab.id, {
            file: "getSiteData.js"
                // code: "[123]"
        }, function(datas) {
            resolve({
                tab: tab,
                data: datas[0] || []
            });
        });
    })
}

// 管理tab列表。根据当前tab打开的情况，更新管理视图
const tabManager = (function() {
    let checkedBase = -1;
    let checkedTabArray = [];

    function refreshTabList() {
        chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] }, function(tabs) {
            let html = `<table>
                        <thead>                   
                            <tr>
                                <td style="width:50px">对比(选2个)</td>
                                <td style="width:50px">tab.id</td> 
                                <td style="width:150px">tab.title</td> 
                                <td style="width:250px">tab.url</td>
                            </tr>
                        </thead>
                        <tbody>`;
            tabs.forEach(function(tab, index) {
                html += `<tr>
                        <td><input type="checkbox" name="checkgroup" value="${tab.id}" data-raw="${encodeURIComponent(JSON.stringify(tab))}" /></td>
                        <td>${tab.id}</td> 
                        <td>${charFilter(tab.title)}</td> 
                        <td>${(tab.url)}</td>
                    </tr>`;
            });
            html += '</tbody></table>';
            $("#tabform").innerHTML = html;
            var boxes = $("#tabform").checkgroup;
            boxes[0] && (boxes[0].checked = true);
            boxes[1] && (boxes[1].checked = true);
            checkedTabArray = tabs;
        });
    }

    function getCheckTabs() {
        checkedTabArray = [];
        let checkboxes = tabform.checkgroup.values();
        let item = null;
        while (item = checkboxes.next()) {
            if (item.done) {
                break;
            } else if (item.value.checked) {
                let value = item.value.value;
                let checkbox = $(`input[value='${value}']`);
                let data = JSON.parse(decodeURIComponent(checkbox.dataset.raw));
                checkedTabArray.push(data);
            }
        }
        return checkedTabArray;
    }

    return {
        refreshTabList,
        getCheckTabs
    };
})();

//将比较结果显示出来
function renderResult(sitesArr) {
    console.log("renderResult");
    if (!sitesArr) return false;
    $("#export").style.display = "inline-block";
    $("#export").onclick = function() {
        let d = new Date();
        let hosts = sitesArr.map(function(item) {
            var url = item.tab.url;
            return (new URL(url)).host;
        });

        let filename = `diff_${hosts.join('_')}_${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
        exportDataToFile('resultTable', filename);
    }

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

    $("#result").innerHTML = html;
    return true;
}

//将对比结果标记到tab页面
function markTabDomTree(opt) {
    console.log("markTabDomTree");
    let tabid = opt.tab.id;
    let data = opt.data;
    return new Promise(function(resolve) {
        chrome.tabs.executeScript(+tabid, {
            code: ` (function(){
                        // debugger;   
                        let data = ${JSON.stringify(data)}; 
                        let a = null;
                        let cflag = null;
                        let items = null;
                        for(let url in data){
                            cflag = data[url].cflag;
                            items = data[url].items;
                            for(let label in items){
                                for(let i=0,len= items[label].length; i<len; i++){
                                    a = document.querySelector("[data-sn='"+items[label][i].dataSN+"']");
                                    if(a){
                                        a.dataset.result = cflag;
                                        a.title = cflag+"; 出现"+len+"次";
                                    }else{
                                        debugger;
                                    }
                                }
                            }  
                        }
                        let style = document.getElementById("style_jingpinfenxi");
                        if(!style){
                            style = document.createElement("style");
                            style.id = "style_jingpinfenxi";
                            style.title="for竞品分析"
                        }
                        style.innerHTML = "a[data-result = 'equal']{background-color:white}" 
                                        + "a[data-result = 'diff-count']{background-color:yellow}"
                                        + "a[data-result = 'diff-label']{background-color:yellow}"
                                        + "a[data-result = 'new']{background-color:rgba(0,255,0,0.5)}";
                        document.head.appendChild(style);          
                })()`
        }, function(datas) {
            resolve(datas);
        });
    })
}
// 标记多个tab页中的数据
function markTabsDomTree(opts) {
    console.log("markTabsDomTree");
    var items = opts.map(function(opt) {
        return markTabDomTree(opt);
    });
    return Promise.all(items);
}

//激活tab页，并高亮显示一些元素
function visitDOMInTab(selector, tabid) {
    console.log("visitDOMInTab");
    chrome.tabs.update(+tabid, {
        highlighted: true
    });
    var animCSS = "@-webkit-keyframes jingpinfenxi_focus_anim {" + "0%{box-shadow: inset 0px 0px 15px 5px red, 0px 0px 15px 5px red;}" + "100%{box-shadow: 0px 0px 0px 0px red, 0px 0px 0px 0px red;}" + "}" + ".jingpinfenxi_focus{-webkit-animation: jingpinfenxi_focus_anim 1s infinite linear;}";
    chrome.tabs.executeScript(+tabid, {
        code: `(function(){
                    debugger;
                    if(!document.getElementById('style_style_jingpinfenxi_focus')){
                        var style = document.createElement("style");
                        style.id = 'style_style_jingpinfenxi_focus';
                        style.innerHTML = "${animCSS}";
                        document.head.appendChild(style);
                    }

                    if(window.lastShowedLinks){
                        for(let i=0, len = lastShowedLinks.length; i<len; i++){
                            lastShowedLinks[i].classList.remove("jingpinfenxi_focus");
                        }
                    }
                    let doms = window.lastShowedLinks = document.querySelectorAll("${selector}");
                    for(let i=0, len = doms.length; i<len; i++){
                        doms[i].classList.add("jingpinfenxi_focus");
                    }
                    doms[0] && doms[0].scrollIntoView();
                    document.body.scrollTop -= 200;
                })();
              `
    }, function(data) {});

}

//进度条
var progress = (function() {
    let max = 10;
    let min = 0;
    let dom = $("#progress");
    dom.max = max;
    dom.value = min;
    return {
        from: function(value = 0) {
            dom.value = +value;
            dom.style.display = "inline-block";
        },
        to: function(value) {
            dom.value = +value;
        },
        grow: function() {
            dom.value++;
        },
        end: function(value = max) {
            this.to(value);
            dom.style.display = "none";
        }
    }
})();

//导出数据 
function exportDataToFile(domid, filename) {
    tableToExcel(domid, filename);
}

//初始化
function init() {
    $("#start").onclick = function() {
        progress.from(0);
        Promise.resolve().then(function() {
            return tabManager.getCheckTabs()
        }).then(function(tabs) {
            console.log("compareTabData");
            if (tabs.length !== 2) {
                alert("请只选择两个tab");
                progress.end();
                return Promise.reject(new Error("请只选择两个tab"));
            }
            let promises = tabs.map(function(tab) {
                return getPageData(tab);
            });

            return Promise.all(promises);
        }).then(function(dataArray) {
            progress.grow();
            return dataCompare(dataArray[0], dataArray[1]);
        }).then(function(res) {
            progress.grow();
            renderResult(res);
            return res;
        }).then(function(res) {
            progress.grow();
            return markTabsDomTree(res);
        }).then(function() {
            progress.end();
        }).catch(function(e) {
            console.log("Error", e);
        });

    }

    $("#result").onclick = function(e) {
        let target = e.target;
        let link = null;
        let section = null;
        if (target.tagName === "BUTTON") {
            let tabid = target.dataset.tabid;
            let selector = `a[data-url='${target.dataset.url}']`;
            visitDOMInTab(selector, tabid);
        }
    }

    chrome.tabs.onCreated.addListener(function(e) {
        tabManager.refreshTabList();
    });
    chrome.tabs.onUpdated.addListener(function(e) {
        tabManager.refreshTabList();
    });
    chrome.tabs.onRemoved.addListener(function(e) {
        tabManager.refreshTabList();
    });
    chrome.tabs.onMoved.addListener(function(e) {
        tabManager.refreshTabList();
    });

    tabManager.refreshTabList();
}

window.onload = function() {
    init();
}