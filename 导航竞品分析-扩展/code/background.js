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
    let key = null;
    for(key in cur) {
        switch(true) {
            case !to[key]:
                cur[key].cflag = 'larger';                
                break;
            case to[key].label === cur[key].label && to[key].href == cur[key].href:
                cur[key].cflag = 'equal';
                to[key].cflag = 'equal';
                break;
            default:
                cur[key].cflag = 'diff';
                to[key].cflag = 'diff';                
        } 
    } 
    for(key in to) {
        if(!to[key].cflag){
            to[key].cflag = 'larger';
        }        
    } 
    return [curTab, toTab];
}

// 获取页面的数据
function getPageData(tabid){
    return new Promise(function(resolve, reject){
        chrome.tabs.executeScript(+tabid, {
           file: "getSiteData.js"
           // code: "[123]"
        }, function(datas){
            resolve({
                tabid: tabid,
                data: datas[0]||[]
            });
        });  
    })
}

//比较两个tab的数据
function compareTabData(tabs){
    if(tabs.length !== 2){
        alert("请只选择两个tab");
        return false;
    }
    let promises = tabs.map(function(tabid){
        return getPageData(tabid);
    });

    return Promise.all(promises).then(function(dataArray){
        return dataCompare(dataArray[0], dataArray[1]);
    });
}

//根据当前tab打开的情况，更新管理视图
let checkedBase = -1;
let checkedTabArray = [];
function refreshTabList(){
    chrome.tabs.query({},function(tabs){
        let html = `<table><tr>
                        <th>基准</th>
                        <th>对比</th>
                        <th>tab.id</th> <th>tab.title</th> <th>tab.url</th>
                    </tr>`;
        tabs.forEach(function(tab, index){
            if(tab.url.startsWith("http")) {
                html+=`<tr>
                        <td><input type="radio" name="checkbase" value="${tab.id}" /></td>
                        <td><input type="checkbox" name="checkgroup" value="${tab.id}" /></td>
                        <td>${tab.id}</td> <td>${tab.title}</td> <td>${tab.url}</td>
                    </tr>`;
            }
        });
        $("#tabform").innerHTML = html;
        var defaultRadio = $("#tabform").checkbase[0];
        defaultRadio && (defaultRadio.checked = true);
        checkedTabArray = tabs;
    });
}

//将比较结果显示出来
function renderResult(result){
    var html = "";
    result.forEach(function(siteData){
        html += `<section><h1>${siteData.tabid}</h1><ul>`; 
        var equalHTML = "";
        var diffHTML = "";
        var otherHTML = "";
        for(var key in siteData.data){
            var link = siteData.data[key];
            var fragment = `<li class=${link.cflag}> ${link.cflag} ${link.label} <span title="${link.originHref}">${link.href}</span></li>`;
            switch(link.cflag){
                case "equal":   equalHTML += fragment; break;
                case "diff":    diffHTML += fragment; break;
                case "larger":  otherHTML += fragment; break;
                default:        otherHTML += fragment; break;
            }
        }
        html += equalHTML + diffHTML + otherHTML + "</ul></section>"; 
    });
    $("#result").innerHTML = html;
}

//将数据标记到tab页面
function markTabDomTree(opt) {
    let tabid = opt.tabid;
    let data = opt.data;
    chrome.tabs.executeScript(+tabid, {
        code: ` (function(){
                debugger;   
                let data = ${JSON.stringify(data)}; 
                for(let key in data){
                    document.querySelector("[data-sn='"+data[key].dataSN+"']").dataset.result = data[key].cflag;
                }
                var style = document.getElementById("style_jingpinfenxi");
                if(!style){
                    style = document.createElement("style");
                    style.id = "style_jingpinfenxi";
                    style.title="for竞品分析"
                }
                style.innerHTML = "a[data-result = 'equal']{background-color:white}" 
                                + "a[data-result = 'diff']{background-color:yellow}"
                                + "a[data-result = 'larger']{background-color:rgba(0,255,0,0.5)}";
                document.head.appendChild(style);          
        })()`
    }, function(datas){
        
    });
}
function markTabsDomTree(opts) {
    opts.forEach(function(opt){
        markTabDomTree(opt);
    })
}
 
//初始化
function init(){
    $("#start").onclick=function(){
        checkedBase = tabform.checkbase.value;
        checkedTabArray = [checkedBase];
        let checkboxes = tabform.checkgroup.values();
        var item = null;
        while(item = checkboxes.next()){
            if(item.done){
                break;
            }else if(item.value.checked && item.value.value !== checkedBase){
                checkedTabArray.push(item.value.value);
            }
        }

        compareTabData(checkedTabArray).then(function(result){
            renderResult(result);
            markTabsDomTree(result);
        });
        
    }

    chrome.browserAction.onClicked.addListener(function(tab) {
        window.open("background.html");
    });

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
