define(function (require) {
    var $ = require('jquery');
    var Selection = require('./Selection');

    var root = window;
    var doc = document;
    var timer = null;
    var colors = [
        'rgb(0, 0, 0)', 'rgb(126, 36, 18)', 'rgb(255, 84, 0)', 'rgb(34, 88, 1)', 'rgb(12, 82, 158)',
        'rgb(51, 51, 51)', 'rgb(182, 27, 82)', 'rgb(244, 113, 31)', 'rgb(59, 188, 30)', 'rgb(35, 163, 211)',
        'rgb(136, 136, 136)', 'rgb(211, 65, 65)', 'rgb(247, 149, 30)', 'rgb(41, 177, 106)', 'rgb(151, 218, 243)',
        'rgb(204, 204, 204)', 'rgb(236, 124, 124)', 'rgb(253, 234, 2)', 'rgb(121, 196, 80)', 'rgb(86, 54, 121)',
        'rgb(255, 255, 255)', 'rgb(255, 204, 204)', 'rgb(217, 239, 127)', 'rgb(195, 246, 73)'
    ];

    var sizes = ['96px', '64px', '48px', '32px', '24px', '20px', '18px', '16px', '14px', '13px', '12px'];

    var icons = {
        'size': 'text-height'
    };


    /**
     * 工具条构造函数
     *
     * @param {Object} config 配置
     */
    var Toolbar = function (config) {
        var me = this;
        var list = config.list;

        me.main = me.build(list, config);

        // 绑定事件
        me.bindEvents();
    };


    /**
     * 构建toolbar
     *
     * @param  {Array}      list    工具列表
     * @return {HTML Element}            元素
     */
    Toolbar.prototype.build = function (list, config) {

        /**
         * 构建下拉列表
         *
         * @param  {Array}  list    数据
         * @param  {string} dataKey data key
         * @param  {string} cssKey  css属性名
         * @param  {bool}   isShow  是否显示
         * @return {string}         构建完成的下拉列表html string
         */
        var buildDropDownList = function (list, dataKey, cssKey, isShow) {
            var dropDownList = [];

            dropDownList.push('<div class="popup">');
            dropDownList.push('<ul class="dropdown-list">');

            $(list).each(function (index, item) {

                dropDownList.push(''
                    +   '<li class="dropdown-list-item" '
                    +       'data-' + dataKey + '="' + item + '" '
                    +       'data-type="' + dataKey + '" '
                    +       (cssKey ? ('style="' + cssKey + ': ' + item + '"') : '')
                    +   '>'
                    +       (isShow ? item : '')
                    +   '</li>'
                );
            });

            dropDownList.push('</ul>');

            if (dataKey == 'color') {
                dropDownList.push(''
                    + '<div class="color-input" '
                    +     'data-' + dataKey + '="' + 'input' + '" '
                    +     'data-type="' + dataKey + '" '
                    + '>'
                    +   '<input class="mini-color-input"/>'
                    +   '<button class="mini-color-assure">确定</button>'
                    + '</div>'
                );
            }
            dropDownList.push('</div>');

            return dropDownList.join('');
        };

        var menu = ['<div class="mini-pen-menu">'];

        // 构建menu
        $(list).each(function (index, action) {
            var dropDownList = '';
            var fontAction = '';

            // 文字有关的 需要下拉框
            if (/^font-(.*)/.test(action)) {
                fontAction = RegExp.$1;

                if (fontAction == 'color') {
                    dropDownList = buildDropDownList(colors, 'color', 'background-color');
                }
                else if (fontAction == 'size') {
                    dropDownList = buildDropDownList(sizes, 'size', false, true);
                }
                else if (fontAction == 'bg-color') {
                    dropDownList = buildDropDownList(colors, 'color', 'background-color');
                }
            }

            var clazz = 'mini-pen-icon fa fa-' + ((fontAction && ('font ' + 'fa-' + (icons[fontAction] || fontAction))) || action);

            menu.push(''
                + '<div class="mini-pen-menu-btn">'
                +     '<i class="' + clazz + '" data-action="' + action + '">'
                +           dropDownList
                +     '</i>'
                + '</div>'
            );
        });

        menu.push('</div>');

        // var inputBar = '';

        // // 构建输入框
        // if ($.inArray(list, 'createlink') || $.inArray(list, 'insertimage')) {
        //     inputBar = '<input class="mini-pen-input" placeholder="http://" />';
        // }
        //

        var toolbar = $(''
            + '<div class="' + config.class + '-toolbar mini-pen-toolbar">'
            +   menu.join('')
            // +   inputBar
            + '</div>'
        )[0];

        doc.body.appendChild(toolbar);
        // 创建toolbar
        return toolbar;
    };

    /**
     * 植入Editor
     *
     * @param  {Object} editor 编辑器
     */
    Toolbar.prototype.use = function (editor) {
        this.editor = editor;
    };

    /**
     * 显示工具条
     *
     * @param  {Range}  range 范围
     * @param  {number} delay 延迟
     */
    Toolbar.prototype.show = function (delay) {
        var me = this;
        var main = me.main;

        clearTimeout(timer);

        var exec = function () {
            me.editor.range = me.editor.getRange();

            // 显示
            $(main).show();

            // 重定位
            me.rePos();

            me.highlight();
        };

        if (delay) {
            timer = setTimeout(exec, delay);
        }
        else {
            exec();
        }
    };

    /**
     * 隐藏工具条
     */
    Toolbar.prototype.hide = function () {
        var me = this;
        var main = me.main;
        $(main).hide();
    };

    /**
     * 重新定位
     *
     * @param  {Range} range 范围
     */
    Toolbar.prototype.rePos = function () {
        var me = this;
        var main = me.main;
        var editor = me.editor;
        var range = editor.range;

        var offset = range.getBoundingClientRect();
        var toolbarPadding = 10;
        var top = offset.top - toolbarPadding;
        var left = offset.left + (offset.width / 2);

        $(main)
        .css({
            top: top - main.clientHeight,
            left: left - (main.clientWidth / 2)
        });
    };

    /**
     * 绑定事件
     */
    Toolbar.prototype.bindEvents = function () {
        var me = this;
        var main = me.main;

        $(root).on('resize scroll', function() {
            !$(main).is(':hidden') && me.rePos();
        });

        // 暂存的选区
        var savedSel = null;

        var mousedown = function (e) {

            var icon = $(e.target).closest('.mini-pen-icon');
            var action = icon.data('action');

            if (!action) {
                return;
            }

            savedSel = Selection.saveSelection();
            e.stopPropagation();

            return;
        };

        // 鼠标按下toolbar上图标的时候记录当前选区
        $(main).on('mousedown', mousedown);
        $('input', main).on('mousedown', mousedown);

        /**
         * 任务处理函数
         *
         * @param  {string} action    行为
         * @param  {string} type      类型
         * @param  {string} typeValue 类型值
         */
        var taskHandler = function (action, type, typeValue) {

            if (!savedSel) {
                return false;
            }
            
            Selection.restoreSelection(savedSel);

            // 修改字体 color | size |
            if (/^font-(.*)/.test(action)) {

                if (type) {

                    me.editor.execCommand(
                        action,
                        {
                            type: type,
                            value: typeValue
                        }
                    );
                }
            }
            else {
                me.editor.execCommand(action, '');
                me.show();
            }

            Selection.restoreSelection(savedSel);
            savedSel = null;
        };

        var mouseup = function (e) {
            var icon = $(e.target).closest('.mini-pen-icon');

            var target = $(e.target);
            var action = icon.data('action');

            if (!action) {
                return;
            }

            var type = target.data('type');
            var typeValue = target.data(type);

            taskHandler(action, type, typeValue);

            e.stopPropagation();
            return false;
        };

        // 鼠标抬起toolbar上图标的时候执行操作并还原当前选区
        $(main).on('mouseup', mouseup);

        $('button,input', main).on('mouseup mousedown click', function (e) {
            e.stopPropagation();
        });


        $('button', main).on('click', function (e) {
            var icon = $(e.target).closest('.mini-pen-icon');

            var target = $(e.target).closest('.color-input');
            var action = icon.data('action');
            if (!action) {
                return;
            }

            var type = target.data('type');

            taskHandler(action, type, $('input', target).val());
        });
    };

    /**
     * 高亮menu
     *
     * @return {Pen} this
     */
    Toolbar.prototype.highlight = function() {
        var me = this;
        var main = me.main;
        var editor = me.editor;
        var node = editor.getNode();

        // 先把所有按钮清除高粱
        $('.active', main).removeClass('active');

        if (!node) {
            return me;
        }

        var effects = editor.effectNode(node);

        $(effects).each(function(index, item) {
            var tag = item.nodeName.toLowerCase();

            switch(tag) {
                case 'i':
                    tag = 'italic';
                    break;
                case 'u':
                    tag = 'underline';
                    break;
                case 'strike':
                    tag = 'strikethrough';
                    break;
                case 'b':
                    tag = 'bold';
                    break;
                case 'pre':
                case 'code':
                    tag = 'code';
                    break;
                case 'ul':
                    tag = 'insertunorderedlist';
                    break;
                case 'ol':
                    tag = 'insertorderedlist';
                    break;
                case 'li':
                    tag = 'indent';
                    break;
            }

            if (!tag) {
                return;
            }

            // 高亮按钮
            $(main).find('[data-action=' + tag + ']').addClass('active');
        });
    };

    /**
     * 销毁toolbar
     */
    Toolbar.prototype.destroy = function () {
        var me = this;
        var main = me.main;

        // 解除所有事件绑定
        $(main).off();

        // 删除dom元素
        $(main).remove();

    };

    return Toolbar;
});
