window.require('photoshop').core.suppressResizeGripper({
    "type": "panel",
    "target": "main",
    "value": true
})

const { entrypoints } = require("uxp");

import { getOption, setOption } from "./options";

import { processCode } from "./process";

const pluginVersion = require("uxp").versions.plugin;

export function initUi() {

    console.log("UI Init");

    processCode(document, true);

    document.querySelector(".version").innerText = "V " + pluginVersion;
    
}