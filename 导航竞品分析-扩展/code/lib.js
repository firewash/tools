var $ = function(selector) {
    return document.querySelector(selector);
}

function charFilter(str) {
    return str.replace(/[<>"'&]/g, "");
}

var tableToExcel = (function() {
    var uri = 'data:application/vnd.ms-excel;base64,',
        template = '<html><head><meta charset="UTF-8"></head><body><table>{table}</table></body></html>',
        base64 = function(s) {
            return window.btoa(unescape(encodeURIComponent(s)))
        },
        format = function(s, c) {
            return s.replace(/{(\w+)}/g,
                function(m, p) {
                    return c[p];
                })
        }
    return function(table, filename, name) {
        if (!table.nodeType) table = document.getElementById(table)
        var ctx = { worksheet: name || 'Worksheet', table: table.innerHTML }
            // window.location.href = uri + base64(format(template, ctx));
        var a = document.createElement('a');
        a.download = filename || '下载.xls';
        a.href = uri + base64(format(template, ctx));
        document.body.appendChild(a);
        a.click();
    }
})();