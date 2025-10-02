const { app } = require("photoshop");

const { executeAsModal, performMenuCommand } = require("photoshop").core;

const { batchPlay, psAction } = require("photoshop").action;

import { processCode } from "./process";

export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min, max) {
    return Math.random() * (max - min + 1) + min;
}

export async function batchThis(commands) {
    await executeAsModal(async () => {
        //console.log(commands)

        try { await batchPlay(commands, {}) }
        catch (e) { console.log(`ERRORE in batchThis: ${e}`) }

    }, { "commandName": "Action Commands" })
}

export async function menuThis(ID) {
    await executeAsModal(async () => {
        //console.log(ID)

        try { await performMenuCommand({commandID: ID}) }
        catch (e) { console.log(`ERRORE in menuThis: ${e}`) }

    }, { "commandName": "Action Commands" })
}

export async function getMenuStatus(ID) {

    try {

        return await batchReturn([
            {
                _obj: 'uiInfo',
                _target: {
                _ref: 'application',
                _enum: 'ordinal',
                _value: 'targetEnum',
                },
                command: 'getCommandEnabled',
                commandID: ID,
            }
        ]);

    } catch(e) {

        console.log("Error in getMenuStatus", e);

    }

}

export async function batchReturn(commands) {
    let myValue;

    await executeAsModal(async () => {
        //console.log(commands)

        try { myValue = await batchPlay(commands, {}) }
        catch (e) { console.log(`ERRORE in batchReturn: ${e}`) }

    }, { "commandName": "Action Commands" })

    return myValue
}

export async function batchHistory(commands, name) {
    await executeAsModal(async (executionContext) => {
        let hostControl = executionContext.hostControl;
        let documentID = app.activeDocument._id;

        let suspensionID = await hostControl.suspendHistory({
            "documentID": documentID,
            "name": name
        });

        // console.log(commands);

        try { await batchPlay(commands, {}) }
        catch (e) { console.log(`ERRORE in batchHistory: ${e}`) }

        await hostControl.resumeHistory(suspensionID, true);
    }, { "commandName": name })

    console.log(`Run ${name}`);
}

export async function historyThis(callback, name) {

    await executeAsModal(async (executionContext) => {

        let hostControl = executionContext.hostControl;
        let documentID = app.activeDocument._id;

        let suspensionID = await hostControl.suspendHistory({
            "documentID": documentID,
            "name": name
        });

        try {

            await callback()

        } catch (e) {

            console.log("ERRORE in historyThis:", e)
            
        }

        await hostControl.resumeHistory(suspensionID, true);

    }, { "commandName": name })

    console.log(`Run ${name}`);

}

export function showMessage(message, time) {
    // console.log("BOH")

    const timeOut = time || 1000;

    document.querySelector("#message").classList.add("active");
    document.querySelector("#message .text").innerHTML = message;

    setTimeout(() => {
        document.querySelector("#message").classList.remove("active");
        document.querySelector("#message .text").innerHTML = "";

    }, timeOut) 

}

export function showModal(content) {

    document.querySelector("body").classList.add("modal-open");

    const modal = document.querySelector("#modal")

    modal.classList.add("active");

    modal.innerHTML = "<div class='content'>" + content + "</div>"

}

export function hideModal() {
    document.querySelector("body").classList.remove("modal-open");

    const modal = document.querySelector("#modal")

    modal.classList.remove("active");
}

export async function pickColor(options = {}) {
    const {title, color} = options;

    let myCololor;

    if (color === undefined) {
        myCololor = new app.SolidColor;
    } else {
        myCololor = color;
    }

    // console.log(title, color)

    let command = {
        _obj: "showColorPicker",
        application: {
          _class: "null"
        },
        value: true,
        color: {
            _obj: 'RGBColor',
            red:myCololor.rgb.red,
            green: myCololor.rgb.green,
            blue: myCololor.rgb.blue,
          },
        dontRecord: true,
        forceNotify: true,
      }

    command.context = title;

    try {
        let newColor = new app.SolidColor;

        const result = await batchReturn([command]);

        if (result[0].value !== false ) {
            newColor.rgb.red = result[0].RGBFloatColor.red
            newColor.rgb.green = result[0].RGBFloatColor.grain
            newColor.rgb.blue = result[0].RGBFloatColor.blue
    
            return newColor
        } else {
            return false
        }


    } catch(e) {
        console.log("Error Picking Color", e)
    }
    
}

export async function getTheme() {
    const result = await batchPlay(
    [
      {
          "_obj": "get",
          "_target": [
            {
                "_property": "kuiBrightnessLevel"
            },
            {
                "_ref": "application",
                "_enum": "ordinal",
                "_value": "targetEnum"
            }
          ],
          "_options": {
            "dialogOptions": "dontDisplay"
          }
      }
    ],{
      "synchronousExecution": false,
    });
    const pinned = result[0].kuiBrightnessLevel._value;
    
    if (pinned == "kPanelBrightnessDarkGray" || pinned == "kPanelBrightnessMediumGray"){
      return "dark"
    }
    if (pinned == "kPanelBrightnessLightGray" || pinned == "kPanelBrightnessOriginal"){
      return "light"
    }
}

export async function setTheme(theme) {

    let themeValue

    switch (theme) {

        case 'lightest':
            themeValue = "kPanelBrightnessOriginal";
            break;

        case "light":
            themeValue = "kPanelBrightnessLightGray";
            break;

        case "dark":
            themeValue = "kPanelBrightnessMediumGray";
            break;

        case "darkest":
            themeValue = "kPanelBrightnessDarkGray";
            break;

    }

    try {
        // console.log("Setting Theme", theme);

        const command = [
            {
                "_obj": "set",
                "_target": [{ "_property": "interfacePrefs", "_ref": "property" }, { "_ref": "application" }],
                "to": { "_obj": "interfacePrefs", "kuiBrightnessLevel": { "_enum": "uiBrightnessLevelEnumType", "_value": themeValue } }
            }
        ];
        
        await batchThis(command);


    } catch(e) {

        console.log("Error Setting Theme", e);

    }

}

export function getTemplate(itemSelector, templateSelector = "#templates") {

    const templatesMain = document.querySelector(templateSelector);

    const itemHtml = templatesMain.querySelector(itemSelector);

    return itemHtml

}

export function getHtml(selector) {

    try{

        const templateContent = document.querySelector(selector);

        // replaceLanguageText(templateContent)

        return templateContent;

    } catch(e) {
        console.log(e)
    }

}

export function cloneObject(obj) {

    return JSON.parse(JSON.stringify(obj))

}

export function createTag(tag, props, ...children) {
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

export async function getConfirmation(title, message) {
    try{

        const dialogID = document.getElementById("confirm");

        dialogID.querySelector(".text").innerHTML = message;

        dialogID.querySelector("#confirm-ok").addEventListener("click", () => {
            dialogID.close("confirmOk")
        })
        
        dialogID.querySelector("#confirm-ko").addEventListener("click", () => {
            dialogID.close("confirmKo")
        })

        let getRes = await dialogID.uxpShowModal({
            title: title,
            resize:"none",// "both","none", "horizontal"???, "vertical"???,
            size:{
                width:350,
                height:300
            }
        })

        // console.log(getRes);
        
        if (!getRes || getRes === "confirmKo") {
            // console.log("Nope")

            return false;
        } else if (getRes === "confirmOk") {

            return true

        }

    } catch(e) {
        console.log(e)
    }

}

export function layerExistsByName(name) {
    return Boolean(app.activeDocument?.layers?.some(layer => layer.name === name))
}

// From Commons

export async function dummyMerge(groupName) {
    // let psAction = require("photoshop").action;

    // let mainGroup, dummyLayer;

    // if (groupName !== undefined) {

    //     mainGroup = await app.activeDocument.createLayerGroup({name: groupName});

    // }

    // dummyLayer = await app.activeDocument.layers.add();

    // dummyLayer.bringToFront();

    const make = [{"_obj":"make","_target":[{"_ref":"layer"}]}];

    const move = [{"_obj":"move","_target":[{"_enum":"ordinal","_ref":"layer"}],"to":{"_enum":"ordinal","_ref":"layer","_value":"front"}}];

    const merge = [{"_obj":"mergeVisible","duplicate":true}];


    const commands = [
        // {"_obj":"make","_target":[{"_ref":"layer"}]},
        // {"_obj":"move","_target":[{"_enum":"ordinal","_ref":"layer"}],"to":{"_enum":"ordinal","_ref":"layer","_value":"front"}},
        {"_obj":"mergeVisible","duplicate":true}
    ]

    await psAction.batchPlay(make, {});

    try {
        await psAction.batchPlay(move, {});
    } catch(e) {
        console.log(e);
    }

    await psAction.batchPlay(merge, {});

    //return {group: mainGroup, layer: dummyLayer};

    console.log("MERGE VISIBLE DONE");

}

export async function frontLayerOld(layerName = "Dummy", deleteIt = false) {

    // console.log("FRONT DUMMY", layerName, deleteIt);

    const commands = [
        {"_obj":"make","_target":[{"_ref":"layer"}],"using":{"_obj":"layer","name":layerName}},
        {"_obj":"move","_target":[{"_enum":"ordinal","_ref":"layer"}],"to":{"_enum":"ordinal","_ref":"layer","_value":"front"}},
        {"_obj":"move","_target":[{"_enum":"ordinal","_ref":"layer"}],"to":{"_enum":"ordinal","_ref":"layer","_value":"front"}},
        {"_obj":"move","_target":[{"_enum":"ordinal","_ref":"layer"}],"to":{"_enum":"ordinal","_ref":"layer","_value":"front"}},
        {"_obj":"move","_target":[{"_enum":"ordinal","_ref":"layer"}],"to":{"_enum":"ordinal","_ref":"layer","_value":"front"}},
        {"_obj":"move","_target":[{"_enum":"ordinal","_ref":"layer"}],"to":{"_enum":"ordinal","_ref":"layer","_value":"front"}},
        {"_obj":"mergeVisible","duplicate":true},
    ]

    const deleteMe = [{"_obj":"delete","_target":[{"_enum":"ordinal","_ref":"layer"}]}]

    await fireCommands(commands);

    if (deleteIt) {
        await psAction.batchPlay(deleteMe, {});
    }

}

export async function frontLayer(layerName = "Dummy", deleteIt = false) {

    // console.log("FRONT DUMMY", layerName, deleteIt);

    const commands = [
        {"_obj":"make","_target":[{"_ref":"layer"}],"using":{"_obj":"layer","name":layerName}},
        {"_obj":"move","_target":[{"_enum":"ordinal","_ref":"layer"}],"to":{"_enum":"ordinal","_ref":"layer","_value":"front"}},
        {"_obj":"move","_target":[{"_enum":"ordinal","_ref":"layer"}],"to":{"_enum":"ordinal","_ref":"layer","_value":"front"}},
        {"_obj":"move","_target":[{"_enum":"ordinal","_ref":"layer"}],"to":{"_enum":"ordinal","_ref":"layer","_value":"front"}},
        {"_obj":"move","_target":[{"_enum":"ordinal","_ref":"layer"}],"to":{"_enum":"ordinal","_ref":"layer","_value":"front"}},
        {"_obj":"move","_target":[{"_enum":"ordinal","_ref":"layer"}],"to":{"_enum":"ordinal","_ref":"layer","_value":"front"}},
        {"_obj":"mergeVisible","duplicate":true},
    ]

    const deleteMe = [{"_obj":"delete","_target":[{"_enum":"ordinal","_ref":"layer"}]}]

    await fireCommands(commands);

    if (deleteIt) {
        await batchPlay(deleteMe, {});
    }

}

export async function getDocumentById(id) {

    const documents = app.documents;

    for (let i = 0; i < documents.length; i++) {

        if (documents[i].id === id) {

            return documents[i];

        }

    }

    return null;

}

export async function selectLayerById(id) {
    
        const select = [{"_obj":"select","_target":[{"_ref":"layer","_id":id}],"makeVisible":false}];
    
        // await fireCommands(select);

        await batchThis(select);
    
}

export async function selectLayerByName(name) {

    const select = [{"_obj":"select","_target":[{"_name":name,"_ref":"layer"}],"makeVisible":false}];

    // await fireCommands(select);

    await batchThis(select);

}


export async function makeSmart() {

    const make = [{"_obj":"newPlacedLayer"}];

    await fireCommands(make);

}


export async function deleteLayer(layerName) {

    const deleteMe = [{"_obj":"delete","_target":[{"_name":layerName,"_ref":"layer"}]}]

    await batchThis(deleteMe);

    // await fireCommands(deleteMe);

}

export async function resetColors() {

    const reset = [{"_obj":"reset","_target":[{"_property":"colors","_ref":"color"}]}];

    await fireCommands(reset);
}

export async function fireCommands(commands) {

    // let psAction = require("photoshop").action;

    commands.forEach(async (command, index) => {

        try {

            await batchPlay([commands[index]], {});

        } catch(e) {
            console.log("Error", index, command, e);
        }   
        
    })

    console.log("ALL COMMANDS FIRED");

}

export function checkChannel(name) {

    const channels = app.activeDocument.channels;

    for (let i = 0; i < channels.length; i++) {

        if (channels[i].name.includes(name)) {

            return true

        }

    }

    return false

}

export function checkLayer(name) {

    const layers = app.activeDocument.layers;

    for (let i = 0; i < layers.length; i++) {

        if (layers[i].name.includes(name)) {

            return true

        }

    }

    return false

}

export function checkSelection() {

    return (app.activeDocument.selection.bounds !== null)

}

export async function getExt({item = undefined, folder = "./templates/", ext = ".html"} = {}) {

    if (item === undefined) return false;

    const fullPath =  folder + item + ext;

    return await (await fetch(fullPath)).text();

}

export async function getDialog(template) {

    const dialogID = "dialog-" + template;

    if (document.getElementById(dialogID)) {

        return document.getElementById(dialogID);

    }

    let dialog = createTag("dialog");

    dialog.id = dialogID;

    const dialogContent = await getExt({item: template});

    dialog.innerHTML = dialogContent;

    processCode(dialog, true);

    document.appendChild(dialog);

    return dialog;

}