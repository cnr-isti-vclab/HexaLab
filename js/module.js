"use strict";

var g_logger = document.getElementById("logger");

function log(string) {
    if (g_logger) {
        g_logger.value += string + "\n";
        g_logger.scrollTop = g_logger.scrollHeight;
    }
}

var Module = {
    preRun : [],
    postRun : [],
    print : function (string) {
        log(string);
    }
};