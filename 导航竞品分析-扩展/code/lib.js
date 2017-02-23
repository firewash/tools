'use strict';

function $(selector) {
    return document.querySelector(selector);
}

function charFilter(str) {
    return str.replace(/[<>"'&]/g, "");
}

var tableToExcel = (function() {
    // var uri = 'data:application/vnd.ms-excel;base64,',
    //     template = '<html><head><meta charset="UTF-8"></head><body><table>{table}</table></body></html>',
    //     base64 = function(s) {
    //         return window.btoa(unescape(encodeURIComponent(s)))
    //     },
    //     format = function(s, c) {
    //         return s.replace(/{(\w+)}/g,
    //             function(m, p) {
    //                 return c[p];
    //             })
    //     }
    var base64 = function(s) {
        return window.btoa(unescape(encodeURIComponent(s)))
    };
    return function(options) {
        var tables = options.tables;
        var fileName = options.filename ||'下载';
        var defalutWorksheetName = 'sheet1';
        if(typeof tables === "string") {
            tables = document.querySelectorAll(tables);
        }
        var headContent = "";
        var bodyContent = "";
        for(var i=0;i<tables.length;i++) {
            var table = tables[i];
            //headContent += `<x:ExcelWorksheet>
            //                    <x:Name>${table.getAttribute('sheetname') || defalutWorksheetName}</x:Name>
            //                </x:ExcelWorksheet>`; // 搞不定多个sheet页的场景（多个sheet页只能多几个html来对应， 但是无法放到一个html上）
            headContent += table.getAttribute('sheetname') + ",";
            bodyContent += `<table>${table.innerHTML}</table>`;
        }

        var content = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
                            <head>
                            <!--[if gte mso 9]>
                            <xml>
                                <x:ExcelWorkbook>
                                    <x:ExcelWorksheets>
                                        <x:ExcelWorksheet>
                                            <x:Name>${headContent}</x:Name>
                                        </x:ExcelWorksheet>
                                    </x:ExcelWorksheets>
                                </x:ExcelWorkbook>
                            </xml>
                            <![endif]-->
                            </head>
                            <body>
                                ${bodyContent}
                            </body>
                         </html>`;
        content = `data:application/vnd.ms-excel;base64,${base64(content)}`;
        var a = document.createElement('a');
        a.download = `${fileName}.xls`;
        a.href = content;
        document.body.appendChild(a);
        a.click();
    }
})();