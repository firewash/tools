/**
 * Created by wangle on 2016/7/31.
 *
 * DOM手动分区。通过鼠标勾选，返回勾选的多个区域。
 */

jQuery.fn.extend({
    /**
     *  option {
     *      selectChanged: function(data){},
     *      pos
     *  }
     *
     *
     */
    partition(option) {
        const self = this;
        const list = new Set();  // [x0,y0,w,h,dom]
        // 创建一个鼠标滑块区域
        function createItem(x0, y0, w, h) {
            let item = null;
            if(typeof w === 'undefined' || typeof h === 'undefined'){
                w=0;h=0;
            }
            let dom = $('<div>'),
                lt = $('<span >').appendTo(dom),
                rb = $('<span style="position:absolute;right:0;bottom:0;">').appendTo(dom),
                wh = $('<span style="position:absolute;left:50%;top:50%;">').appendTo(dom),
                pos = [x0, y0, w, h];

            dom.addClass('part');

            dom.mousedown(function (e) {
                e.stopPropagation();
            }).dblclick(function (e) {
                item.removeSelf();
            });

            function start(x, y) {
                pos[0] = x; pos[1] = y;
            }
            function range(w, h) {
                pos[2] = w; pos[3] = h;
            }
            function move(x, y) {
                range(x - pos[0], y - pos[1]);
            }
            function end(x, y) {
                if (typeof x !== 'undefined' && typeof y !== 'undefined') {
                    range(x - pos[0], y - pos[1]);
                }

                if (pos[2] === 0 || pos[3] === 0) {
                    item.removeSelf();
                }
            }

            // 渲染
            function render() {
                dom.css({
                    left: x0,
                    top: y0,
                    width: pos[2],
                    height: pos[3]
                });
                lt.text(`(${pos[0]},${pos[1]})`);
                rb.text(`(${pos[0]+pos[2]},${pos[1]+pos[3]})`);
                wh.text(`(${pos[2]},${pos[3]})`);
            }
            // 移除
            function removeSelf() {
                list.delete(this);
                this._dom.remove();
                stable();
                return this;
            }
            item = {
                _pos: pos,
                _dom: dom,
                render,
                start,
                move,
                end,
                removeSelf
            };
            // 添加
            list.add(item);
            self.append(dom);
            item.render();
            return item;
        }

        // 统一的渲染
        let timer = null;
        function autoRender() {
            function renderAll() {
                // console.log('renderAll,', list.length);
                list.forEach(item => {
                    item.render();
                });
                timer = requestAnimationFrame(renderAll);
            };
            timer = requestAnimationFrame(renderAll);
        }
        function cancelRender() {
            window.cancelAnimationFrame(timer);
        }
        // 当前交互稳定时调用
        function stable() {
            option.selectChanged && option.selectChanged.call(self, getPosData());
        }

        // 获取纯数据
        function getPosData() {
            const t = [];
            list.forEach(item => {
                t.push(item._pos);
            });
            return t;
        }

        // 设置数据
        function setPosData(d) {
            let data = [];
            if (typeof d === 'string') {
                try {
                    data = JSON.parse(d);
                } catch (e) {
                    console.error('setPosData data error,', data);
                    data = [];
                }
            }
            list.forEach(function (item) {
                item[4].removeSelf();
            });
            data.forEach(function (item) {
                createItem(item[0], item[1], item[2], item[3]);
            });

        }

        // 开始
        function init() {
            // 初始化最外层;
            self.addClass('partition');

            // 创建初始数据
            setPosData(option.pos);

            // 事件绑定
            var cur = null;
            self.mousedown(function (e) {
                self.addClass('dragging');
                autoRender();
                var x = e.offsetX, y = e.offsetY;
                cur = createItem(x, y);
                // console.log(e);
            }).mousemove(function (e) {
                if (cur) {
                    var x = e.offsetX, y = e.offsetY;
                    cur.move(x, y);
                }
            });
            $(document).mouseup(function () {
                self.removeClass('dragging');
                cur && cur.end();
                cur = null;
                console.log('list: ', list);
                stable();
                cancelRender();
            });
        }

        init();
        return this;
    }
}
);