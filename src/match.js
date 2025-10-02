import { render } from "react-dom/cjs/react-dom.production.min";

const { imaging, app, constants } = require("photoshop");

let layerKind = require('photoshop').constants.LayerKind;

const { localFileSystem } = require('uxp').storage;

const { executeAsModal } = require("photoshop").core;



const { doDo } = require("./license");

// function doDo() {

//     return false;

// }

const {
    getOption,
    setOption,
} = require("./options");

const {
    historyThis,
    batchThis,
    pickColor,
    getTemplate,
    batchReturn,
    getConfirmation,
    showMessage,
    selectLayerByName,
    selectLayerById,
    frontLayer,
    deleteLayer,
    createTag,
    checkChannel,
    checkLayer,
    getDocumentById
} = require("./functions");

const {
    getLangText
} = require("./lang");

const {
    XMP
} = require('./xmp');

let matchAvailable = false;

const matchLayerName = "Color Match Pro";

export async function initMatch() {

    setupInterface();

}

console.log("Match Ready!")

/*

// When a Layer is Selected in Photoshop
require("photoshop").action.addNotificationListener(['select'], async (e,d) => {

    // If it's a Match Layer
    if (matchLayerActive()) {

        console.log("Match Layer Selected");

        document.querySelector("#match-opacity").value = parseInt(app.activeDocument.activeLayers[0].opacity);

        // If XMP is enabled
        if (XMP.isEnabled()) {

            // console.log("XMP Enabled");

            const settings = await XMP.getLayerProperty("settings")

            // console.log("Settings", settings);

            await setMatchSettings(settings);

        }

    } else {

        console.log("Match Layer Not Selected");

    }
    
        // // console.log(e,d);

        // const thisLayer = app.activeDocument.activeLayers[0];
    
        // if (d._target[0]._ref === "layer" && thisLayer.name.includes(matchLayerName) && thisLayer.kind === layerKind.CURVES) {

        //     if (XMP.isEnabled()) {

        //         setOption("matchColors", await XMP.getLayerProperty("origin"));

        //         await setHSBValues();

        //         renderColorPickers();

        //     }
    
        //     console.log("Match Layer Selected");
    
        // }
});

require("photoshop").action.addNotificationListener(['set'], async (e,d) => {

    if (matchLayerActive()) {

        if (d.to.opacity !== undefined) document.querySelector("#match-opacity").value = parseInt(d.to.opacity._value);

        // console.log(e,d);

        // console.log(d.to.opacity);



    }

});

*/


// Checks if the Active Layer is the Match Layer
function matchLayerActive() {

    if (app.activeDocument === null || app.activeDocument.activeLayers.length === 0) return false;

    const thisLayer = app.activeDocument.activeLayers[0];

    return thisLayer.name.includes(matchLayerName) && thisLayer.kind === layerKind.CURVES;

}

// Groups the Match Properties in a single object for Storing
async function getMatchSettings(withTarget) {

    try {

        withTarget = withTarget || false;

        const matchColors = getOption("matchColors");

        const matchHue = getOption("matchHue");

        const matchSaturation = getOption("matchSaturation");

        const matchBrightness = getOption("matchBrightness");

        const skinTones = getOption("skinTones");

        let settings = {
            colors: matchColors,
            samples: matchColors.length,
            skin: skinTones,
            hsb: {
                h: matchHue,
                s: matchSaturation,
                b: matchBrightness
            }
        }

        if (withTarget) {

            settings.target = withTarget;

        }

        return settings;

    } catch (error) {

        console.log(error)

    }

}


async function setMatchSettings(settings) {

    try {

        // console.log("Color Changed?", (JSON.stringify(settings.colors) !== JSON.stringify(settings.original)));

        // if (JSON.stringify(settings.colors) !== JSON.stringify(settings.original)) {

        //     matchReset = true;

        // } else {

        //     matchReset = false;

        // }

        setOption("matchColors", settings.colors);

        setOption("matchHue", settings.hsb.h);

        setOption("matchSaturation", settings.hsb.s);

        setOption("matchBrightness", settings.hsb.b);

        setOption("skinTones", settings.skin);

        if (getOption("autoRefresh")) await setupInterface();

    } catch (error) {

        console.log(error)

    }

}

async function setupInterface() {

    setCorrectionSliders();

    await renderColorPickersPro();

}

// Sets the Correction Sliders to the values stored in the Options
function setCorrectionSliders() {

    const hue = getOption("matchHue");

    const saturation = getOption("matchSaturation");

    const brightness = getOption("matchBrightness");

    if (hue !== 0 || saturation !== 0 || brightness !== 0) {

        document.querySelector("#colors-wrapper").querySelector(".icons").classList.remove("hide");

        document.querySelector("#correction-reset").classList.remove("hide");

    } else {

        document.querySelector("#colors-wrapper").querySelector(".icons").classList.add("hide");

        document.querySelector("#correction-reset").classList.add("hide");

    }    

    document.querySelector("#correct-hue").value = hue;

    document.querySelector("#correct-saturation").value = saturation;

    document.querySelector("#correct-brightness").value = brightness;

}

// Sets the Match Colors to the Colors in the Active Layer
async function renderColorPickersPro() {

    // Get the Match Colors
    const matchColors = getOption("matchColors");

    const pickers = document.querySelector("#color-palette");

    pickers.innerHTML = "";

    if (matchLayerActive()) {

        if (XMP.isEnabled()) {

            const settings = await XMP.getLayerProperty("settings");

            // console.log("Settings", settings);

            if (JSON.stringify(settings.colors) === JSON.stringify(settings.original) || matchColors.length === 0) {

                document.querySelector("#colors-reset").classList.add("hide");

            } else {

                document.querySelector("#colors-reset").classList.remove("hide");

            }

        }

    }

    // If there are no colors, the Match is not available
    if (matchColors.length === 0) {

        matchAvailable = false;

        // Create an Empty Picker
        const emptyPicker = createTag("div", {class:"empty"});

        const emptyText = getLangText("colors empty");

        emptyPicker.innerHTML = emptyText;

        document.querySelector("#colors-wrapper").querySelector(".icons").classList.add("hide")

        pickers.appendChild(emptyPicker);

        document.querySelector("#colormatch").classList.remove("full");

        document.querySelectorAll(".button.set").forEach((button) => {

            button.classList.add("disabled");

        });
        
        return;

    } else {

        matchAvailable = true;

        document.querySelector("#colormatch").classList.add("full");

        document.querySelectorAll(".button.set").forEach((button) => {

            button.classList.remove("disabled");

        });

        matchColors.forEach((color, index) => {

            const myPicker = createTag("div", {class:"action picker", "color-id":index});

            const inner = createTag("div", {class:"inner"});

            inner.style.setProperty("backgroundColor", "#" + matchColors[index]);

            const processed = createTag("div", {class:"processed"});

            processed.style.setProperty("backgroundColor", "#" + processColorHex(matchColors[index]));

            inner.appendChild(processed);

            myPicker.appendChild(inner);

            myPicker.addEventListener("click", async (e) => {

                try {

                    const colorId = e.currentTarget.getAttribute("color-id");

                    const startingColor = matchColors[colorId];

                    let pickOptions = {
                        title: getLangText("title match color"),
                    }

                    // Pick

                    if (startingColor !== "false") {
                        let thisColor = new app.SolidColor;

                        thisColor.rgb.hexValue = startingColor;

                        pickOptions.color = thisColor
                    }

                    const newColor = await pickColor(pickOptions);

                    if (newColor !== false) {

                        matchColors[colorId] = newColor.rgb.hexValue;

                        setOption("matchColors", matchColors);

                        await updateColorsPro();

                        await renderColorPickersPro();

                    }

                } catch (error) {

                    console.log(error)

                }

            });

            pickers.appendChild(myPicker);


        });

    }

}









// Checks the first pixel that has no alpha (is 100% opaque) and returns the color in it
function findFlatColor(myPixels) {

    let alphaSize, colorSize;

    const myBits = app.activeDocument.bitsPerChannel;

    if (myBits === constants.BitsPerChannelType.EIGHT) {

        alphaSize = 255;

        colorSize = 1;

    
    
    } else if (myBits === constants.BitsPerChannelType.SIXTEEN) {

        alphaSize = 32767;

        colorSize = 128;

    }

    // console.log("Lunghezza", myPixels.length);

    for (let i = 0; i < myPixels.length; i += 4) {

        
        const alpha = myPixels[i + 3];
        
        // if (i < 120) console.log(parseInt(myPixels[i]), myPixels[i + 1], myPixels[i + 2], alpha);
        // console.log(alpha);
        
        if (alpha >= alphaSize) {

            let flatColor = new app.SolidColor;
            flatColor.rgb.red = myPixels[i] / colorSize;
            flatColor.rgb.green = myPixels[i + 1] / colorSize;
            flatColor.rgb.blue = myPixels[i + 2] / colorSize;

            return flatColor;

        };

    }

}

// Grabs a smaller version of the pixels in the active layer and returns the color of it
async function getMatchColor() {

    const doc = app.activeDocument;
    
    const psImage = await imaging.getPixels({
        documentID: doc.id,
        layerID: doc.activeLayers[0].id,
        targetSize: {width: 500, height: 500},
    });//{targetSize: {width: 1, height: 1}});

    const psImageData = psImage.imageData;

    // console.log("Component Size", psImageData.componentSize);

    const pixelsArray = await psImageData.getData();

    // console.log(pixelsArray);

    const flatColor = findFlatColor(pixelsArray);

    psImageData.dispose();

    return flatColor;

}


// Sostituito da versione Pro
// Eliminare dopo check
export function renderColorPickers() {

    console.log("Render Color Pickers");

    const matchColors = getOption("matchColors");

    const matchHue = getOption("matchHue");
    
    const matchSaturation = getOption("matchSaturation");

    const matchBrightness = getOption("matchBrightness");

    // console.log("Hue", matchHue, "Saturation", matchSaturation, "Brightness", matchBrightness);

    // if (matchHue !== 0 || matchSaturation !== 0 || matchBrightness !== 0) {

    //     document.querySelector("#match").classList.add("correction");

    // } else {

    //     document.querySelector("#match").classList.remove("correction");

    // }

    if (matchColors.length === 0) {

        matchAvailable = false;

        const emptyPicker = createTag("div", {class:"empty"});

        const emptyText = getLangText("colors empty");

        emptyPicker.innerHTML = emptyText;

        document.querySelector("#colors-wrapper").querySelector(".icons").classList.add("hide")

        document.querySelector("#color-palette").innerHTML = "";

        document.querySelector("#color-palette").appendChild(emptyPicker);

        document.querySelector("#colormatch").classList.remove("full");

        // document.querySelector("#sample").classList.remove("full");

        document.querySelectorAll(".button.set").forEach((button) => {

            button.classList.add("disabled");

        });
        
        return;

    } else {
        
        matchAvailable = true;

        document.querySelector("#colormatch").classList.add("full");

        // document.querySelector("#sample").classList.add("full");        

        document.querySelectorAll(".button.set").forEach((button) => {

            button.classList.remove("disabled");

        });

    }

    const colorsItems = document.querySelector("#colors-items");

    const target = document.querySelector("#color-palette");

    target.innerHTML = "";

    const thisHue = getOption("matchHue");

    const thisSaturation = getOption("matchSaturation");

    const thisBrightness = getOption("matchBrightness");

    console.log(thisHue, thisSaturation, thisBrightness);

    if (thisHue !== 0 || thisSaturation !== 0 || thisBrightness !== 0) {

        document.querySelector("#colors-wrapper").querySelector(".icons").classList.remove("hide")

    } else {

        document.querySelector("#colors-wrapper").querySelector(".icons").classList.add("hide")

    }

    matchColors.forEach((color, index) => {

        const myPicker = createTag("div", {class:"action picker", "color-id":index});

        const inner = createTag("div", {class:"inner"});

        inner.style.setProperty("backgroundColor", "#" + matchColors[index]);

        const processed = createTag("div", {class:"processed"});

        processed.style.setProperty("backgroundColor", "#" + processColorHex(matchColors[index]));

        inner.appendChild(processed);

        myPicker.appendChild(inner);
        
        myPicker.addEventListener("click", async (e) => {

            try {

            const colorId = e.currentTarget.getAttribute("color-id");

            const startingColor = matchColors[colorId];

            let pickOptions = {
                title: getLangText("title match color"),
            }
        
            // Pick

            if (startingColor !== "false") {
                let thisColor = new app.SolidColor;
        
                thisColor.rgb.hexValue = startingColor;
        
                pickOptions.color = thisColor
            }            
        
            const newColor = await pickColor(pickOptions);
        
            if (newColor !== false ) {

                matchColors[colorId] = newColor.rgb.hexValue;

                setOption("matchColors", matchColors);

                renderColorPickers();

            }
            
        } catch (error) {

            console.log(error)

        }

        });

        target.appendChild(myPicker);




        // const newPicker = colorsItems.querySelector(".picker").cloneNode(true);

        // newPicker.setAttribute("color-id", index);

        // newPicker.style.setProperty("backgroundColor", "#" + matchColors[index]);

        // newPicker.querySelector(".inner").style.setProperty("backgroundColor", "#" + matchColors[index]);

        // newPicker.querySelector(".processed").style.setProperty("backgroundColor", "#" + processColorHex(matchColors[index]));

        // newPicker.addEventListener("click", async (e) => {

        //     try {

        //     const colorId = e.currentTarget.getAttribute("color-id");

        //     const startingColor = matchColors[colorId];

        //     let pickOptions = {
        //         title: getLangText("title match color"),
        //     }
        
        //     // Pick

        //     if (startingColor !== "false") {
        //         let thisColor = new app.SolidColor;
        
        //         thisColor.rgb.hexValue = startingColor;
        
        //         pickOptions.color = thisColor
        //     }            
        
        //     const newColor = await pickColor(pickOptions);
        
        //     if (newColor !== false ) {

        //         matchColors[colorId] = newColor.rgb.hexValue;

        //         setOption("matchColors", matchColors);

        //         renderColorPickers();

        //     }
            
        // } catch (error) {

        //     console.log(error)

        // }

        // });

        // target.appendChild(newPicker);

    });

}

// Separates the spectrum in intervals for creating selections based on the number of colors to sample
function getColorIntervals(n) {

    const intervals = [];

    const interval = 255 / (n);

    for (let i = 1; i <= n; i++) {

        intervals.push(Math.round(interval * i));

    }

    console.log(intervals);

    return intervals;

}

async function getOriginColorsPro(full = false) {

    try {

        const colors  = getOption("matchSamples");

        const originColors = await getImageColorsPro(colors, full);

        console.log("Origin Colors", originColors);

        if (originColors === false) {

            // If the full option is active, delete the dummy layer
            // if (full) await deleteLayer("Color Match Dummy");

            return;

        };

        const matchColors = [];

        for (let i = 0; i < originColors.length; i++) {

            matchColors.push(originColors[i].rgb.hexValue);

        }

        setOption("matchColors", matchColors);

        // await setupInterface();

    } catch (error) {

        console.log(error)

    }

}

// Converts an array of Hex colors to SolidColors
function hexToSolid(myColors) {

    let colors = [].concat(myColors || []);

    const solidColors = [];

    for (let i = 0; i < colors.length; i++) {

        const color = new app.SolidColor;

        color.rgb.hexValue = colors[i];

        solidColors.push(color);

    }

    return solidColors;

}

// Converts an array of SolidColors to Hex colors
function solidToHex(myColors) {

    let colors = [].concat(myColors || []);

    const hexColors = [];

    for (let i = 0; i < colors.length; i++) {

        hexColors.push(colors[i].rgb.hexValue);

    }

    return hexColors;

}


function protectClip(value) {

    return value;

    const clipTop = 240;

    const clipBottom = 15;

    const hasProtection = getOption("clipProtection");

    if (hasProtection) {

        if (value > clipTop) value = clipTop;

        if (value < clipBottom) value = clipBottom;

    }

    return value;

}

function processColorHex(color) {

    const hue = getOption("matchHue");

    const saturation = getOption("matchSaturation");

    const brightness = getOption("matchBrightness");

    let newColor = new app.SolidColor;

    newColor.rgb.hexValue = color;

    let newHue = newColor.hsb.hue + hue;
    newHue = ((newHue % 359) + 359) % 359;

    let newSaturation = newColor.hsb.saturation + saturation;
    if (newSaturation > 100) newSaturation = 100;
    if (newSaturation < 0) newSaturation = 0;

    let newBrightness = newColor.hsb.brightness + brightness;
    if (newBrightness > 100) newBrightness = 100;
    if (newBrightness < 0) newBrightness = 0;

    newColor.hsb.hue = newHue;

    newColor.hsb.saturation = newSaturation;

    newColor.hsb.brightness = newBrightness;

    return newColor.rgb.hexValue;

}

function processColors(colors) {

    // if the option to create a correction layer is active the processed colors are the same as the original colors
    if (getOption("correctionLayer")) return colors;

    let processed = []

    const hue = getOption("matchHue");;

    const saturation = getOption("matchSaturation");

    const brightness = getOption("matchBrightness");

    for (let i = 0; i < colors.length; i++) {

        let newColor = new app.SolidColor;

        newColor.rgb.hexValue = colors[i].rgb.hexValue;

        // console.log("Origin Color", newColor.rgb.hexValue);

        let newHue = newColor.hsb.hue + hue;
        newHue = ((newHue % 359) + 359) % 359;

        let newSaturation = newColor.hsb.saturation + saturation;
        if (newSaturation > 100) newSaturation = 100;
        if (newSaturation < 0) newSaturation = 0;
    
        let newBrightness = newColor.hsb.brightness + brightness;
        if (newBrightness > 100) newBrightness = 100;
        if (newBrightness < 0) newBrightness = 0;

        // newColor.hsb.hue = colors[i].hsb.hue + hue;

        newColor.hsb.hue = newHue;

        newColor.hsb.saturation = newSaturation;

        newColor.hsb.brightness = newBrightness;

        // console.log("Processed Color", newColor.rgb.hexValue, newColor.rgb.red, newColor.rgb.green, newColor.rgb.blue);

        processed[i] = newColor;

    }

    // console.log(processed);

    return processed;

}

function normalizeCurve(curve) {

    if (!getOption("clipProtection")) return;

    curve.forEach((point, index) => {

        /* for each point of the curve if the vertical value is higher or lower then the intersection point betwqeen the vertical values of the points that are before and after it, then the vertical value of the point is set to the intersection point */  

        const prevPoint = curve[index - 1];

        const nextPoint = curve[index + 1];

        // if (prevPoint) {

        //     const deltaX = point.horizontal - prevPoint.horizontal;

        //     if (point.horizontal - prevPoint.horizontal < 10) {

        //         point.horizontal = prevPoint.horizontal + 10;

        //     }

        // }

        // if (nextPoint) {

        //     if (nextPoint.horizontal - point.horizontal < 10) {

        //         point.horizontal = nextPoint.horizontal - 10;

        //     }

        // }

        if (prevPoint && nextPoint) {

            let deltaX = (nextPoint.horizontal - prevPoint.horizontal) / 2;

            let deltaY = (prevPoint.vertical + nextPoint.vertical) / 2;

            const range = (5 + 45 * getOption("clipRange")/100)/100;

            if (point.horizontal - prevPoint.horizontal < deltaX * range) {

                point.horizontal = prevPoint.horizontal + deltaX * range;

            }

            if (nextPoint.horizontal - point.horizontal < deltaX * range) {

                point.horizontal = nextPoint.horizontal - deltaX * range;

            }

            if (point.vertical > deltaY + deltaY * range) {

                point.vertical = deltaY + deltaY * range;

            }

            if (point.vertical < deltaY - deltaY * range) {

                point.vertical = deltaY - deltaY * range;

            }

        }

    });

}

async function setCorrectionLayer(full) {

    if (!getOption("correctionLayer")) return;

    const newHue = getOption("matchHue");

    const newSaturation = getOption("matchSaturation");

    const newBrightness = getOption("matchBrightness");
    
    const skinTones = getOption("skinTones");

    if (skinTones) await loadSkinSelection();

    const correctionLayer = [
        {
            "_obj": "make", "_target": [{ "_ref": "adjustmentLayer" }], "using": {
                "_obj": "adjustmentLayer", "name": "Color Adjustment", "mode": { "_enum": "blendMode", "_value": "color" }, "group": !full, "type": {
                    "_obj": "hueSaturation", "adjustment": [
                        { "_obj": "hueSatAdjustmentV2", "hue": newHue, "lightness": newBrightness, "saturation": newSaturation }
                    ],
                    "colorize": false,
                    "presetKind": { "_enum": "presetKindType", "_value": "presetKindCustom" }
                }
            }
        },
    ]

    await batchThis(correctionLayer);

    if (skinTones) await lowerSkinMask(75);

}

async function createSkinSelection(full) {

    const skinSelection = [
        // {"_obj":"autoCutout","sampleAllLayers":full},
        {"_obj":"colorRange","colorModel":0,"colors":{"_enum":"colors","_value":"skinTone"},"fuzziness":100},
        {"_obj":"duplicate","_target":[{"_property":"selection","_ref":"channel"}],"name":"Skin Protect Selection"},
        {"_obj":"set","_target":[{"_property":"selection","_ref":"channel"}],"to":{"_enum":"ordinal","_value":"none"}},
        {"_obj":"select","_target":[{"_name":"Skin Protect Selection","_ref":"channel"}]},
        {"_obj":"invert"},
        {"_obj":"levels","adjustment":[{"_obj":"levelsAdjustment","channel":{"_enum":"ordinal","_ref":"channel"},"input":[50,150]}],"presetKind":{"_enum":"presetKindType","_value":"presetKindCustom"}},
        {"_obj":"select","_target":[{"_enum":"channel","_ref":"channel","_value":"RGB"}]}
    ];

    await batchThis(skinSelection);

}

async function loadSkinSelection() {

    const skinSelection = [
        {"_obj":"set","_target":[{"_property":"selection","_ref":"channel"}],"to":{"_name":"Skin Protect Selection","_ref":"channel"}},
    ];

    await batchThis(skinSelection);

}

async function lowerSkinMask(perc) {

    perc = perc || getOption("skinProtection");

    const skinSelection = [
        {"_obj":"set","_target":[{"_enum":"ordinal","_ref":"layer"}],"to":{"_obj":"layer","userMaskDensity":{"_unit":"percentUnit","_value":perc}}}
    ];

    await batchThis(skinSelection);

}

async function deleteSkinSelection() {

    const skinSelection = [
        {"_obj":"delete","_target":[{"_name":"Skin Protect Selection","_ref":"channel"}]}
    ];

    await batchThis(skinSelection);

}


// Check if needed
async function getCurveColors() {

    const command = [
        {
            _obj: "get",
            _target: [
                {
                    _property: "adjustment"
                },
                {
                    _ref: "layer",
                    _enum: "ordinal"
                }
            ],
            _options: {
                dialogOptions: "dontDisplay"
            }
        }
    ];

    const result = await batchReturn(command);

    const redCurve = result[0].adjustment[0].adjustment[0].curve;

    const greenCurve = result[0].adjustment[0].adjustment[1].curve;

    const blueCurve = result[0].adjustment[0].adjustment[2].curve;

    // console.log("Red Curve", redCurve);
    
    // console.log("Green Curve", greenCurve);

    // console.log("Blue Curve", blueCurve);

    let originColors = [];

    let targetColors = [];
    
    for (let i = 0; i < redCurve.length; i++) {

        let colorO = new app.SolidColor;
        let colorT = new app.SolidColor;

        colorO.rgb.red = redCurve[i].horizontal;
        colorT.rgb.red = redCurve[i].vertical;

        colorO.rgb.green = greenCurve[i].horizontal;
        colorT.rgb.green = greenCurve[i].vertical;

        colorO.rgb.blue = blueCurve[i].horizontal;
        colorT.rgb.blue = blueCurve[i].vertical;

        originColors.push(colorO);
        targetColors.push(colorT);

    }

    console.log("Origin Colors", originColors);

    console.log("Target Colors", targetColors);

}


async function getHSBValues() {

    const values = {
        h: getOption("matchHue"),
        s: getOption("matchSaturation"),
        b: getOption("matchBrightness")
    }

    console.log(values);

    return values;

}

async function setHSBValues() {

    try {

        const thisLayer = app.activeDocument.activeLayers[0];

        if (thisLayer.kind === layerKind.CURVES && thisLayer.name.includes(matchLayerName)) {

            const values = await XMP.getLayerProperty("hsb");

            setOption("matchHue", values.h);

            setOption("matchSaturation", values.s);

            setOption("matchBrightness", values.b);

            document.querySelector("#correct-hue").value = values.h;

            document.querySelector("#correct-saturation").value = values.s;

            document.querySelector("#correct-brightness").value = values.b;

        }

    } catch (error) {

        console.log(error)

    }

    
}

// Creates the Color Curve taking into account the origin and target colors and calculating the Correction
async function createColorCurves(originColors, targetColors) {

    const processedColors = processColors(originColors);

    // Create a curve array of object for each color
    let matchCurveRed = [];
    let matchCurveGreen = [];
    let matchCurveBlue = [];

    // Add the first point at 0,0
    matchCurveRed.push({ "_obj": "paint", "horizontal": 0.0, "vertical": 0.0 });
    matchCurveGreen.push({ "_obj": "paint", "horizontal": 0.0, "vertical": 0.0 });
    matchCurveBlue.push({ "_obj": "paint", "horizontal": 0.0, "vertical": 0.0 });

    // Add the points for each color
    for (let i = 0; i < originColors.length; i++) {
        matchCurveRed.push({ "_obj": "paint", "horizontal": targetColors[i].rgb.red, "vertical": processedColors[i].rgb.red});
        matchCurveGreen.push({ "_obj": "paint", "horizontal": targetColors[i].rgb.green, "vertical": processedColors[i].rgb.green});
        matchCurveBlue.push({ "_obj": "paint", "horizontal": targetColors[i].rgb.blue, "vertical": processedColors[i].rgb.blue});
    }

    // Add the last point at 255,255
    matchCurveRed.push({ "_obj": "paint", "horizontal": 255.0, "vertical": 255.0 });
    matchCurveGreen.push({ "_obj": "paint", "horizontal": 255.0, "vertical": 255.0 });
    matchCurveBlue.push({ "_obj": "paint", "horizontal": 255.0, "vertical": 255.0 });

    // Sort the curves by horizontal (original color) value
    matchCurveRed.sort((a, b) => a.horizontal - b.horizontal);
    matchCurveGreen.sort((a, b) => a.horizontal - b.horizontal);
    matchCurveBlue.sort((a, b) => a.horizontal - b.horizontal);

    // Normalize the curves so the points are not too close to each other and their values don't spike
    normalizeCurve(matchCurveRed);
    normalizeCurve(matchCurveGreen);
    normalizeCurve(matchCurveBlue);

    const curves = {
        red: matchCurveRed,
        green: matchCurveGreen,
        blue: matchCurveBlue
    }

    return curves;

}

async function setWhiteMask() {

    const whiteMask = [
        {"_obj":"select","_target":[{"_enum":"channel","_ref":"channel","_value":"mask"}],"makeVisible":false},
        {"_obj":"delete","_target":[{"_enum":"ordinal","_ref":"channel"}]},
        {"_obj":"make","at":{"_enum":"channel","_ref":"channel","_value":"mask"},"new":{"_class":"channel"},"using":{"_enum":"userMaskEnabled","_value":"revealAll"}},
    ];

    await batchThis(whiteMask);

}

async function setSkinMask() {

        const perc = await getOption("skinProtection");

        const skinMask = [
            {"_obj":"select","_target":[{"_enum":"channel","_ref":"channel","_value":"mask"}],"makeVisible":false},
            {"_obj":"delete","_target":[{"_enum":"ordinal","_ref":"channel"}]},
            {"_obj":"set","_target":[{"_property":"selection","_ref":"channel"}],"to":{"_name":"Skin Protect Selection","_ref":"channel"}},
            {"_obj":"make","at":{"_enum":"channel","_ref":"channel","_value":"mask"},"new":{"_class":"channel"},"using":{"_enum":"userMaskEnabled","_value":"revealSelection"}},
            {"_obj":"set","_target":[{"_enum":"ordinal","_ref":"layer"}],"to":{"_obj":"layer","userMaskDensity":{"_unit":"percentUnit","_value":perc}}}
        ];
        
        await batchThis(skinMask);
        
        console.log("Skin Protection", perc);

        app.activeDocument.selection.deselect();
}

async function updateSkinMask() {

    try {

        if (matchLayerActive()) {

            if (getOption("skinTones") && checkChannel("Skin Protect Selection")) {

                console.log("Updating Skin Mask");

                await setSkinMask();

            } else {

                console.log("Setting White Mask");
                    
                await setWhiteMask();

            }

        }

    } catch (error) {

        console.log(error)

    }



}


async function updateColorsPro() {

    try {

        if (matchLayerActive()) {

            console.log("Updating Colors");
    
            // If XMP is enabled
            if (XMP.isEnabled()) {
    
                // console.log("XMP Enabled");
    
                const layerSettings = await XMP.getLayerProperty("settings")

                const newSettings = await getMatchSettings(layerSettings.target);

                if (newSettings.colors.length === 0) {

                    newSettings.colors = layerSettings.colors;

                }

                newSettings.original = layerSettings.original;

                // if (JSON.stringify(newSettings.colors) !== JSON.stringify(newSettings.original)) {

                //     matchReset = true;
        
                // } else {
        
                //     matchReset = false;
        
                // }                

                const originColors = hexToSolid(newSettings.colors);

                const targetColors = hexToSolid(newSettings.target);

                const myCurves = await createColorCurves(originColors, targetColors);
                
                // Create the color match adjustment layer using the assembled curves
                const matchCurve = [
                    {
                        "_obj": "set", "_target": [{ "_enum":"ordinal","_ref": "adjustmentLayer" }], "to": {
                            "_obj": "curves", "adjustment": [
                                { "_obj": "curvesAdjustment", "channel": { "_enum": "channel", "_ref": "channel", "_value": "red" }, "curve": myCurves.red },
                                { "_obj": "curvesAdjustment", "channel": { "_enum": "channel", "_ref": "channel", "_value": "grain" }, "curve": myCurves.green },
                                { "_obj": "curvesAdjustment", "channel": { "_enum": "channel", "_ref": "channel", "_value": "blue" }, "curve": myCurves.blue }
                                ], "presetKind": { "_enum": "presetKindType", "_value": "presetKindCustom" }
                        }
                    },
                ];

                await batchThis(matchCurve);
                
                await XMP.setLayerProperty("settings", newSettings);
                
            } else {

                return

            }

        }




        /*
        console.log("Updating Colors");

        let originColors, targetColors, myCurves;

        const thisLayer = app.activeDocument.activeLayers[0];

        if (thisLayer.kind === layerKind.CURVES && thisLayer.name.includes(matchLayerName)) {

            if (XMP.isEnabled()) {

                originColors = await XMP.getLayerProperty("origin");

                const solidOrigin = hexToSolid(originColors);

                // console.log("Origin Colors", originColors);

                targetColors = await XMP.getLayerProperty("target");

                const solidTarget = hexToSolid(targetColors);

                myCurves = await createColorCurves(solidOrigin, solidTarget);

                // Create the color match adjustment layer using the assembled curves
                const matchCurve = [
                    {
                        "_obj": "set", "_target": [{ "_enum":"ordinal","_ref": "adjustmentLayer" }], "to": {
                            "_obj": "curves", "adjustment": [
                                { "_obj": "curvesAdjustment", "channel": { "_enum": "channel", "_ref": "channel", "_value": "red" }, "curve": myCurves.red },
                                { "_obj": "curvesAdjustment", "channel": { "_enum": "channel", "_ref": "channel", "_value": "grain" }, "curve": myCurves.green },
                                { "_obj": "curvesAdjustment", "channel": { "_enum": "channel", "_ref": "channel", "_value": "blue" }, "curve": myCurves.blue }
                                ], "presetKind": { "_enum": "presetKindType", "_value": "presetKindCustom" }
                        }
                    },
                ];

                await batchThis(matchCurve);

            } else {

                return

            }

        } else if (thisLayer.kind === layerKind.HUESATURATION) {

            const hue = getOption("matchHue");

            const saturation = getOption("matchSaturation");

            const brightness = getOption("matchBrightness");

            const hueSat = [
                {
                    "_obj":"set","_target":[{"_enum":"ordinal","_ref":"adjustmentLayer"}],"to":{
                        "_obj":"hueSaturation","adjustment":[
                            {"_obj":"hueSatAdjustmentV2","hue":hue,"lightness":brightness,"saturation":saturation}
                        ],"presetKind":{"_enum":"presetKindType","_value":"presetKindCustom"}
                    }
                }
            ];

            await batchThis(hueSat);

        }
            */

    } catch (error) {

        console.log(error)

    }

}



async function setColorsPro(full = false) {

    try {

        // Get relevant options
        const skinTones = getOption("skinTones");

        const matchColors = getOption("matchColors");

        const doc = app.activeDocument;

        // If the full option is active get on top of everything
        if (full) await frontLayer(getLangText("layer matched")); //, true);
    
        const thisLayer = doc.activeLayers[0];
    
        // Check if the layer is a normal layer or a smart object
        if (thisLayer.kind !== layerKind.NORMAL && thisLayer.kind !== layerKind.SMARTOBJECT && !full) {
    
            // showMessage("Please select a normal layer to apply the color match");
            return;
    
        }

        // Create an array to store the origin colors
        const originColors = hexToSolid(matchColors);

        // Get the target colors from the image
        const targetColors = await getImageColorsPro(originColors.length, full);

        if (targetColors === false) {

            doc.selection.deselect();

            return;

        };
        
        // Before creating adjustment layer, create a selection of the skin tones, save it in a channel and load it so the mask is automatically added to the color match layer
        if (!checkChannel("Skin Protect Selection")) await createSkinSelection(full);

        if(skinTones) {
            await loadSkinSelection();
        }

        const myCurves = await createColorCurves(originColors, targetColors);

        // console.log("Curves", myCurves);

        // Create the color match adjustment layer using the assembled curves

        const layernameOriginal = getLangText("layer match") + " [ " + matchColors.length + " Samples ]";

        try {
            const matchCurve = [
                {
                    "_obj": "make", "_target": [{ "_ref": "adjustmentLayer" }], "using": {
                        "_obj": "adjustmentLayer","name": getLangText("layer matched"),"mode":{"_enum":"blendMode","_value":"color"},"group": !full,"type": {
                            "_obj": "curves", "adjustment": [
                                { "_obj": "curvesAdjustment", "channel": { "_enum": "channel", "_ref": "channel", "_value": "red" }, "curve": myCurves.red },
                                { "_obj": "curvesAdjustment", "channel": { "_enum": "channel", "_ref": "channel", "_value": "grain" }, "curve": myCurves.green },
                                { "_obj": "curvesAdjustment", "channel": { "_enum": "channel", "_ref": "channel", "_value": "blue" }, "curve": myCurves.blue }
                                ], "presetKind": { "_enum": "presetKindType", "_value": "presetKindCustom" }
                        }
                    }
                },
                {"_obj":"mergeLayersNew"}
            ];
        
            await batchThis(matchCurve);

        } catch (error) {

            console.log("Color Match Failed", error)

        }

        // console.log("Color Match Layer Created with Settings", await getMatchSettings(solidToHex(targetColors)));

        // If the XMP module is enabled, save the properties of the color match layer
        if (XMP.isEnabled()) {

/*             let settings = await getMatchSettings(solidToHex(targetColors));

            settings.original = matchColors;

            await XMP.setLayerProperty("settings", settings); */

            // Save the origin and target colors in the XMP metadata in HEX format
            // await XMP.setLayerProperty("hsb", await getHSBValues());
            // await XMP.setLayerProperty("origin", matchColors);
            // await XMP.setLayerProperty("target", solidToHex(targetColors));

        }

        // Lowers the mask of the skin tones selection so it doesn't affect the color match layer too much
        if (skinTones) await lowerSkinMask(50);

        // Create the correction layer
        await setCorrectionLayer(full);

        // If the skin tones selection is active, delete it    
        // if (skinTones) await deleteSkinSelection();

    } catch (error) {

        console.log(error)

    }

}




async function matchTest() {

    await getOriginColorsPro(true);

}


async function getImageColorsPro(colors, full = false) {

    let originLayer, startingLayer;

    // Get the active document
    const doc = app.activeDocument;

    // Get the ID of the active layer
    originLayer = doc.activeLayers[0].id;

    colors = colors || 3;

    try {

        // If the full option is active, create a dummy layer to work on
        if (full) await frontLayer("Color Match Samples Dummy");

        // Get the ID of the starting layer
        startingLayer = doc.activeLayers[0].id;

        // console.log("Original Layer", originLayer, "Starting Layer", startingLayer);

        // Get the color intervals to sample that depends on the number of colors
        const matchIntervals = getColorIntervals(colors);

        // Create an array to store the origin colors
        const originColors = [];

        // Loop through the intervals
        for (let i = 0; i < matchIntervals.length; i++) {

            // Create an array to store the commands
            const commands = [];

            if (i === 0) {

                // If it's the first interval, sample the shadows
                commands.push( {"_obj":"colorRange","colorModel":0,"colors":{"_enum":"colors","_value":"shadows"},"shadowsFuzziness":0,"shadowsUpperLimit":matchIntervals[i]} );

            } else if (i === matchIntervals.length - 1) {

                // If it's the last interval, sample the highlights
                commands.push( {"_obj":"colorRange","colorModel":0,"colors":{"_enum":"colors","_value":"highlights"},"highlightsFuzziness":0,"highlightsLowerLimit":matchIntervals[i - 1]} );

            } else {

                // If it's a mid interval, sample the midtones
                commands.push( {"_obj":"colorRange","colorModel":0,"colors":{"_enum":"colors","_value":"midtones"},"midtonesFuzziness":0,"midtonesLowerLimit":matchIntervals[i - 1],"midtonesUpperLimit":matchIntervals[i]} );

            }

            // Add the commands to copy the selection to a new layer, set the average value and remove the selection
            commands.push (
                {"_obj":"copyToLayer"},
                {"_obj":"set","_target":[{"_property":"selection","_ref":"channel"}],"to":{"_enum":"channel","_ref":"channel","_value":"transparencyEnum"}},
                {"_obj":"$Avrg"},
                {"_obj":"set","_target":[{"_property":"selection","_ref":"channel"}],"to":{"_enum":"ordinal","_value":"none"}}
            );

            console.log(commands);

            // Execute the command for the step to create the layer
            await batchThis(commands);

            // Get the color from the layer and adds it to the Sampled Color
            originColors.push(await getMatchColor());

            // Deletes the active layer (the one just created)
            doc.activeLayers[0].delete();

            // Selects the layer used to start the process
            await selectLayerById(startingLayer);

        }

        // If the full option is active, delete the dummy layer and select the original layer
        if (full) {

            await deleteLayer("Color Match Samples Dummy");

            await selectLayerById(originLayer);

        }

        console.log(originColors);

        // Return the origin colors
        return originColors;


    } catch (error) {

        if (full) {

            console.log(error)

            await deleteLayer("Color Match Samples Dummy");
    
            await selectLayerById(originLayer);
            
        } else {

            console.log("IT WAS NOT POSSIBLE TO GET THE COLORS FROM THE SELECTED LAYER, PLEASE CHECK THE LAYER AND TRY AGAIN MY DEAR");

        }

        doc.selection.deselect();

        return false;

    }

}


async function getMatch(full) {

    const matchIntervals = getColorIntervals(5);

    const doc = app.activeDocument;

    let originLayer, startingLayer;

    originLayer = doc.activeLayers[0].id;

    full = full || false;

    let highColor, midColor, darkColor;

    if (full) {
        await frontLayer("Color Match Dummy");
    }

    startingLayer = doc.activeLayers[0].id;

    const hCommands = [
        {"_obj":"colorRange","colorModel":0,"colors":{"_enum":"colors","_value":"highlights"},"highlightsFuzziness":20,"highlightsLowerLimit":190},
        {"_obj":"copyToLayer"},
        {"_obj":"set","_target":[{"_property":"selection","_ref":"channel"}],"to":{"_enum":"channel","_ref":"channel","_value":"transparencyEnum"}},
        {"_obj":"$Avrg"},
        {"_obj":"set","_target":[{"_property":"selection","_ref":"channel"}],"to":{"_enum":"ordinal","_value":"none"}},
    ];

    const mCommands = [
        {"_obj":"colorRange","colorModel":0,"colors":{"_enum":"colors","_value":"midtones"},"midtonesFuzziness":40,"midtonesLowerLimit":105,"midtonesUpperLimit":150},
        {"_obj":"copyToLayer"},
        {"_obj":"set","_target":[{"_property":"selection","_ref":"channel"}],"to":{"_enum":"channel","_ref":"channel","_value":"transparencyEnum"}},
        {"_obj":"$Avrg"},
        {"_obj":"set","_target":[{"_property":"selection","_ref":"channel"}],"to":{"_enum":"ordinal","_value":"none"}},
    ];
    
    const sCommands = [
        {"_obj":"colorRange","colorModel":0,"colors":{"_enum":"colors","_value":"shadows"},"shadowsFuzziness":20,"shadowsUpperLimit":65},
        {"_obj":"copyToLayer"},
        {"_obj":"set","_target":[{"_property":"selection","_ref":"channel"}],"to":{"_enum":"channel","_ref":"channel","_value":"transparencyEnum"}},
        {"_obj":"$Avrg"},
        {"_obj":"set","_target":[{"_property":"selection","_ref":"channel"}],"to":{"_enum":"ordinal","_value":"none"}},
    ]

    await batchThis(hCommands);

    highColor = await getMatchColor();

    doc.activeLayers[0].delete();

    await selectLayerById(startingLayer);

    await batchThis(mCommands);

    midColor = await getMatchColor();

    doc.activeLayers[0].delete();

    await selectLayerById(startingLayer);

    await batchThis(sCommands);

    darkColor = await getMatchColor();

    doc.activeLayers[0].delete();

    await selectLayerById(startingLayer);

    if (full) {
        
        doc.activeLayers[0].delete();

        await selectLayerById(originLayer);

    }

    console.log("High Color: ", highColor?.rgb.red, ", ", highColor?.rgb.green, ", ", highColor?.rgb.blue, "\nMid Color: ", midColor?.rgb.red, ", ", midColor?.rgb.green, ", ", midColor?.rgb.blue, "\nDark Color: ", darkColor?.rgb.red, ", ", darkColor?.rgb.green, ", ", darkColor?.rgb.blue);


    const matchCurve = [
        {
            "_obj": "make", "_target": [{ "_ref": "adjustmentLayer" }], "using": {
                "_obj": "adjustmentLayer","group":true, "type": {
                    "_obj": "curves", "adjustment": [
                        {
                            "_obj": "curvesAdjustment", "channel": { "_enum": "channel", "_ref": "channel", "_value": "red" }, "curve": [
                                { "_obj": "paint", "horizontal": 0.0, "vertical": 0.0 },
                                { "_obj": "paint", "horizontal": 64.0, "vertical": darkColor.rgb.red },
                                { "_obj": "paint", "horizontal": 128.0, "vertical": midColor.rgb.red },
                                { "_obj": "paint", "horizontal": 191.0, "vertical": highColor.rgb.red },
                                { "_obj": "paint", "horizontal": 255.0, "vertical": 255.0 }
                            ]
                        },
                        {
                            "_obj": "curvesAdjustment", "channel": { "_enum": "channel", "_ref": "channel", "_value": "grain" }, "curve": [
                                { "_obj": "paint", "horizontal": 0.0, "vertical": 0.0 },
                                { "_obj": "paint", "horizontal": 64.0, "vertical": darkColor.rgb.green },
                                { "_obj": "paint", "horizontal": 128.0, "vertical": midColor.rgb.green },
                                { "_obj": "paint", "horizontal": 191.0, "vertical": highColor.rgb.green },
                                { "_obj": "paint", "horizontal": 255.0, "vertical": 255.0 }
                            ]
                        },
                        {
                            "_obj": "curvesAdjustment", "channel": { "_enum": "channel", "_ref": "channel", "_value": "blue" }, "curve": [
                                { "_obj": "paint", "horizontal": 0.0, "vertical": 0.0 },
                                { "_obj": "paint", "horizontal": 64.0, "vertical": darkColor.rgb.blue },
                                { "_obj": "paint", "horizontal": 128.0, "vertical": midColor.rgb.blue },
                                { "_obj": "paint", "horizontal": 191.0, "vertical": highColor.rgb.blue },
                                { "_obj": "paint", "horizontal": 255.0, "vertical": 255.0 }
                            ]
                        }], "presetKind": { "_enum": "presetKindType", "_value": "presetKindCustom" }
                }
            }
        },

    ]

    await batchThis(matchCurve);

    const matchColors = [
        highColor.rgb.hexValue,
        midColor.rgb.hexValue,
        darkColor.rgb.hexValue
    ];

    setOption("matchColors", matchColors);

    renderColorPickers();

}

export async function doMatch(matching) {

    console.log(typeof matching.first, typeof matching.last, typeof matching.match);

    let firstFrame, lastFrame, matchTo;

    try {

    if (matching) {

        await executeAsModal(async (executionContext) => {

            if (doDo()) return

            if (typeof matching.first === "object") {

                console.log("Getting First Frame ID from file", matching.first);

                firstFrame = await getMatchingDocumentId(matching.first);

            } else if (typeof matching.first === "number") {

                firstFrame = matching.first;

            }

            if (typeof matching.last === "object") {

                lastFrame = await getMatchingDocumentId(matching.last);

            } else if (typeof matching.last === "number") {

                lastFrame = matching.last;

            }

            if (typeof matching.match === "object") {

                matchTo = await getMatchingDocumentId(matching.match);

            } else if (typeof matching.match === "string") {

                switch (matching.match) {

                    case "first":
                        matchTo = firstFrame;
                        break;

                    case "last":
                        matchTo = lastFrame;
                        break;

                }

            } else if (typeof matching.match === "number") {

                matchTo = matching.match;

            }

            console.log("First Frame ID:", firstFrame, "Last Frame ID:", lastFrame, "Match To ID:", matchTo);

            app.activeDocument = await getDocumentById(matchTo);
            
            await getOriginColorsPro(true);

            app.activeDocument = await getDocumentById(firstFrame);

            if (firstFrame !== matchTo) {

                await setColorsPro(true);

            }

            app.activeDocument = await getDocumentById(lastFrame);

            if (lastFrame !== matchTo && lastFrame !== firstFrame) {

                await setColorsPro(true);

            }

        }, { "commandName": getLangText("history matched") });

    }

    } catch (error) {
        
        console.log(error)

    }

}

async function getMatchingDocumentId(file) {

    // console.log("Getting Document ID for", file);

    if (!file) return null;

    await app.open(file);

    return app.activeDocument.id;

};




async function matchImage() {

    const openImage = await localFileSystem.getFileForOpening();

    if (openImage) {

        const oldDocument = app.activeDocument;

        const sourceDoc = await app.open(openImage);

        const fileName = sourceDoc.name;

        console.log('Source document opened:', fileName);

        // app.activeDocument = currentDoc;

        // await getOriginColors(colors, true);

        await getOriginColorsPro(true);

        await sourceDoc.closeWithoutSaving();      
        
        app.activeDocument = oldDocument;

    }

}



document.querySelector("#instamatch")?.addEventListener("click", async (e) => {


    await historyThis(async () => {

        if (doDo()) return

        try {

            await matchImage();

            await setColorsPro(true);

        } catch (error) {

            console.log(error)

        }

    }, "InstaMatch!");

})


// Sample colors from an external image
document.querySelector("#sample-image")?.addEventListener("click", async (e) => {

    await historyThis(async () => {

        if (doDo()) return

        try {

            await matchImage();

        } catch (error) {

            console.log(error)

        }

    }, "Get Match Colors [image]");

})

// Sample colors from the current document
document.querySelector("#sample-document")?.addEventListener("click", async (e) => {

    await historyThis(async () => {

        if (doDo()) return

        try {

            // await getMatch(true);

            // const colors = document.querySelector("#match-colors").value;

            // console.log(colors);

            // await getOriginColors(colors, true);

            await getOriginColorsPro(true);

        } catch (error) {

            console.log(error)

        }

    }, "Get Match Colors");

})

// Sample colors from the current layer
document.querySelector("#sample-layer")?.addEventListener("click", async (e) => {

    await historyThis(async () => {

        if (doDo()) return

        try {

            // const colors = document.querySelector("#colors-samples").value;

            // await getOriginColors(colors);

            await getOriginColorsPro();

        } catch (error) {

            console.log(error)

        }

    }, "Get Match Colors [Layer]");

})

// Set the colors of the current document
document.querySelector("#match-document")?.addEventListener("click", async (e) => {

    if (!matchAvailable) return;

    await historyThis(async () => {

        if (doDo()) return

        try {

            // await getMatch();

            await setColorsPro(true);


        } catch (error) {

            console.log(error)

        }

    }, "Set Match Colors");

})

// Set the colors of the current layer
document.querySelector("#match-test")?.addEventListener("click", async (e) => {

    console.log(hexToSolid("#ff0000"));
    
    // console.log(await XMP.getLayerProperty("hsb"));

    // await historyThis(async () => {

    //     if (doDo()) return

    //     try {

    //         // await getMatch();

    //         await getCurveColors();


    //     } catch (error) {

    //         console.log(error)

    //     }

    // }, "Test Match Colors [Layer]");

    // if (XMP.isEnabled() === false) return;

    // const hsb = await XMP.getLayerProperty("hsb");

    // console.log(hsb);

    // await XMP.setLayerProperty("hsb", await getHSBValues());    

})

document.querySelector("#match-opacity")?.addEventListener("change", async (e) => {

    if(matchLayerActive()) {

        const opacity = e.currentTarget.value;

        const matchOpacity = [
            {"_obj":"set","_target":[{"_enum":"ordinal","_ref":"layer"}],"to":{"_obj":"layer","opacity":opacity}}
        ];

        await batchThis(matchOpacity);

    }
    
});

// Set the colors of the current layer
document.querySelector("#match-layer")?.addEventListener("click", async (e) => {

    console.log(matchAvailable);

    if (!matchAvailable) return;

    await historyThis(async () => {

        if (doDo()) return

        try {

            // await getMatch();

            await setColorsPro();


        } catch (error) {

            console.log(error)

        }

    }, "Set Match Colors [Layer]");

})

// Choose the number of Color Samples
document.querySelector("#colors-samples")?.addEventListener("change", async (e) => {

    setOption("matchSamples", e.currentTarget.value);
    
});



// Clear the currentColor Samples
document.querySelector("#colors-clear")?.addEventListener("click", async (e) => {

    setOption("matchColors", []);
    
    await renderColorPickersPro();

});

document.querySelector("#colors-reset")?.addEventListener("click", async (e) => {

    if (matchLayerActive()) {

        // If XMP is enabled
        if (XMP.isEnabled()) {

            const layerSettings = await XMP.getLayerProperty("settings")

            setOption("matchColors", layerSettings.original);

            await updateColorsPro();

            await renderColorPickersPro();

        }

    }

});

// Set the correction value for the Hue
document.querySelector("#correct-hue")?.addEventListener("change", async (e) => {

    setOption("matchHue", e.currentTarget.value);

    await setupInterface();

    await updateColorsPro();

});

// Set the correction value for the Saturation
document.querySelector("#correct-saturation")?.addEventListener("change", async (e) => {

    setOption("matchSaturation", e.currentTarget.value);

    await setupInterface();

    await updateColorsPro();

});

// Set the correction value for the Brightness
document.querySelector("#correct-brightness")?.addEventListener("change", async (e) => {

    setOption("matchBrightness", e.currentTarget.value);

    await setupInterface();

    await updateColorsPro();

});

// Reset the correction values
document.querySelector("#correction-reset")?.addEventListener("click", async (e) => {

    setOption("matchHue", 0);

    document.querySelector("#correct-hue").value = 0;

    setOption("matchSaturation", 0);

    document.querySelector("#correct-saturation").value = 0;

    setOption("matchBrightness", 0);

    document.querySelector("#correct-brightness").value = 0;

    await setupInterface();

    await updateColorsPro();

});

document.querySelector("#match-skin")?.addEventListener("toggle", async (e) => {

    await updateSkinMask();

});

document.querySelector("#skin-protection")?.addEventListener("mouseup", async (e) => {

    setOption("skinProtection", e.currentTarget.value);

    await updateSkinMask();

});

// document.querySelector("#clip-range").addEventListener("change", async (e) => {

//     const range = e.currentTarget.value;

//     // document.querySelector("#match-brightness-value").innerHTML = brightness + "%";

//     setOption("clipRange", range);

//     // renderColorPickers();

// });

// document.querySelector("#clip-protect").addEventListener("click", async (e) => {

//     setOption("clipProtection", document.querySelector("#clip-protect").checked);

// });




document.querySelectorAll(".app-theme").forEach((button) => {

    button.addEventListener("click", async (e) => {

        document.querySelectorAll(".app-theme").forEach((button) => {

            button.classList.remove("active");

        });

        e.currentTarget.classList.add("active");

        const theme = e.currentTarget.getAttribute("theme");

        let themeValue;

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

        const command = [
            {"_obj":"set","_target":[{"_property":"interfacePrefs","_ref":"property"},{"_ref":"application"}],"to":{"_obj":"interfacePrefs","kuiBrightnessLevel":{"_enum":"uiBrightnessLevelEnumType","_value":themeValue}}}
        ];
        
        await batchThis(command);

    } catch (error) {

        console.log(error)

    }

    });

});