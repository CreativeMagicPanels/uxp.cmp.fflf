/*
------------------------------------------------------------------------------------------------------------------------
LICENSE FILE
Version 1.3
Independent from the rest, just needs to be added to the source folder and imported from any file to work.
Includes all the languages and the CSS needed

Changelog:

Version 1.1
- Added the ability to check for license expiration and block/extend the access depending on the license type

Version 1.2
- Added loading gif to display during license check operations
- Added "Try Again" option on License Invalid error
- CSS refinements

Version 1.3
- Added Update Check

------------------------------------------------------------------------------------------------------------------------
*/

import { get } from "http";

/* INCLUDES & REQUIRES */

const fileSystem = require("uxp").storage.localFileSystem;

const operatingSystem = require("os");

let pluginVersion = require("uxp").versions.plugin;

const fs = require("fs");

const domains = require('uxp').storage.domains;

const formats = require("uxp").storage.formats; 

const { entrypoints } = require("uxp");



/* LICENSE SETTINGS */

const currentDate = new Date();

const copyData = "Copyright © 1976 Adobe. All rights reserved.";

const dataFolder = "com.crevicereport.cloud";

const cFile = ".adobecopyinfo";

const lFile = ".dsLog";

let letMeBe = false;

let storedUserSerial, storedOnlineData, keepWorking, licenseStart;

// Max number of random generated licenses
const maxLicense = 5;

// Time after which the panel tries to check online (on the next reload)
// Expressed in seconds
let checkTime = 86400;

// Test CheckTime 
// checkTime = 30;

// Max number of connection errors before the user need a new Online Activation
let maxChecks = 14;

// Test Max Checks
// maxChecks = 2;

let eddDomain = "https://www.creativemagicpanel.com";

export const userArea = "https://www.creativemagicpanel.com/user-area/";

// Test Connection Error
// eddDomain = "https://www.zurgpanel.com";

/*
PRODUCT SETTINGS

First Frame, Last Frame Plugin Perpetual
ID: 286468, License Starts with: ZG35L

Zürg 3.5 Plugin Subscription
ID: 465, License Starts with: ZG35S

*/

const panelName = "First Frame, Last Frame";

let eddItemID = 286468;

switch(eddItemID) {
    case 286468:
        licenseStart = "FFLF";
        keepWorking = true;
        break;
    default:
        keepWorking = false;
}

let defSerial = "CAV2-QOZ8-3T29-K4K6LJP3";
let defLicense = "license" + randInt(1, maxLicense);

let myLicense = {
    serial: "",
    license: randInt(1, maxLicense),
    name: ""
}

/* Accessory Math Functions */

// Random Integer between min and max
function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Random licnese number between 1 and maxLicense, but not the one passed 
function randomNot(not) {
    let newRandom;

    do {
        newRandom = randInt(1, maxLicense); 
    } while (newRandom == not)

    return newRandom
}  



/* HTML Accessories */

// Function to create HTML elements
function createTag(tag, props, ...children) {
    let element = document.createElement(tag);
    if (props) {
        if (props.nodeType || typeof props !== "object") {
            children.unshift(props);
        }
        else {
            for (let name in props) {
                let value = props[name];
                if (name == "style") {
                    Object.assign(element.style, value);
                }
                else {
                    element.setAttribute(name, value);
                    element[name] = value;
                }
            }
        }
    }
    for (let child of children) {
        element.appendChild(typeof child === "object" ? child : document.createTextNode(child));
    }
    return element;
}

// Add license-specific CSS to the HTML
function addCss() {

    var licenseCss = `

        :root {

            --license-accent: #3d9ae2;

        }

        @media (prefers-color-scheme: darkest) {

            :root {
                --license-background: #19191a;
                --license-text: #ccc;
                --license-border: #333;
                --license-logo: #252526;
            }

        }

        @media (prefers-color-scheme: dark) {

            :root {
                --license-background: #19191a;
                --license-text: #ccc;
                --license-border: #333;
                --license-logo: #252526;
            }

        }        

        @media (prefers-color-scheme: light) {

            :root {
                --license-background: #ebecf0;
                --license-text: #333;
                --license-border: #ccc;
                --license-logo: #fff;
            }

        }

        @media (prefers-color-scheme: lightest) {

            :root {
                --license-background: #ebecf0;
                --license-text: #333;
                --license-border: #ccc;
                --license-logo: #fff;
            }

        }

        .accent {
            color: var(--license-accent);
            }
            
        .license-loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -200%);
            width: 100%;
            padding: 20px;
            background: url(./images/loading.gif) no-repeat center center;
            background-size: contain;
        }

        .license-cover {
            position: absolute;
            top: 0;
            left: 0;
            z-index: 9999;
            width: 100vw;        
            height: 100vh;
            background-color: var(--license-background);
            background-image: radial-gradient(circle,rgba(0, 0, 0, 0) 30%, rgba(0, 0, 0, 0.4) 100%);
            background-position: center;
        }

        .license-content {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 20px;
        }

        .license-text {
            text-align: center;
            color: var(--license-text);
            margin-bottom: 10px;
        }

        .license-button {
            padding: 10px 20px;
            background-color: var(--license-background);
            color: var(--uxp-host-text-color);
            border: 1px solid var(--license-border); 
            border-radius: 5px;
            text-align: center;
            font-weight: 600;
            cursor: pointer;
        }
            
        .license-button:hover {
            /* background-color: var(--license-border); */
            color: var(--license-accent);
        }

        .modal-dialog {
            padding: 20px;
            background-color: var(--license-background);
            color: var(--license-text);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }

        .modal-dialog a {
            color: var(--license-accent);
        }

        .modal-dialog a:hover {
            text-decoration: underline;
        }

        .modal-dialog p {
            line-height: 1;
        }

        .dialog-logo {
            margin-bottom: 10px;
        }

        .dialog-logo svg {
            width: 120px;
            height: 80px;
            fill: var(--license-logo);
        }

        .dialog-title {
            font-size: 15px;
            font-weight: 600;
            color: var(--license-accent);
            margin-bottom: 5px;
        }

        .dialog-text {
            font-size: 13px;
            color: var(--license-text);
            padding: 0 5px;
            margin-bottom: 10px
        }


        .dialog-input {
            width: 100%;
            margin-bottom: 10px;    
        }

        .dialog-buttons {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
        }

        .dialog-button {
            margin: 0 5px;
            padding: 8px 20px;
            background-color: var(--license-background);
            color: #fff;
            border: 1px solid var(--license-border);
            border-radius: 5px;
            text-align: center;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
        }

        .dialog-button:hover {
            color: var(--license-accent);
        }

        .dialog-button.ok {
            background-color: var(--license-accent);
            border-color: var(--license-accent);
        }

        .dialog-button.ok:hover {
            border-color: #fff;
            color: #fff;
        }




    `;

    let licenseStyle = createTag("style", {id:"license-style"});

    licenseStyle.appendChild(document.createTextNode(licenseCss));
        
    document.head.appendChild(licenseStyle);

} 

// Creates the Logo for the Dialogs
function addLogo() {

        let logo = createTag("div", {class:"dialog-logo"});
        
        // LOGO ÜMLAUT
        
        // let svg = createTag("svg", {viewBox:"0 0 601 707", xmlns:"http://www.w3.org/2000/svg"});
        
        // let path = createTag("path", {d:"M601 406.001H600.616V407C600.616 572.685 466.302 707 300.616 707C134.931 707 0.616277 572.685 0.616211 407V397H1V196.001C111.457 196.001 201 285.544 201 396.001V596.004C201 651.232 245.772 696.004 301 696.004C356.228 696.004 401 651.232 401 596.004V396.001C401 285.544 490.543 196.001 601 196.001V406.001ZM198.459 1.53508C200.411 -0.4174 203.578 -0.417187 205.53 1.53508L300.99 96.995L205.53 192.454C203.578 194.407 200.412 194.407 198.459 192.454L106.535 100.53C104.583 98.5777 104.583 95.4124 106.535 93.4599L198.459 1.53508ZM396.459 1.53508C398.411 -0.4174 401.578 -0.417187 403.53 1.53508L495.454 93.4599C497.407 95.4125 497.407 98.5776 495.454 100.53L403.53 192.454C401.578 194.407 398.412 194.407 396.459 192.454L301 96.995L396.459 1.53508Z"});
        
        
        // LOGO CREATIVE MAGIC

        let svg = createTag("svg", {viewBox:"0 0 30 17", xmlns:"http://www.w3.org/2000/svg"});
        
        let path = createTag("path", {d:"M18.5902 15.3839H30L21.1538 0L14.9996 10.7011L8.84616 0L0 15.3839H11.4199L9.62506 12.262H5.38543L8.84616 6.24378L15.0051 16.9355L21.1538 6.24378L24.6146 12.262H20.3858L18.5902 15.3839Z"});
    
        svg.appendChild(path);

        logo.appendChild(svg);

        return logo;
}

/* Creates the element that blocks the view showing a message and a button for the License Activation */
function addCover() {

    // console.log("Adding License Activation Cover");

    document.body.classList.add("modal-open");

    const activeLanguage = getSystemLanguage();

    const thereISACover = document.querySelector(".license-cover");

    if (thereISACover !== null) {
        return;
    }

    let myCover = createTag("div", {class:"license-cover"});

    let myContent = createTag("div", {class:"license-content"});

    let myText = createTag("div", {class:"license-text"});

    let myButton = createTag("div", {class:"license-button"});

    myText.innerHTML = getText("text activation new");

    myButton.innerHTML = getText("button activate now");

    myContent.appendChild(myText);

    myContent.appendChild(myButton);

    myCover.appendChild(myContent);

    document.body.appendChild(myCover);

}

/* Removes the License Activation Cover */
function removeCover() {

    document.body.classList.remove("modal-open");

    let myCover = document.querySelector(".license-cover"); 

    if (myCover) {

        myCover.remove();

    }

}

// Creates and pops-up the dialog for the Serial Number
async function serialDialog() {

    try {

        console.log("ASK FOR SERIAL INPUT");

        let myDialog = createTag("dialog", {id:"serial-dialog", class:"modal-dialog"});

        let myLogo = addLogo();

        let myTitle = createTag("div", {class:"dialog-title"});

        let myText = createTag("div", {class:"dialog-text"});

        let myInput = createTag("sp-textfield", {id:"serial-number", class:"dialog-input"});

        let myButton = createTag("div", {class:"dialog-button ok"});

        myTitle.innerHTML = getText("dialog serial title");

        myText.innerHTML = getText("dialog serial text");

        myButton.innerHTML = getText("dialog serial button"); 

        myButton.addEventListener("click", async () => {

            // await document.getElementById("serial-dialog").close("OK");
            await myDialog.close("OK"); 

        });

        myDialog.appendChild(myLogo);

        myDialog.appendChild(myTitle);

        myDialog.appendChild(myText);

        myDialog.appendChild(myInput);

        myDialog.appendChild(myButton);

        document.body.appendChild(myDialog);

        // let getRes = await document.getElementById("serial-dialog").uxpShowModal({
            let getRes = await myDialog.uxpShowModal({
                // let getRes = await myDialog.show({
            title: panelName,
            resize: "none",// "both","none", "horizontal"???, "vertical"???,
            size: {
                width: 300,
                height: 450
            }
        })

        if (!getRes || getRes === "reasonCanceled") {

            console.log("Serial Input Canceled")

            // await errorDialog("activation");

        } else if (getRes === "OK") {

            console.log("Checking Serial Number:", myInput.value);

            const myContent = document.querySelector(".license-content");

            let myLoad = createTag("div", {class:"license-loading"});

            myContent.appendChild(myLoad);

            serialCheck(myInput.value);

            // return true

        }

        myDialog.remove();
        
        // removeDialogs();

    } catch(e) {

        console.log(e)

    }
}

// Creates and pops-up the dialog for displaying errors
async function errorDialog(type) {

    let okButton, koButton;

    let myDialog = createTag("dialog", {id:"error-dialog", class:"modal-dialog"});

    let myLogo = addLogo();

    let myTitle = createTag("div", {class:"dialog-title"});

    let myText = createTag("div", {class:"dialog-text"});

    let myButtons = createTag("div", {class:"dialog-buttons"});

    myDialog.appendChild(myLogo);

    myDialog.appendChild(myTitle);

    myDialog.appendChild(myText);
    
    myDialog.appendChild(myButtons);

    switch (type) {

        case "activation":
            myTitle.innerHTML = getText("error activation title");

            myText.innerHTML = getText("error activation text");

            koButton = createTag("div", {class:"dialog-button"});

            koButton.innerHTML = getText("button close");

            koButton.addEventListener("click", async () => {

                // await document.getElementById("error-dialog").close(false);
                await myDialog.close(false);

            });

            break;

        case "disabled":
            myTitle.innerHTML = getText("error disabled title");

            myText.innerHTML = getText("error disabled text");

            koButton = createTag("div", {class:"dialog-button"});

            koButton.innerHTML = getText("button close");

            koButton.addEventListener("click", async () => {

                // await document.getElementById("error-dialog").close(false);
                await myDialog.close(false);

            });

            break;

        case "connection":
            myTitle.innerHTML = getText("error connection title");

            myText.innerHTML = getText("error connection text");

            koButton = createTag("div", {class:"dialog-button"});

            koButton.innerHTML = getText("button close");

            koButton.addEventListener("click", async () => {

                // await document.getElementById("error-dialog").close(false);
                await myDialog.close(false);

            });

            break;

        case "invalid":
            myTitle.innerHTML = getText("error invalid title");

            const licenseText = getText("error invalid text");

            if (licenseStart !== "") {

                myText.innerHTML = licenseText.replace("%1", licenseStart);

            } else {

                myText.innerHTML = licenseText;

                myText.querySelector(".starts").remove();

            }

            koButton = createTag("div", {class:"dialog-button"});

            okButton = createTag("div", {class:"dialog-button"});

            okButton.innerHTML = getText("button serial try");

            okButton.addEventListener("click", async () => {

                // await document.getElementById("error-dialog").close(false);
                await myDialog.close("Try");

            });            

            koButton.innerHTML = getText("button close");

            koButton.addEventListener("click", async () => {

                // await document.getElementById("error-dialog").close(false);
                await myDialog.close(false);

            });

            break;

        case "expired":

            myTitle.innerHTML = getText("error expired title");

            myText.innerHTML = getText("error expired text");

            koButton = createTag("div", {class:"dialog-button"});

            koButton.innerHTML = getText("button close");

            koButton.addEventListener("click", async () => {

                // await document.getElementById("error-dialog").close(false);
                await myDialog.close(false);

            });


            break;

        default:
            koButton = createTag("div", {class:"dialog-button"});

            koButton.innerHTML = getText("button close");

    }

    myButtons.appendChild(koButton);

    if (okButton) {

        myButtons.appendChild(okButton);

    }

    const loadingGif = document.querySelector(".license-loading");

    if (loadingGif) {

        loadingGif.remove();

    }

  

    document.body.appendChild(myDialog);

    // let getRes = await document.getElementById("error-dialog").uxpShowModal({
    let getRes = await myDialog.uxpShowModal({
        title: panelName,
        resize: "none",// "both","none", "horizontal"???, "vertical"???,
        size: {
            width: 300,
            height: 450
        }

    })

    myDialog.remove();

    if (!getRes || getRes === "reasonCanceled") {

        console.log("Error Closed")

        // return false;

    } else if (getRes === "Try") {

        console.log("Trying Again");

        await serialDialog();

    }

    // removeDialogs();

}

// Removes the dialogs
// Probably not needed anymore
function removeDialogs() {

    let myDialogs = document.querySelectorAll(".modal-dialog");

    myDialogs.forEach(async (dialog) => {

        dialog.remove();

    });

}



/* Language-related Functions */

/* Gets the System Language */
function getSystemLanguage() {
    const host = require('uxp').host;
    const locale = host.uiLocale;
    const hostName = host.name
    const hostVersion = host.version;
   
    // console.log("Host:", hostName, hostVersion, locale);
    
    return locale; 
}

/* Gets the Text in the requested language from the variable */
function getText(item, lang) {

    lang = lang === undefined ? getSystemLanguage() : lang;

    // console.log("Getting Lang Text:", item, lang);

    let myText;

    try {

        const myItem = licenseLanguages[lang][item];

        if (myItem === undefined) {

            // console.log("There's no", item, "in", lang);

            const myEnItem = licenseLanguages["en_GB"][item];

            if (myEnItem !== undefined) {

                // console.log("Getting en_GB:", item)

                myText = getText(item, "en_GB");

            } else {

                // console.log("And there's no", item, "in en_GB either")

                myText = item + " (missing)";

            }
        
            // return getText(item, "en_GB");
        
        } else {
        
            myText = myItem;

        }

    } catch(e) {

        try {
            // console.log(lang, "is not supported : trying en_GB")
            
            myText = getText(item, "en_GB"); 
            
        } catch(e) {
           
            console.log("Error Getting Lang Text", e);

        }

    }

    // console.log("Got", item, "in", lang, ":", myText);

    return myText;

}

/* Variable storing the languages */
const licenseLanguages = {
    "en_GB": {
        "text activation new": "This panel needs a new online activation to run.",
        "button activate now": "ACTIVATE NOW",
        "button close": "CLOSE",
        "dialog serial title": "INSERT LICENSE KEY",
        "dialog serial text": "Please insert your License Key to continue using this panel.",
        "dialog serial button": "CHECK SERIAL",
        "error activation title": "ACTIVATION ERROR",
        "error activation text": "<p>Please try again later.</p><p>If the problem persists please contact our Support at <a href='mailto:support@creativemagic.store'>support@creativemagic.store</a></p>",
        "error disabled title": "LICENSE DISABLED",
        "error disabled text": "<p>It looks like there is a problem with your license.</p><p>Please contact our Support at <a href='mailto:support@creativemagic.store'>support@creativemagic.store</a></p>",
        "error connection title": "CONNECTION ERROR",
        "error connection text": "<p>The panel can't connect to our servers for activation, please check your internet connection and try again later.</p><p>If the problem persists please contact our Support at <a href='mailto:support@creativemagic.store'>support@creativemagic.store</a></p>",
        "error invalid title": "INVALID LICENSE KEY",
        "error invalid text": "<p>This License Key is not valid for this product.</p><p class='starts'>Please mind License Keys for this product usually start with <b class='accent'>%1</b></p><p>Double-check you are using the correct key and it is inserted whole, including hyphens.</p><p>If the problem persists please contact our Support at <a href='mailto:support@creativemagic.store'>support@creativemagic.store</a></p>",
        "error expired title": "LICENSE EXPIRED",
        "error expired text": "<p>Your license has expired. Please renew your license to continue using the panel.</p>",
        "modal serial insert": "<b class='title'>INSERT SERIAL</b><p>Please insert your License Key to continue using this panel.",
        "modal serial reactivate": "_<b class='title'>KEY ALREADY ACTIVE</b><p>This License Key is already active on another device.</p><p>If you proceed with the activation it will disable it everywhere else.</p>Would you like to activate it here?",
        "button serial check": "Check License Key",
        "button serial try": "TRY AGAIN",
        "button serial reactivate": "Yes, Activate Here",
    }    
}

/* END LANGUAGES */













// Updates Check
function compareVersionNumbers(v1, v2){
    var v1parts = v1.split('.');
    var v2parts = v2.split('.');

    function isPositiveInteger(x) {
        return /^\d+$/.test(x);
    }

    // First, validate both numbers are true version numbers
    function validateParts(parts) {
        for (var i = 0; i < parts.length; ++i) {
            if (!isPositiveInteger(parts[i])) {
                return false;
            }
        }
        return true;
    }
    if (!validateParts(v1parts) || !validateParts(v2parts)) {
        return NaN;
    }

    for (var i = 0; i < v1parts.length; ++i) {
        if (v2parts.length === i) {
            return 1;
        }

        if (v1parts[i] === v2parts[i]) {
            continue;
        }
        if (v1parts[i] > v2parts[i]) {
            return 1;
        }
        return -1;
    }

    if (v1parts.length != v2parts.length) {
        return -1;
    }

    return 0;
}

async function updateCheck() {

    const readData = {
        action: "vs"
    }

    try {
        return await onlineAction(readData);
    } catch (e) {
        // console.log("ERRORE LICENZA ONLINE", e)
        return false
    }


}

export async function checkForUpdates() {

    try {

        // pluginVersion = "2.0.0"; // Hardcoded for now, should be dynamic

        const onlineVersion = await updateCheck();

        const updateAvailable = compareVersionNumbers(onlineVersion["new_version"], pluginVersion) > 0;

        console.log("UPDATE AVAILABLE?", onlineVersion["new_version"], pluginVersion, updateAvailable);

        if (updateAvailable) {

            return {
                available: true,
                version: onlineVersion["new_version"]
            }

        } else {

            return { available: false }
            
        }

    } catch (error) {

        // console.error("Error checking for updates:", error);
        return { available: false };

    }

}

/* (async () => {

    try {

        console.log(await checkForUpdates());

    } catch (error) {

        console.error("Error checking for updates:", error);

    }
  
  // Do stuff with RGB

})(); */






export function doDo() {

    // console.log("DO DO");

    if (!letMeBe) {
        initStart();
        return true
    } else {
        // console.log("INDEED I WORK!");
        return false
    }
}


/* ONLINE DATA MANAGEMENT */

// Call EDD API and return Json
export async function onlineAction({ action = "ck", serial = defSerial, license = defLicense } = {}) {
    let doAction, onlineRequest;

    let checkOnly = false;

    switch (action) {
        case "ac":
            doAction = "activate_license";
            break;
        case "ck":
            doAction = "check_license";
            break;
        case "kl":
            doAction = "deactivate_license";
            break;
        case "vs":
            doAction = "get_version";
            checkOnly = true;
            break;
    }

    // console.log(doAction, serial, license)

    if (checkOnly) {

        onlineRequest = `${eddDomain}?edd_action=${doAction}&item_id=${eddItemID}`;

    } else {

        onlineRequest = `${eddDomain}?edd_action=${doAction}&item_id=${eddItemID}&license=${serial}&url=${license}`;

    }

    // const onlineRequest = `${eddDomain}?edd_action=${doAction}&item_id=${eddItemID}&license=${serial}&url=${license}`;

    // console.log(onlineRequest)

    try {
        const response = await fetch(onlineRequest, { method: "post" })

        if (!response.ok) {
            throw new Error(`HTTP Error fetching CMP Website, status: ${response.status}`);
        }

        const jsonRes = await response.json();

        // console.log(jsonRes)

        return jsonRes

    } catch (e) {

        console.log(e.stack);

        return false

    }
}

// Checks Serial and return License data
async function readLicense(serial, license) {

    const readData = {
        action: "ck",
        serial: serial,
        license: license
    }

    try {
        return await onlineAction(readData);
    } catch (e) {
        console.log("ERRORE LICENZA ONLINE", e)
        return false
    }

}

async function activateLicense(serial, license) {

    const readData = {
        action: "ac",
        serial: serial,
        license: license
    }

    try {
        return await onlineAction(readData);
    } catch (e) {
        console.log("ERRORE ATTIVAZIONE LICENZA ONLINE", e)
        return false
    }

}

async function deactivateLicense(serial, license) {

    const readData = {
        action: "kl",
        serial: serial,
        license: license
    }

    try {
        return await onlineAction(readData);
    } catch (e) {
        console.log("ERRORE DISATTIVAZIONE LICENZA ONLINE", e)
        return false
    }

}


/* LOCAL DATA MANAGEMENT */

// Gets the Path of the selected Data Folder. If it's not already present the function creates it.
async function getThisFolderPath(folder) {

    folder = folder || dataFolder;

    let p, finalFolder;

    const homedir = operatingSystem.homedir();

    const platform = operatingSystem.platform();

    if (platform === "darwin") {
        // Mac
        p = path.join(homedir, "Library", "Application Support");
    } else {
        // Windows
        p = path.join(homedir, "AppData", "Roaming");
    }

    try {

        finalFolder = path.join(p, folder);
        
        const pathEntry = await fileSystem.getEntryWithUrl(finalFolder);

        // console.log("Data Folder:", pathEntry.nativePath);

        return pathEntry.nativePath;

    } catch (e) {

        const baseFolder = await fileSystem.getEntryWithUrl(p);

        const newFolder = await baseFolder.createFolder(folder);

        // console.log("Data Folder Created:", newFolder.nativePath);

        return newFolder.nativePath;

    }

};

// Gets the License File Path
async function getLicenseFile() {

    const licenseFolder = await getThisFolderPath(dataFolder);

    const dataFile = path.join(licenseFolder, lFile);

    // console.log("License File:", dataFile);

    return dataFile;

}

// Gets the Copy File Path
async function getCopyFile() {

    const copyFolder = await getThisFolderPath(dataFolder);

    const copyFile = path.join(copyFolder, cFile);

    // console.log("Copy File:", copyFile);

    return copyFile;

}

// Writes Local Data
async function writeLocalData(data) {

    try {

        const writeData = {
            "serial": data.serial,
            "license": data.license,
            "name": data.name,
            "time": data.time,
            "checks": data.checks,
            "useless": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
        }

        const dataFile = await getLicenseFile();

        const copyFile = await getCopyFile();

        await fs.writeFile(dataFile, btoa(JSON.stringify(writeData)), { encoding: "utf-8" });

        await fs.writeFile(copyFile, copyData, { encoding: "utf-8" });

    } catch (e) {

        console.log("Error writing license data", e)

    }

}

// Update number of checks in Local Data
async function updateLocalData(zero = false) {

    let localData = await readLocalData();

    localData.time = Date.now()

    if (!zero) {
        const checks = localData.checks + 1;
        // console.log("Checks", checks)

        if (checks < maxChecks) {
            // console.log("Increase Checks");
            localData.checks = checks;
        } else {
            // console.log("Reset Checks");
            localData.checks = 0;
        }
    } else {
        // console.log("Reset Checks");
        localData.checks = 0
    }

    // console.log("New Checks", localData.checks)

    await writeLocalData(localData);
}

// Initialize Local Data (usally when not present).
async function initLocalData(serial, license, name) {

    console.log("INIT LOCAL DATA");

    try {

        const licenseFolder = await getThisFolderPath(dataFolder);

        const dataTime = Date.now();

        const content = {
            "serial": serial,
            "license": license,
            "name": name,
            "time": dataTime,
            "checks": 0,
        }

        await writeLocalData(content);

    } catch (e) {

        console.log("Error initializing license data", e);

    }

}

// Reads and returns Local Data
async function readLocalData() {

    try {

        const dataFile = await getLicenseFile();

        const rawData = await fs.readFile(dataFile, { encoding: "utf-8" });

        const dataRead = JSON.parse(atob(rawData))

        dataRead.time = parseInt(dataRead.time);

        dataRead.checks = parseInt(dataRead.checks)

        delete dataRead.useless

        // console.log("Serial:", dataRead.serial, "License:", dataRead.license);

        return dataRead;

    } catch (e) {

        console.log("ERRORE LETTURA LICENZA", e);

    }

}

// Checks if Local data is Present
async function checkLocalData() {

    try {

        const licenseFile = await getLicenseFile();

        const copyFile = await getCopyFile();

        fs.readFileSync(licenseFile);

        const copyRead =  fs.readFileSync(copyFile, {encoding: "utf-8"})

        if (copyRead !== copyData) {
            return false;
        }

        return true

    } catch(e) {

        return false

    }

}

// Removes Local Data
async function deleteLocalData() {

    try {

        const licenseFile = await getLicenseFile();

        const copyFile = await getCopyFile();

        await fs.unlink(licenseFile);

        await fs.unlink(copyFile);

        return true

    } catch (e) {

        return false

        console.log(e)

    }

}



/* Acceessories */

async function writeLog(message) {

    try {
        const finalFolder = "plugin-data:/";

        const time = new Date()

        let newEntry = time.toString();

        newEntry += "\n" + message + "\n---\n";

        await fs.writeFile(finalFolder + "licenseLog.txt", newEntry, { flag: "a", encoding: "utf-8" });
        
    } catch(e) {
        console.log("ERROR WRITING LOG FILE", e)
    }
    
}

function checkElapsedTime(time) {

    try {
        const timeNow = Date.now();

        const elapsedTime = timeNow - time;
    
        // console.log(timeNow, elapsedTime)
    
        return (elapsedTime < ( checkTime * 1000) ) ? true : false;
    } catch(e) {
        console.log(e)
    }
}

async function blockAccess(message) {
    letMeBe = false;
    // console.log(message)
    await writeLog(message)
}

async function allowAccess() {
    letMeBe = true;
    // console.log("PANEL CAN RUN")
}

async function getLicenseNumber(serial){
	for (let l = 1; l <= maxLicense; l++) {
		let requestCk = await readLicense(serial, "license" + l);
		// console.log("checking license" + l);
		if (requestCk !== false) {
			if (requestCk.license == "valid") return l;
		}
	}
	return "0";
}




async function serialCheck(userSerial) {

    try {

	userSerial = userSerial.replace(/[^a-zA-Z0-9\-]/g, ""); 

    const onlineData = await readLicense(userSerial);

    console.log("Online Data",onlineData);

	if (onlineData !== false) {

		//alert(JSON.stringify(onlineData));

		if (onlineData.success) {
			// Serial Number is valid
			if ( onlineData.license == "inactive" ) {
				// License has not been activated yet

				// Standard Activation with provided serial
				var activeData = await activateLicense(userSerial)

                // console.log(activeData);

				if (activeData !== false) {
					// Connection is OK
					if (activeData.success == false) {
						// Activation Fails
						//alert("Activation Error.\nPlease try again later!");
						await blockAccess("Activation Error");

                        // showError("activation")

                        await errorDialog("activation");

					} else {
						// Activation is successful, let the Panel run
						var userName = activeData.customer_name;

                        // console.log(userSerial, defLicense, userName);

                        await initLocalData(userSerial, defLicense, userName);

						await allowAccess();

                        removeCover();
                        // hideModal();

                        await writeLog("Serial Check: License Activated. Panel can run.")
					}

				} else {
					// Connection is KO
					//alert("Activation Error.\nPlease try again later!");
					await blockAccess("Serial Check: Activation Error. No connection.");

                    await errorDialog("connection");

                    // showError("connection")
				}

            } else if ( onlineData.license == "disabled" ) {

                await blockAccess("Serial Check: License Disabled");

                // showError("disabled")

                await errorDialog("disabled");

            } else if ( onlineData.license == "invalid_item_id" ) {

                await blockAccess("Serial Check: Invalid ID");

                // showError("disabled")

                await errorDialog("invalid");

            } else if ( onlineData.license == "expired" ) {

                if (keepWorking) {

						// The License is expired but it's a Permanent License, so we let the Panel run
						var userName = onlineData.customer_name;

                        // console.log(userSerial, defLicense, userName);

                        await initLocalData(userSerial, defLicense, userName);

						await allowAccess();

                        removeCover();
                        // hideModal();

                        await writeLog("Serial Check: Expired Lifetime License. Panel can run.")                        

                } else {

                    await blockAccess("Serial Check: License Expired");

                    await errorDialog("expired");

                }

            } else {

				storedOnlineData = onlineData;
				storedUserSerial = userSerial;

				await blockAccess("Already in use. Please Reactivate ");

                // await reAactivateHere();

                await reActivate();

                // console.log(storedUserSerial, storedOnlineData);

			}

		} else {
			// Serial Number is not valid
			//alert("Sorry, wrong serial number.")
			await blockAccess("Serial Check: Wrong Serial Number");

            await errorDialog("invalid");

            // showError("invalid")
		}

	} else {
		//alert("Connection Error.\nPlease try again later!");
		await blockAccess("Serial Check: No connection.");

        await errorDialog("connection");

        // showError("connection")
	} 

    } catch(e) {

        console.log(e)

    }
}

async function reActivate() {
	var userSerial = storedUserSerial;
	var onlineData = storedOnlineData; //getOnlineData("ck", userSerial);

	//alert(JSON.stringify(onlineData));
	// License has already been activated
	// Ask user whether he wants to activate here
	//var newActivation = confirm("Warning!\nThis serial number is already in use on another computer, would you like to deactivate it and use it here?", false);

	//if (newActivation) {
		// User says yes
		if (onlineData.license == "valid") {
			// We know already that the license we tried to check with is the valid one
			var notMe = defLicense.substring(defLicense.length - 1, defLicense.length);
		} else {
			// We have to find what license is valid
			var notMe = await getLicenseNumber(userSerial);
		}

		// Deactivate currently active license
		var oldLicense = "license" + notMe;
		var killData = await deactivateLicense(userSerial, oldLicense);

		if (killData !== false) {

            //Connection is OK
			if (killData.success == false) {
				// Cannot deactivare license
				//alert("Activation Error.\nPlease try again later!");
				//alert("Cannot kill data");
				await blockAccess("Reactivate: Cannot Deactivate other license.");

                await errorDialog("activation");

                // showError("activation")
			} else {
				// Deactivation successful
				// Activate serial with a different license number

                    defLicense = "license" + randomNot(notMe);
		

				var activeData = await activateLicense(userSerial);

				if (activeData !== false) {
					
					//Connection is OK
					if (activeData.success == false) {
						await blockAccess("Reactivate: Activation Error.");
                        
					} else {
						// If activation is successful, let the Panel run
						var userName = activeData.customer_name;
						await initLocalData(userSerial, defLicense, userName);

						await allowAccess();

                        removeCover();




                        // hideModal();
                        await writeLog("Panel Reactivated")
					}
					
				} else {
					// Connection is KO
					//alert("Activation Error.\nPlease try again later!");
					await blockAccess("Reactivate: Activation Error. No connection.");

                    await errorDialog("connection");

                    // showError("connection")
				}
			}
			
		} else {
			// Connection is KO
			//alert("Activation Error.\nPlease try again later!");
			await blockAccess("Reactivate: No Connection.");

            await errorDialog("connection");

            // showError("connection")
		}

	/*
	} else {
		//User says no
		blockAccess("cancel");
	}
	*/
}
 
export async function sendOnlineRequest(action, serial, license) {

    let doAction;

  let newAction = action === undefined ? "ck" : action;
  let newSerial = serial === undefined ? defSerial : serial;
  let newLicense = license === undefined ? defLicense : license;

  switch (newAction) {
		case "ac":
			doAction = "activate_license";
			break;
		case "ck":
			doAction = "check_license";
			break;
		case "kl":
			doAction = "deactivate_license";
			break;
		case "vs":
			doAction = "get_version";
			break;
	}

    // console.log(newAction, newLicense, newSerial, doAction)

  const newRequest = `${eddDomain}?edd_action=${doAction}&item_id=${eddItemID}&license=${newSerial}&url=${newLicense}`;

  //const newRequest = setApiUrl(newAction, newSerial, newLicense);

//   console.log(newRequest);

  try {
    let response = await fetch(newRequest, {
      method: 'post'/*,
      body: data*/
    });

    //console.log(response);
  
    if (!response.ok) {
      throw new Error(`HTTP error fetching weather station; status: ${response.status}`);
    }

    let resJson = await response.json();
    // console.log(resJson)
  } catch (err) {
    // console.log(err.stack)
  }
}


async function reAactivateHere() {
    const modalContent = getHtml("#modal-reactive")

    showModal(modalContent.innerHTML);

    const modal = document.querySelector("#modal")

    // const mainLogo = getHtml("#modal-logo")

    // modal.querySelector(".image").innerHTML = mainLogo.innerHTML;

    const closeButton = modal.querySelector(".close")

    const cancelButton = modal.querySelector("#modal-btn-ko");

    const okButton = modal.querySelector("#modal-btn-ok");

    const serialInput = modal.querySelector("#serial-number");

    closeButton.addEventListener("click", async () => {
        await hideModal();
    })

    cancelButton.addEventListener("click", async () => {
        await hideModal();
    })   
    
    okButton.addEventListener("click", async () => {
        
        await reActivate();

        
    })      


}

async function askForSerial() {

    try {
    const modalContent = getHtml("#modal-serial")

    showModal(modalContent.innerHTML);

    // console.log("Modal Content", modalContent.innerHTML);

    const modal = document.querySelector("#modal")

    // const mainLogo = getHtml("#modal-logo")

    // modal.querySelector(".image").innerHTML = mainLogo.innerHTML;    

    // const closeButton = modal.querySelector(".close")

    // const cancelButton = modal.querySelector("#modal-btn-ko");

    const okButton = modal.querySelector("#modal-btn-ok");

    const serialInput = modal.querySelector("#serial-number");

    // closeButton.addEventListener("click", async () => {
    //     await hideModal();
    // })

    // cancelButton.addEventListener("click", async () => {
    //     await hideModal();
    // })   
    
    okButton.addEventListener("click", async () => {
        // console.log("CIAO", serialInput.value);
        await serialCheck(serialInput.value);
    })

} catch(e) {
    console.log(e)
}

}

async function showError(error) {

    // console.log("Show Error", error)

    let dismissButton, tryButton;

    const modalContent = getHtml("#modal-error");

    const modalButton = getHtml("#modal-button").querySelector(".button");

    showModal(modalContent.innerHTML);

    const modal = document.querySelector("#modal")

    // const mainLogo = getHtml("#modal-logo")

    // modal.querySelector(".image").innerHTML = mainLogo.innerHTML;      

    const closeButton = modal.querySelector(".close");

    const buttonsArea = modal.querySelector(".buttons");

    // const cancelButton = modal.querySelector("#modal-btn-ko");

    // const dismissButton = modal.querySelector("#modal-btn-dis");

    // cancelButton.innerHTML = getLangText("btnCancel")

    // const okButton = modal.querySelector("#modal-btn-ok");

    // okButton.innerHTML = getLangText("btnOk")

    const serialInput = modal.querySelector("#modal-number");

    const description = modal.querySelector(".description");

    switch(error) {
        case "activation":
            // cancelButton.remove();
            description.innerHTML = getLangText("error activation text")
            dismissButton = modalButton.cloneNode();
            dismissButton.innerHTML = getLangText("button dismiss");
            buttonsArea.appendChild(dismissButton);
            break;
        case "connection":
            // cancelButton.remove();            
            description.innerHTML = getLangText("error connection text")
            dismissButton = modalButton.cloneNode();
            dismissButton.innerHTML = getLangText("button dismiss");
            buttonsArea.appendChild(dismissButton);
            break;
        case "invalid":
            // cancelButton.remove();
            description.innerHTML = getLangText("error invalid text");
            dismissButton = modalButton.cloneNode();
            tryButton = modalButton.cloneNode();
            tryButton.classList.add("ok");
            tryButton.innerHTML = getLangText("button serial try");
            dismissButton.innerHTML = getLangText("button dismiss");
            buttonsArea.appendChild(tryButton)
            buttonsArea.appendChild(dismissButton);
            break;
        case "disabled":
            // cancelButton.remove();
            description.innerHTML = getLangText("error disabled text");
            dismissButton = modalButton.cloneNode();
            dismissButton.innerHTML = getLangText("button dismiss");
            buttonsArea.appendChild(dismissButton);
            break;
    }

    try {
        closeButton.addEventListener("click", async () => {
            hideModal();
        })  
    } catch(e) {}


    try {
        tryButton.addEventListener("click", async () => {
            askForSerial();
        })
    } catch(e) {}
    
    try {
        dismissButton.addEventListener("click", async () => {
            hideModal();
        })
    } catch(e) {}

}



async function initStart() {

    console.log("Init Start"); 

    // Check if local data sre present
    const initData = await checkLocalData();

    // console.log("Is Local Data ok?", initData);

    if (initData) {

        // Reads local data
        const getData = await readLocalData();

        // console.log("I dati ci sono, li leggo", getData)

        // Check if time is too much
        const elapsedTime = checkElapsedTime(getData.time)

        if (elapsedTime) {

            // Time since last check is LESS than the fixed interval
            console.log("Time is OK")

            await allowAccess();

        } else {

            // Time since last check is MORE than the fixed interval
            console.log("Time is up!")

            
            if ((getData.checks + 1) < maxChecks) {
                // Number of check cycles is LESS than allowed
                // console.log(`GRACE PERIOD\nI'll try to check but it's ok and it will be for ${(maxChecks - getData.checks -1)} other times!`);

                var onlineData = await readLicense(getData.serial, getData.license)

                await updateLocalData();

                if (onlineData !== false) {

					// Connection is OK
					if (onlineData.license == "valid" || ( onlineData.license == "expired" && keepWorking ) ) {

						// Local Serial License == Online Serial License
						// console.log("Your License is valid, you're allowed to run the panel!");

						// Reset check time and number of check cycles (set to 0)
						await updateLocalData(true);

                        
						// getVersion();

						// Allow panel to run
						await allowAccess();


					} else {
						// console.log("Your License is NOT valid, you need a new activation!");

						storedOnlineData = onlineData;

						storedUserSerial = getData.serial;

						await deleteLocalData();

                        addCover();

						//alert("This happens");

						// Local Serial License != Online Serial License
						if (onlineData.license == "inactive") {
							// Online serial has not been activated
							// (weird, since there is local files with that license, can be a fake)
							await blockAccess("Init Check: License Invalid");

                            document.querySelector(".license-button").addEventListener("click", async () => {

                                await serialDialog();
                        
                            });

                            // askForSerial();
						}

						if (onlineData.license == "site_inactive") {
							// Online Serial is registered to another License
							// Needs reset to run.
							//alert("Another site");
							await blockAccess("Init Check: Reactivate License");

                            document.querySelector(".license-button").addEventListener("click", async () => {

                                await reActivate();
                        
                            });                            

                            // reAactivateHere();
						}

                        

						//alert(requestOk);
						//resetMultiData();

					}


                } else {


					// Connection is KO
					// console.log("Connection Error, but still in grace period, you can run.");

					await allowAccess();




                }

            } else {

                await deleteLocalData();

                await blockAccess("Thou shall NOT pass!");

            }            

        }



    } else {

        console.log("No Local Data");

        await blockAccess("Init Check: Error in Local Data");

        addCover();

        document.querySelector(".license-button").addEventListener("click", async () => {

            await serialDialog();
    
        });

        // askForSerial();

    }

}

addCss();

doDo(); 

// initStart();