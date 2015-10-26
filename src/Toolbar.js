define(function (require) {
    var $ = require('jquery');
    var root = window;
    var doc = document;

    var strReg = {
        whiteSpace: /(^\s+)|(\s+$)/g,
        mailTo: /^(?!mailto:|.+\/|.+#|.+\?)(.*@.*\..+)$/,
        http: /^(?!\w+?:\/\/|mailto:|\/|\.\/|\?|#)(.*)$/
    };

    var colors = [
        'rgb(0, 0, 0)', 'rgb(126, 36, 18)', 'rgb(255, 84, 0)', 'rgb(34, 88, 1)', 'rgb(12, 82, 158)',
        'rgb(51, 51, 51)', 'rgb(182, 27, 82)', 'rgb(244, 113, 31)', 'rgb(59, 188, 30)', 'rgb(35, 163, 211)',
        'rgb(136, 136, 136)', 'rgb(211, 65, 65)', 'rgb(247, 149, 30)', 'rgb(41, 177, 106)', 'rgb(151, 218, 243)',
        'rgb(204, 204, 204)', 'rgb(236, 124, 124)', 'rgb(253, 234, 2)', 'rgb(121, 196, 80)', 'rgb(86, 54, 121)',
        'rgb(255, 255, 255)', 'rgb(255, 204, 204)', 'rgb(217, 239, 127)', 'rgb(195, 246, 73)'
    ];

    /**
     * 工具条构造函数
     *
     * @param {Object} config 配置
     */
    var Toolbar = function (config) {
        var me = this;
        var toolList = config.list;
        var menu = [];
        var inputBar = '';

        // 构建menu
        $(toolList).each(function (index, action) {
            var clazz = 'pen-icon fa fa-' + action;
            var extra = [];

            if (action == 'font') {
                extra.push('<ul class="color-list">');
                $(colors).each(function (index, color) {
                    extra.push('<li class="color" data-color="' + color + '" style="background-color: ' + color + '"></li>');
                });
                extra.push('</ul>');
            }

            menu.push('<i class="' + clazz + '" data-action="' + action + '">' + extra.join('')+ '</i>');
        });

        // 构建输入框
        if ($.inArray(toolList, 'createlink') || $.inArray(toolList, 'insertimage')) {
            inputBar = '<input class="pen-input" placeholder="http://" />';
        }

        // 创建toolbar
        menu = $('<div class="pen-menu"></div>').html(menu.join('')).prop('outerHTML');
        inputBar = $(inputBar).prop('outerHTML');

        me.main = $('<div class="' + config.class + '-toolbar pen-toolbar"></div>').html(menu + inputBar)[0];

        // 绑定事件
        me.bindEvents();

        doc.body.appendChild(me.main);
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
     * @param  {Range} range 范围
     * @param  {number} delay 延迟
     */
    Toolbar.prototype.show = function (delay) {
        var me = this;
        var main = me.main;

        var exec = function () {
            // 显示
            $(main).show();

            // 重定位
            me.rePos(me.editor.getRange());
        };

        if (delay) {
            setTimeout(exec, delay);
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
    Toolbar.prototype.rePos = function (range) {
        var me = this;
        var main = me.main;

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

        $(root).on('resize,scroll', function() {
            !$(main).is(':hidden') && me.rePos();
        });

        // 选择toolbar上的选项
        $(main).on('click', function (e) {
            var icon = $(e.target).closest('.pen-icon');
            var action = icon.data('action');

            // 修改字体 color | size |
            if (action == 'font') {
                if ($(e.target).hasClass('color')) {
                    me.editor.execCommand(action, {
                        type: 'color',
                        value: $(e.target).data('color')
                    });                    
                }

                return;
            }

            if (!action) {
                return;
            }

            if (!/(?:createlink)|(?:insertimage)/.test(action)) {
                me.editor.execCommand(action);
                return;
            }
        });
    };

    /**
     * 高亮menu
     *
     * @return {Pen} this
     */
    Toolbar.prototype.highlight = function() {
        var me = this;
        var toolbar = me.toolbar;
        var node = me.getNode();

        // 先把所有按钮清除高粱
        $('.active', toolbar).removeClass('active');

        if (!node) {
            return me;
        }

        var effects = me.effectNode(node);
        var inputBar = me._inputBar;

        if (inputBar && toolbar === me.menu) {

            // display link input if createlink enabled
            inputBar.style.display = 'none';

            // reset link input value
            inputBar.value = '';
        }

        $(effects, function(index, item) {
            var tag = item.nodeName.toLowerCase();

            switch(tag) {
                case 'a':
                    if (inputBar) {
                        inputBar.value = item.getAttribute('href');
                    }
                    tag = 'createlink';
                    break;
                case 'img':
                    if (inputBar) {
                        inputBar.value = item.getAttribute('src');
                    }
                    tag = 'insertimage';
                    break;
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
            $(toolbar).find('[data-action=' + tag + ']').addClass('active');
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