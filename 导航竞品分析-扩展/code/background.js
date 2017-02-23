﻿'use strict';

// 数据对比
// 比别人多出：+
// 和别人相同：=
// 比别人不同: ~
// 比别人少
function dataCompare(curTab, toTab) {
    let curData = curTab.data;
    let toData = toTab.data;
    for(let cat in curData){
        let curCat = curData[cat] || {};
        let toCat = toData[cat] || {};
        let url = null;
        for (url in curCat) {
            if (!toCat[url]) {
                curCat[url].cflag = 'new';
                curCat[url].des = "本页面有，而对方没有";
                continue;
            }
            let toItemsKeys = Object.keys(toCat[url].items);
            let curItemsKeys = Object.keys(curCat[url].items);

            if (toItemsKeys.length !== curItemsKeys.length) {
                curCat[url].cflag = 'diff-count';
                toCat[url].cflag = 'diff-count';
                curCat[url].des = `本页面有${curItemsKeys.length}相同链接，对方有${toItemsKeys.length}相同链接`;
                toCat[url].des = `本页面有${toItemsKeys.length}相同链接，对方有${curItemsKeys.length}相同链接`;
                continue;
            }

            if (toItemsKeys.join(";") === curItemsKeys.join(";")) {
                curCat[url].cflag = 'equal';
                toCat[url].cflag = 'equal';
                continue;
            }

            curCat[url].cflag = 'diff-label';
            toCat[url].cflag = 'diff-label';
            curCat[url].des = curCat[url].des = "两个页面的标签内容不同。"
        }
        for (url in toCat) {
            if (!toCat[url].cflag) {
                toCat[url].cflag = 'new';
                toCat[url].des = "本页面有，而对方没有";
            }
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
        chrome.tabs.query({
            url: ['http://*/*', 'https://*/*'],
            currentWindow: true
        }, function(tabs) {
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
        tableToExcel({
            tables:"#result table",
            filename:filename
        });
    }
    
    worker.postAndListen('calResultTableHTML', sitesArr, function(data){
        $("#result").innerHTML = "";
        for(let cat in data){
            $("#result").innerHTML += "<div><h2>"+cat+"</h2><div>"+data[cat]+"</div></div>"
        }

    });

    return true;
}

//将对比结果标记到tab页面
function markTabDomTree(opt) {
    console.log("markTabDomTree");
    let tabid = opt.tab.id;
    let data = opt.data;
    return new Promise(function(resolve) {
        chrome.tabs.insertCSS(+tabid, {
            code: ` a[data-result = 'equal']{background-color:white} 
                    a[data-result = 'diff-count']{background-color:yellow}
                    a[data-result = 'diff-label']{background-color:yellow}
                    a[data-result = 'new']{background-color:rgba(0,255,0,0.5)}`
        });
        chrome.tabs.executeScript(+tabid, {
            code: ` (function() {
                        console.log("将对比结果标记到tab页面");
                        let datas = ${JSON.stringify(data)};
                        let data = null;
                        let a = null;
                        let cflag = null;
                        let items = null;
                        let url = "";
                        let cat = null;
                        let label = "";
                        let i = 0;
                        for(cat in datas){
                            data = datas[cat];
                            for (url in data) {
                                cflag = data[url].cflag;
                                items = data[url].items;
                                for (label in items) {
                                    for (i = 0, len = items[label].length; i < len; i++) {
                                        a = document.querySelector("[data-sn='" + items[label][i].dataSN + "']");
                                        if (a) {
                                            a.dataset.result = cflag;
                                            a.title = cflag + "; 出现" + len + "次";
                                        } else {
                                            debugger;
                                        }
                                    }
                                }
                            }
                        }
                    })()`
        }, function(datas) {
            resolve(datas);
        });
    });
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
        code: ` (function() {
                    debugger;
                    if (!document.getElementById('style_style_jingpinfenxi_focus')) {
                        var style = document.createElement("style");
                        style.id = 'style_style_jingpinfenxi_focus';
                        style.innerHTML = "${animCSS}";
                        document.head.appendChild(style);
                    }

                    if (window.lastShowedLinks) {
                        for (let i = 0, len = lastShowedLinks.length; i < len; i++) {
                            lastShowedLinks[i].classList.remove("jingpinfenxi_focus");
                        }
                    }
                    let doms = window.lastShowedLinks = document.querySelectorAll("${selector}");
                    for (let i = 0, len = doms.length; i < len; i++) {
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

//字符串计算等繁重任务
var worker = (function(){
    var w = new Worker("worker.js");
    w.addEventListener('message', function(event) {
        console.log('worker message: ', event.data.type, event.data.value);
        listeners[event.data.type](event.data.value);
    }, false);
    var listeners = {};
    var addOnceTypeListener = function(type, fn){
        var once = function(){
            fn.apply(window, arguments);
            delete listeners[type];
        }
        listeners[type] = once;
    }
    var postAndListen = function(type, data, response){
        w.postMessage({
            type: type,
            value: data
        });
        addOnceTypeListener(type, response);
    };
    return {
        postAndListen
    }
      
})();

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
            let selector = `a[data-url = '${target.dataset.url}']`;
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