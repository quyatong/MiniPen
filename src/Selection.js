define(function (require, exports, module) {

    var selection = document.getSelection();

    /**
     * 保存选区
     *
     * @return {Array[Range]} 保存的选区列表
     */
    var saveSelection = function() {
         var ranges = [];
         if (selection.rangeCount) {
             for (var i = 0, len = selection.rangeCount; i < len; ++i) {
                 ranges.push(selection.getRangeAt(i));
             }
         }
         return ranges;
     };

     /**
      * 还原存储的选区
      *
      * @param  {Array[Range]} rangeArray 保存的选区列表
      */
     var restoreSelection = function(rangeArray) {
         if (rangeArray && rangeArray.length) {
             selection.removeAllRanges();
             for (var i = 0, len = rangeArray.length; i < len; ++i) {
                 selection.addRange(rangeArray[i]);
             }
         }
     };

     module.exports = {
         saveSelection: saveSelection,
         restoreSelection: restoreSelection
     };
});
