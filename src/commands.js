define(function (require) {
    var $ = require('jquery');
    var doc = document;
    var selection = doc.getSelection();

    var commands = {

        // allow command list
        commandsReg: {
            block: /^(?:p|h[1-6]|blockquote|pre)$/,
            inline: /^(?:bold|italic|underline|strikethrough|insertorderedlist|insertunorderedlist|indent|outdent)$/,
            source: /^(?:createlink|unlink)$/,
            insert: /^(?:inserthorizontalrule|insertimage|insert)$/,
            wrap: /^(?:code)$/,
            align: /^(?:align)/,
            font: /^(?:font)/
        },

        /**
         * 执行命令
         *
         * @param  {string} cmd 命令
         * @param  {string} val 命令内容
         */
        commandOverall: function (cmd, value) {
            doc.execCommand(cmd, false, value);
        },

        /**
         * 插入命令
         *
         * @param  {string} name  名称
         * @param  {string} value 值
         */
        commandInsert: function (name) {
            var me = this;
            var node = me.getNode();

            if (!node) {
                return;
            }

            me.commandOverall(name);
        },

        /**
         * 包装
         *
         * @param  {string} tag   标签名
         * @param  {string} value 内容
         * @param  {string} style 样式
         */
        commandWrap: function (tag, value, style) {
            var me = this;
            var styleStr = '';

            $.each(style, function (key, value) {
                styleStr += key + ':' + value + ';';
            });

            var value = ''
                + '<' + tag + (styleStr ? (' style="' + styleStr + '"') : '') + '>'
                + (value || selection.toString())
                + '</' + tag + '>';

            me.commandOverall('insertHTML', value);
        },

        /**
         * 设置当前块的标签名
         *
         * @param  {string} name 标签名
         */
        commandBlock: function (name) {
            var me = this;
            var list = me.effectNode(this.getNode(), true);

            if (list.indexOf(name) !== -1) {
                name = 'p';
            }
            me.commandOverall('formatblock', name);
        },

        /**
         * 设置对齐方式
         *
         * @param  {string} name align-left | align-right | align-right
         */
        commandAlign: function (name, node) {
            var align = name.replace('align-', '');
            if (node) {
                // 先清除
                $('.mini-line', node).css('text-align', align);

                // 添加对齐方式属性
                $(node).closest('.mini-line').css('text-align', align);
            }
        },

        /**
         * 设置文本属性
         *
         * @param  {string}     name        action
         * @param  {string}     options     参数
         */
        commandFont: function (name, options) {
            var map = {
                'font-color': 'ForeColor',
                'font-bg-color': 'BackColor',
                'font-size': 'FontSize'
            };
            if (name == 'font-color' || name == 'font-bg-color') {
                this.commandOverall(map[name], options.value);
            }
            else {
                this.commandWrap('font', null, {
                    'font-size': options.value
                });
            }
        }
    };


    return commands;
});
