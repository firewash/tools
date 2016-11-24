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
    return function(table, fileName = '下载', worksheetName = 'sheet1') {
        if (!table.nodeType) table = document.getElementById(table)
            //var ctx = { worksheet: name || 'Worksheet', table: table.innerHTML };
            //var content = uri + base64(format(template, ctx));
            //return window.location.href = content;
        var content = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
                            <head>
                            <!--[if gte mso 9]>
                            <xml>
                                <x:ExcelWorkbook>
                                    <x:ExcelWorksheets>
                                        <x:ExcelWorksheet>
                                            <x:Name>${worksheetName}</x:Name>
                                            <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
                                        </x:ExcelWorksheet>
                                    </x:ExcelWorksheets>
                                </x:ExcelWorkbook>
                            </xml>
                            <![endif]-->
                            </head>
                            <body>
                                <table>${table.innerHTML}</table>
                            </body></html>`;
        content = `data:application/vnd.ms-excel;base64,${base64(content)}`;
        var a = document.createElement('a');
        a.download = `${fileName}.xls`;
        a.href = content;
        document.body.appendChild(a);
        a.click();
    }
})();