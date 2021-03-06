/*! Licensed under MIT, https://github.com/sofish/pen */

define(function (require) {
    var $ = require('jquery');
    var Toolbar = require('./Toolbar');
    var Editor = require('./Editor');

    // 默认配置
    var defaults = {
        class: 'mini-pen',

        list: [
            // 'font-family',
            // 文字 颜色 | 背景色 | 字体大小
            'font-color', 'font-background-color', 'font-size',

            // 加粗 斜体 下划线 删除线
            'bold', 'italic', 'underline', 'strikethrough',

            // 对齐方式
            'align-left', 'align-center', 'align-right'
        ],

        // 属性 黑名单
        cleanAttrs: ['id', 'class', 'style', 'name'],

        // 标签 黑名单
        cleanTags: ['script']
    };

    /**
     * MiniPen 构造函数
     *
     * @param  {Object} config 用户配置项
     */
    var MiniPen = function(config) {
        var me = this;

        // merge 用户的配置
        me.config = $.extend(defaults, config);

        // 初始化工具条
        me.toolbar = new Toolbar(me.config);

        // 初始化编辑器
        me.editor = new Editor(me.config);

        // 打通editor和toolbar
        me.toolbar.use(me.editor);
        me.editor.use(me.toolbar);
    };

    /**
     * 设置内容
     *
     * @param {string} content 编辑器内容
     */
    MiniPen.prototype.setContent = function (content) {
        var me = this;
        me.editor.setContent(content);
    };

    /**
     * 获取内容
     *
     * @return {String} html
     */
    MiniPen.prototype.getContent = function () {
        var me = this;
        return me.editor.getContent();
    };

    /**
     * 选择全部
     *
     * @param {HTML Element} 选择元素
     */
    MiniPen.prototype.selectAll = function (target) {
        var me = this;
        me.editor.selectAll(target);
    };

    /**
     * 销毁
     */
    MiniPen.prototype.destroy = function () {
        var me = this;

        // 销毁工具条
        me.toolbar.destroy();

        // 销毁编辑器
        me.editor.destroy();
    };

    return MiniPen;
});
