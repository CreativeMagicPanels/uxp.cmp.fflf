import { getExt } from "./functions";

import { getLangText } from "./lang";

export function initProcess() {

    // console.log("Code Processing Init");

}

export function processCode(target, withIcons = false) {

    try {

        processLabels(target);

        processTips(target);

        if (withIcons) {

            processIcons(target); 

        }

    } catch(e) {

        console.log("Processing Code Error", e)

    }

}

export function processTips(target) {

    try {

        const langTips = target.querySelectorAll(".tooltip");

        langTips.forEach(tip => {

            const data = tip.getAttribute("data-tip");

            const dataLangTip = getLangText("tip " + data);

            if (!dataLangTip.includes("missing")) {

                tip.setAttribute("title", dataLangTip);

            }

        });

    } catch(e) {

        console.log("Processing Tips Error", e)

    }

};

export function processLabels(target) {

    try {

        const langLabels = target.querySelectorAll(".lang");

        langLabels.forEach(label => {
                
            const data = label.getAttribute("data-label");

            label.innerHTML = getLangText(data);

        });        

    } catch(e) {

        console.log("Processing Labels Error", e)

    }

}

export function processIcons(target) {

    try {

        const icons = target.querySelectorAll(".svg-icon");

        icons.forEach(async icon => {

            const iconName = icon.getAttribute("icon");

            icon.innerHTML = await getExt({item: iconName, folder: "./svg/", ext: ".svg"});

        });

    } catch(e) {

        console.log("Processing Icons Error", e)

    }

}