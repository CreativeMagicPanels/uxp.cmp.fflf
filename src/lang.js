const fs = require("fs");

const { entrypoints } = require("uxp");



//Reads Plugin Language File
const newLangJson = JSON.parse(fs.readFileSync("plugin:/json/languages.json", {encoding: "utf-8"}));

// console.log(newLangJson);

import { getExt, processCode } from "./functions";

import { getOption, setOption } from "./options";

export function initLang() { 

    // console.log("Language Init");

}

//Gets the system language
export function getSystemLanguage() {
    const host = require('uxp').host;
    const locale = host.uiLocale;
    const hostName = host.name
    const hostVersion = host.version;
   
    // console.log("Host:", hostName, hostVersion, locale);
    
    return locale;

}

//Search text item inside language JSON
function getThisText(item, lang = getOption("activeLanguage")) {

    if (lang === "auto-lang") lang = getSystemLanguage();

    // console.log("Getting Lang Text:", item, lang);

    let myText;

    try {

        const myItem = newLangJson[lang]["texts"][item];

        if (myItem === undefined) {

            // console.log("There's no", item, "in", lang);

            const myEnItem = newLangJson["en_GB"]["texts"][item];

            if (myEnItem !== undefined) {

                // console.log("Getting en_GB:", item)

                myText = getThisText(item, "en_GB");

            } else {

                // console.log("And there's no", item, "in en_GB either")

                myText = item + " (missing)";

            }
        
            // return getThisText(item, "en_GB");
        
        } else {
        
            myText = myItem;

        }

    } catch(e) {

        try {
            // console.log(lang, "is not supported : trying en_GB")
            
            myText = getThisText(item, "en_GB"); 
            
        } catch(e) {
           
            console.log("Error Getting Lang Text", e);

        }

    }

    // console.log("Got", item, "in", lang, ":", myText);

    return myText;

}

export function buildText(data, label) {

  const startText = getLangText(label);

  const values = Array.isArray(data) ? data : [data];

  return startText.replace(/\{(\d+)\}/g, (match, index) => {

    return index < values.length ? values[index] : match;

  });
  
}

//Interface for getting language text
export function getLangText(item, lang = getOption("activeLanguage")) {

    const dataLang = getThisText(item, lang);

    return dataLang;

    if (dataLang.slice(0,1) === "_") {

        return dataLang.slice(1);

    } else {

        return dataLang.toUpperCase();

    }


}
 
//Sets the active language
export async function setLanguage(lang = "en_GB") {

    try {

        // setOption("activeLanguage", lang);

        const { menuItems } = entrypoints.getPanel("main");

        menuItems.getItem("lang-error").label = getLangText("menu lang error");
        menuItems.getItem("2").label = getLangText("menu samples 2");
        menuItems.getItem("7").label = getLangText("menu samples 7");
        menuItems.getItem("langs").label = getLangText("menu languages");
        menuItems.getItem("samples").label = getLangText("menu samples");
        menuItems.getItem("reload").label = getLangText("menu reload");
        menuItems.getItem("reset").label = getLangText("menu reset");

        menuItems.getItem("en_GB").checked = false;
        menuItems.getItem("fr_FR").checked = false;
        menuItems.getItem("it_IT").checked = false;
        menuItems.getItem("es_ES").checked = false;
        menuItems.getItem("de_DE").checked = false;
        menuItems.getItem("pt_BR").checked = false;
        menuItems.getItem("hi_IN").checked = false;
        menuItems.getItem("autolang").checked = false;
        menuItems.getItem(lang).checked = true;

        // processCode(document);

    } catch(e) {

        console.log("LANGUAGE ERROR", e)

    }

}

export function getLanguageErrorLink() {

    try {

        let thisLang = getOption("activeLanguage");

        if (thisLang === "auto-lang") thisLang= getSystemLanguage();

        let link = "mailto:support@zurgpanel.com?subject=FFLF Language Error in " + thisLang; // + "&body=Please describe the error you are experiencing with the language in the panel.";

        return link

    } catch(e) {

        console.log("LANGUAGE ERROR", e)

    }

}