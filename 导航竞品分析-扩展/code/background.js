const $=function(selector){
    return document.querySelector(selector);
}

// diff: 变化了的
// 比别人多出：+
// 和别人相同：=
// 比别人不同: ~
// 比别人少
function dataCompare(curTab, toTab) {
    let cur = curTab.data;
    let to = toTab.data;
    let url = null;
    for(url in cur) {
        if(!to[url]) {
            cur[url].cflag = 'new';
            cur[url].des = "本页面有，而对方没有";
            continue;
        }
        let toItemsKeys = Object.keys(to[url].items);
        let curItemsKeys = Object.keys(cur[url].items);
        
        if(toItemsKeys.length !== curItemsKeys.length){
            cur[url].cflag = 'diff-count';
            to[url].cflag = 'diff-count';
            cur[url].des = `本页面有${curItemsKeys.length}相同链接，对方有${toItemsKeys.length}相同链接`;
            to[url].des = `本页面有${toItemsKeys.length}相同链接，对方有${curItemsKeys.length}相同链接`;
            continue;
        }
        
        if(toItemsKeys.join(";") === curItemsKeys.join(";")){
            cur[url].cflag = 'equal';
            to[url].cflag = 'equal';
            continue;
        }

        cur[url].cflag = 'diff-label';
        to[url].cflag = 'diff-label'; 
        cur[url].des = cur[url].des = "两个页面的标签内容不同。"
    } 
    for(url in to) {
        if(!to[url].cflag){
            to[url].cflag = 'new';
            to[url].des = "本页面有，而对方没有";
        }        
    } 
    window.forDebugAndWillRemoved = [curTab, toTab];
    return [curTab, toTab];
}

// 获取页面的数据
function getPageData(tabid){
    return new Promise(function(resolve, reject){
        chrome.tabs.executeScript(+tabid, {
           file: "getSiteData.js"
           // code: "[123]"
        }, function(datas){
            progress.grow();
            resolve({
                tabid: tabid,
                data: datas[0]||[]
            });
        });  
    })
}

//比较两个tab的数据
function compareTabData(tabs){
    console.log("compareTabData");
    if(tabs.length !== 2){
        alert("请只选择两个tab");
        return false;
    }
    let promises = tabs.map(function(tabid){
        return getPageData(tabid);
    });

    return Promise.all(promises).then(function(dataArray){
        progress.grow();
        return dataCompare(dataArray[0], dataArray[1]);
    });
}

//根据当前tab打开的情况，更新管理视图
let checkedBase = -1;
let checkedTabArray = [];
function refreshTabList(){
    chrome.tabs.query({},function(tabs){
        let html = `<table><tr>
                        <th>对比(选2个)</th>
                        <th>tab.id</th> <th>tab.title</th> <th>tab.url</th>
                    </tr>`;
        tabs.forEach(function(tab, index){
            if(tab.url.startsWith("http")) {
                html+=`<tr>
                        <td><input type="checkbox" name="checkgroup" value="${tab.id}" /></td>
                        <td>${tab.id}</td> <td>${tab.title}</td> <td>${tab.url}</td>
                    </tr>`;
            }
        });
        $("#tabform").innerHTML = html;
        var boxes = $("#tabform").checkgroup;
        boxes[0] && (boxes[0].checked = true);
        boxes[1] && (boxes[1].checked = true);
        checkedTabArray = tabs;
    });
}

//将比较结果显示出来
function renderResult(result){
    console.log("renderResult");
    let html = "";
    result.forEach(function(siteData){
        html += `<section data-tabid=${siteData.tabid}><h1>${siteData.tabid}</h1><ul>`; 
        let equalHTML = "";
        let diffLabelHTML = "";
        let diffCountHTML = "";
        let otherHTML = "";
        for(let url in siteData.data){
            let link = siteData.data[url];
            let cflag = link.cflag;
            let items = link.items;
            let labels = Object.keys(items);
            let count = labels.length;
            let fragment = `<li class=${cflag} data-url=${url} 
                                title='${JSON.stringify(items)}' > 
                                ${cflag}
                                <span title='出现${count}次'>${count>1?'['+count+']':''}</span>
                                <span class="labels">${labels.join(";")}</span> 
                                <span class='url'>${url}</span>
                                <button title="在tab页中查看">View</button>
                            </li>`;
            switch(cflag){
                case "equal":   equalHTML += fragment; break;
                case "diff-count":    diffCountHTML += fragment; break;
                case "diff-label":    diffLabelHTML += fragment; break;
                case "new":  otherHTML += fragment; break;
                default:        otherHTML += fragment; break;
            }
        }
        html += equalHTML + diffLabelHTML + diffCountHTML + otherHTML + "</ul></section>"; 
    });
    $("#result").innerHTML = html;
}

//将数据标记到tab页面
function markTabDomTree(opt) {
    console.log("markTabDomTree");
    let tabid = opt.tabid;
    let data = opt.data;
    return new Promise(function(resolve){
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
            }, function(datas){
                resolve(datas);
            });
    })   
}
function markTabsDomTree(opts) {
    console.log("markTabsDomTree");
    var items = opts.map(function(opt){
        return markTabDomTree(opt);
    });
    return Promise.all(items);
}

//在tab页中高亮显示一些元素
function visitDOMInTab(selector, tabid){
    console.log("visitDOMInTab");
    chrome.tabs.update(+tabid, {
        highlighted: true
    });
    var animCSS = "@-webkit-keyframes jingpinfenxi_focus_anim {"
            + "0%{box-shadow: inset 0px 0px 15px 5px red, 0px 0px 15px 5px red;}" 
            + "100%{box-shadow: 0px 0px 0px 0px red, 0px 0px 0px 0px red;}"
            + "}"
            + ".jingpinfenxi_focus{-webkit-animation: jingpinfenxi_focus_anim 1s infinite linear;}";
    chrome.tabs.executeScript(+tabid, {
        code:`(function(){
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
    },function(data){});

}

//进度条
var progress = {
    init: function(){
        var p = $("#progress");
        p.max = 10;
        p.value = 0;
        this.dom = p;
    },
    max: 10,
    from:function(value){
        this.dom.value = +value;
        this.dom.style.display = "inline-block";
    },
    to: function(value){
        this.dom.value = +value;
    },
    grow: function(){
        this.dom.value += 1;
    },
    end:function(value){
        value = value || this.max;
        this.to(value);
        this.dom.style.display = "none";
    }
} 
 
//初始化
function init(){
    progress.init();
    $("#start").onclick=function(){
        progress.from(0);
        checkedTabArray = [];
        let checkboxes = tabform.checkgroup.values();
        let item = null;
        while(item = checkboxes.next()){
            if(item.done){
                break;
            }else if(item.value.checked){
                checkedTabArray.push(item.value.value);
            }
        }

        Promise.resolve().then(function(){
            return compareTabData(checkedTabArray);
        }).then(function(res){
            progress.grow();
            renderResult(res);
            return res;
        }).then(function(res){
            progress.grow();
            return markTabsDomTree(res);
        }).then(function(){
            progress.end();
        });
        
    }

    $("#result").onclick=function(e){
        let target = e.target;
        let link = null;
        let section = null;
        if(target.tagName ==="BUTTON"){
            while(true){
                if(target === document.body || target === document.documentElement) break;
                if(link && section) break;
                if(target.tagName === "LI") {
                    link = target;
                } else if(target.tagName === "SECTION") {
                    section = target;
                }
                target = target.parentNode;
            }
            if(link && section) {
                let tabid = section.dataset.tabid;
                let selector = `a[data-url='${link.dataset.url}']`;
                visitDOMInTab(selector, tabid);
            }
        }
    }

    chrome.tabs.onCreated.addListener(function(e){
        refreshTabList();
    });
    chrome.tabs.onUpdated.addListener(function(e){
        refreshTabList();
    });
    chrome.tabs.onRemoved.addListener(function(e){
        refreshTabList();
    });
    chrome.tabs.onMoved.addListener(function(e){
        refreshTabList();
    });

    refreshTabList();
}

window.onload=function(){
    init();
}
