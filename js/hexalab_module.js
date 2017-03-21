"use strict";
var Module = {
    preRun : [],
    postRun : [],
    print : function() {
        var element = document.getElementById("text_output");
        return function (text) {
            element.value += text + '\n';
            element.scrollTop = element.scrollHeight;
        }
    } ()
};