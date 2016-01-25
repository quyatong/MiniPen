define(function (require) {
    var $ = require('jquery');
    var commands = require('./commands');
    var doc = document;
    var selection = doc.getSelection();

    var commandsReg = commands.commandsReg;

    var lineBreakReg = /^(?:blockquote|pre|div)$/i;

    var effectNodeReg = /(?:[pubia]|h[1-6]|blockquote|[uo]l|li)/i;

    var saveSelection = function() {
         var ranges = [];
         if (selection.rangeCount) {
             for (var i = 0, len = selection.rangeCount; i < len; ++i) {
                 ranges.push(selection.getRangeAt(i));
             }
         }
         return ranges;
     };

     var restoreSelection = function(savedSelection) {
         selection.removeAllRanges();
         for (var i = 0, len = savedSelection.length; i < len; ++i) {
             selection.addRange(savedSelection[i]);
         }
     };

    /**
     * 编辑器构造函数
     *
     * @param {object} config  配置
     * @param {object} toolbar 工具条
     */
    var Editor = function (config) {
        var me = this;

        me.config = config;

        me.main = config.editor;

        // 设置editor class和可编辑属性
        $(me.main)
            .addClass(config.class)
            .attr('contenteditable', 'true');

        !$(me.main).html() && me.lineBreak();

        // 绑定事件
        me.bindEvents();

        // 保存当前内容
        me.prevContent = me.getContent();
    };

    /**
     * 植入toolbar
     *
     * @param  {Object} toolbar 工具条
     */
    Editor.prototype.use = function (toolbar) {
        this.toolbar = toolbar;
    };

    /**
     * 绑定事件
     */
    Editor.prototype.bindEvents = function () {
        var me = this;
        var main = me.main;

        /**
         * 在外边点击
         *
         * @param  {Event} e  事件对象
         */
        var outsideClick = function (e) {
            if (
                me.toolbar
                && !$(e.target).closest(main).length
                && !$(e.target).closest(me.toolbar.main).length
            ) {
                $(doc).off('click', outsideClick);
                me.toolbar.show(100);
            }
        };

        // 维护状态
        var selecting = false;

        // 鼠标事件
        $(main)
        // 鼠标按下的时候
        .on('mousedown', function () {
            selecting = true;
        })
        // 鼠标离开编辑器
        .on('mouseleave', function () {

            if (selecting) {
                me.toolbar.show(800);
            }

            selecting = false;
        })
        // 鼠标松开的时候
        .on('mouseup', function () {

            if (selecting) {
                me.toolbar.show(50);
            }

            selecting = false;
        });

        // 键盘事件
        $(main)
        // 编辑器键盘提起事件
        .on('keyup', function (e) {

            // 退格的时候
            if (e.which === 8 && me.isEmpty()) {
                me.lineBreak(true);
            }

            // toggle toolbar on key select
            if (e.which !== 13 || e.shiftKey) {
                me.toolbar.show(400);
            }
        })
        // 编辑器键盘按键事件
        .on('keydown', function (e) {

            if (e.which !== 13 || e.shiftKey) {
                return;
            }

            var node = me.getNode();
            if (!node || !lineBreakReg.test(node.nodeName)) {
                return;
            }

            var lastChild = node.lastChild;
            if (!lastChild || !lastChild.previousSibling) {
                return;
            }

            if (lastChild.previousSibling.textContent || lastChild.textContent) {
                return;
            }

            // 插入新行
            var line = $('<div style="display: block"><br /></div>')[0];

            if (!node.nextSibling) {
                node.parentNode.appendChild(line);
            }
            else {
                node.parentNode.insertBefore(line, node.nextSibling);
            }

            me.focusNode(line.firstChild, me.getRange());

            e.preventDefault();
        });

        // 焦点事件
        $(main)
        // 监听editor失去焦点事件
        .on('blur', function() {
            me.checkContentChange();
        });

    };

    /**
     * 选择全部
     *
     * @param  {Element} target 事件触发元素
     */
    Editor.prototype.selectAll = function (target) {
        var me = this;
        var oRange = doc.createRange();
        oRange.selectNode(target.firstChild);
        me.setRange(oRange);
        me.toolbar.show();
    };

    /**
     * 生效节点
     *
     * @param  {Element} ele                节点
     * @param  {bool}    returnAsNodeName   是否返回节点名称
     * @return {Array}                      结果数组
     */
    Editor.prototype.effectNode = function (ele, returnAsNodeName) {
        var me = this;
        var nodes = [];

        ele = ele || me.main;

        while (ele && ele !== me.main) {
            if (ele.nodeName.match(effectNodeReg)) {
                nodes.push(returnAsNodeName ? ele.nodeName.toLowerCase() : ele);
            }
            ele = ele.parentNode;
        }

        return nodes;
    };

    /**
     * 获取当前节点
     *
     * @param  {Boolean} origin 使用原始的节点
     */
    Editor.prototype.getNode = function (origin) {
        var me = this;
        var node;
        var main = me.main;
        me.range = me.range || me.getRange();

        node = me.range.commonAncestorContainer;

        if (origin) {
            return node;
        }

        if (!node || node === main) {
            return null;
        }

        while (node && (node.nodeType !== 1) && (node.parentNode !== main)) {
            node = node.parentNode;
        }

        return $(node).closest(main).length ? node : null;
    };

    /**
     * 判断内容改变 如果改变触发change事件
     */
    Editor.prototype.checkContentChange = function () {
        var me = this;
        var prevContent = me.prevContent;
        var currentContent = me.getContent();

        if (prevContent === currentContent) {
            return;
        }

        me.prevContent = currentContent;
        me.config.onChange && me.config.onChange(currentContent, prevContent);
    };

    /**
     * 获取range
     *
     * @return {Range} range
     */
    Editor.prototype.getRange = function () {
        var me = this;
        var main = me.main;
        var range = selection.rangeCount && selection.getRangeAt(0);

        if (!range) {
            range = doc.createRange();
        }

        // 如果选择项包含元素不是editor
        if (!$(range.commonAncestorContainer).closest(main).length) {
            range.selectNodeContents(main);
            range.collapse(false);
        }

        return range;
    };

    /**
     * 设置范围
     *
     * @param  {Range}  range 范围
     */
    Editor.prototype.setRange = function(range) {
        var me = this;
        range = range || me.range;

        if (!range) {
            range = this.getRange();
            range.collapse(false);
        }

        selection.removeAllRanges();
        selection.addRange(range);
    };

    /**
     * 执行命令
     *
     * @param  {Object} action    事件
     * @param  {string} options   参数
     */
    Editor.prototype.execCommand = function (action, options) {
        var me = this;
        action = action.toLowerCase();

        // inline
        // bold | italic | underline | strikethrough
        // insertorderedlist | insertunorderedlist | indent | outdent
        if (
            commandsReg.inline.test(action)
            || commandsReg.source.test(action)
        ) {
            commands.commandOverall(action);
        }
        // font
        // size | fore-color | back-color
        else if (commandsReg.font.test(action)) {
            var savedSel = saveSelection();
            commands.commandFont(action, options);
            restoreSelection(savedSel);
        }
        // text-align left | center | right
        else if (commandsReg.align.test(action)) {
            var ele = me.getNode();
            commands.commandAlign(action, ele);
        }
        else if (commandsReg.block.test(action)) {
            commands.commandBlock(action);
        }
        else if (commandsReg.insert.test(action)) {
            commands.commandInsert(action);
        }
        else if (commandsReg.wrap.test(action)) {
            commands.commandWrap(action);
        }

    };

    /**
     * 换行
     *
     * @param  {bool} empty 是否为空
     */
    Editor.prototype.lineBreak = function (empty) {
        var me = this;
        var main = me.main;
        var range = me.getRange();
        var node = $('<div style="display: block"><br /></div>')[0];

        if (empty) {
            $(main).html('');
        }

        range.insertNode(node);
        me.focusNode(node.firstChild || node, range);
    };

    /**
     * 获取焦点
     *
     * @param  {string} node  节点
     * @param  {Range}  range 范围
     */
    Editor.prototype.focusNode = function (node, range) {
        var me = this;
        setTimeout(function () {
            range.setStartAfter(node);
            range.setEndBefore(node);
            range.collapse(false);
            me.setRange(range);
        }, 0);

    };

    /**
     * 判断是否为空节点
     *
     * @return {Boolean} 是否为空节点
     */
    Editor.prototype.isEmpty = function () {

        var editor = $(this.main);

        return !(editor.find('img').length)
            && !(editor.find('blockquote').length)
            && !(editor.find('li').length)
            && !$.trim(editor.text());
    };

    /**
     * 获取内容
     *
     * @return {string} 内容
     */
    Editor.prototype.getContent = function () {
        var me = this;
        return me.isEmpty() ? '' : $.trim($(me.main).html());
    };

    /**
     * 设置内容
     *
     * @param  {string} html html字符串
     * @return {Object}      this
     */
    Editor.prototype.setContent = function (html) {
        var me = this;

        me.editor.html(html);
        me.cleanContent();
        return me;
    };

    /**
     * 清理黑名单中的属性和标签 {cleanAttrs: ['style'], cleanTags: ['id']}
     *
     * @param  {Object} options 配置
     * @return {Object}         this
     */
    Editor.prototype.cleanContent = function(options) {
        var me = this;
        var editor = $(me.editor);

        if (!options) {
            options = me.config;
        }

        $(options.cleanAttrs).each(function (index, attr) {
            editor.find('[' + attr + ']').removeAttr(attr);
        });

        $(options.cleanTags).each(function (index, tag) {
            editor.find(tag).each(function (index, ele) {
                $(ele).remove();
            });
        });

        me.checkContentChange();
        return me;
    };

    /**
     * 销毁
     */
    Editor.prototype.destroy = function () {
        var me = this;
        var editor = me.main;

        me.checkContentChange();

        // 清空所有范围
        selection.removeAllRanges();

        // 接触所有的绑定事件
        $(editor).off();

        // 删除可编辑状态
        $(editor).removeAttr('contenteditable');
    };

    return Editor;
});
