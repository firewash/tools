/**
 * Created by wangle on 2016/7/31.
 */

// DOM手动分区。通过鼠标勾选，返回勾选的多个区域。
jQuery.fn.extend(
    {
    /**
     *  option {
     *      selectChanged: function(data){},
     *      pos
     *  }
     *
     *
     */

    partition: function(option){
            var self =  this;
            var list = new Set();  // [x0,y0,x1,y1,dom]
            // 创建一个鼠标滑块区域
            var createItem = function(x0, y0, x1, y1) {
                var item = null;
                var dom = $('<div>'),
                    lt = $('<span >').appendTo(dom),
                    rb = $('<span style="position:absolute;right:0;bottom:0;">').appendTo(dom),
                    pos = [x0, y0, x1, y1];

                dom.addClass('part');

                dom.mousedown(function(e) {
                    e.stopPropagation();
                }).dblclick(function(e) {
                    item.removeSelf();
                });

                var start = function (x, y) {
                    pos[0] = x, pos[1] = y;
                };
                var end = function(x, y) {
                    pos[2] = x, pos[3] = y;
                };

                // 渲染
                var render = function() {
                    dom.css({
                        left: x0,
                        top: y0,
                        width: pos[2] - pos[0],
                        height: pos[3] - pos[1]
                    });
                    lt.text('(' + pos[0] + ',' + pos[1] + ')');
                    rb.text('(' + pos[2] + ',' + pos[3] + ')');
                };
                // 移除
                var removeSelf = function() {
                    list.delete(this);
                    this._dom.remove();
                    stable();
                    return this;
                };
                item = {
                    _pos: pos,
                    _dom: dom,
                    render: render,
                    start: start,
                    end: end,
                    removeSelf: removeSelf
                };
                // 添加
                list.add(item);
                self.append(dom);
                item.render();
                return item;
            };

            // 统一的渲染
            var timer = null;
            var autoRender = function() {
                var renderAll = function() {
                    console.log('renderAll,', list.length);
                    list.forEach(function(item) {
                        item.render();
                    });
                    timer = requestAnimationFrame(renderAll);
                };
                timer = requestAnimationFrame(renderAll);
            };
            var cancelRender = function() {
                window.cancelAnimationFrame(timer);
            };
            // 当前交互稳定时调用
            function stable(){
                option.selectChanged && option.selectChanged.call(self, getPosData());
            }

            // 获取纯数据
             function getPosData(){
                var t = [];
                list.forEach(function(item) {
                    t.push(item._pos);
                });
                return t;
            }

            //设置数据
            function setPosData(data){
                if(typeof data === 'string'){
                    try{
                        data = JSON.parse(data);
                    }catch(e){
                        console.error('setPosData data error,', data);
                        data = [];
                    }
                }
                list.forEach(function(item){
                    item[4].removeSelf();
                });
                data.forEach(function(item){
                    createItem(item[0],item[1],item[2],item[3]);
                });

            }

            // 开始
            function init(){
                // 初始化最外层;
                self.addClass('partition');

                // 创建初始数据
                setPosData(option.pos);

                //事件绑定
                var cur = null;
                self.mousedown(function(e) {
                    self.addClass('dragging');
                    autoRender();
                    var x = e.offsetX, y = e.offsetY;
                    cur = createItem(x, y, x, y);
                    // console.log(e);
                }).mousemove(function(e) {
                    if(cur) {
                        var x = e.offsetX, y = e.offsetY;
                        cur.end(x, y);
                    }
                });
                $(document).mouseup(function() {
                    self.removeClass('dragging');
                    cur = null;
                    console.log('list: ', list);
                    stable();
                    cancelRender();
                });
            }
            init();

        }
    }
);