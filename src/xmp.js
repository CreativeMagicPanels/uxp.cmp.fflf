const uxp = require("uxp");

const { app } = require("photoshop");

const { executeAsModal } = require("photoshop").core;

let customNamespace = "http://creativemagicpanel.store/pencilcase/";

let customPrefix = "pcase";

const thisVersion = uxp.versions.uxp;

let minVersion = "uxp-7.2";

let isEnabled, checkDocumentProperty, checkLayerProperty, setDocumentProperty, getDocumentProperty, getLayerProperty, setLayerProperty, deleteDocumentProperty, deleteLayerProperty;

// If the UXP version is lower than this defined version, the functions will not be operational
if( thisVersion.localeCompare(minVersion, undefined, { numeric: true, sensitivity: 'base' }) < 0) {

// console.log("XMP KO")

    isEnabled = function() { return false }

    setDocumentProperty = async (propertyName, propertyValue) => {

        console.log("XMP not available in this version");

    }

    getDocumentProperty = async (propertyName) => {

        console.log("XMP not available in this version");

    }

    setLayerProperty = async (propertyName, propertyValue) => {

        console.log("XMP not available in this version");

    }

    getLayerProperty = async (propertyName) => {

        console.log("XMP not available in this version");

    }

    deleteDocumentProperty = async (propertyName) => {

        console.log("XMP not available in this version");

    }

    deleteLayerProperty = async (propertyName) => {

        console.log("XMP not available in this version");

    }

    checkDocumentProperty = async (propertyName) => {

        console.log("XMP not available in this version");

    }

    checkLayerProperty = async (propertyName) => {

        console.log("XMP not available in this version");

    }

} else {
    
// console.log("XMP OK")

isEnabled = function() { return true }


const {
    XMPConst,
    XMPMeta,
    XMPUtils,
    XMPDateTime,
    XMPFile
} = uxp.xmp

require("./xmpMetadata")

/* XMP READ */

//Read and return XMP from Document
async function getXMPfromActiveDocument() {

    let xmpMeta;

    try {

        xmpMeta = new XMPMeta(app.activeDocument.xmpMetadata.rawData);

        XMPMeta.registerNamespace(customNamespace, customPrefix);

        // console.log("XMP Metadata found", xmpMeta);

    } catch (error) {

        console.log("Error Reading XMP from Active Document", error);

        return false

    }

    return xmpMeta

}

//Read and return XMP from Layer (or create one if not present) 
async function getXMPfromActiveLayer() {

    if (app.activeDocument.activeLayers.length === 1) {
        
        if (!app.activeDocument.activeLayers[0].isBackgroundLayer) {

            let xmpMeta;

            try {

                xmpMeta = new XMPMeta(app.activeDocument.activeLayers[0].xmpMetadata.rawData);

                // console.log("XMP Metadata found in Layer");

            } catch (error) {

                xmpMeta = new XMPMeta();


            }

            XMPMeta.registerNamespace(customNamespace, customPrefix);

            return xmpMeta

        } else {

            console.log("No XMP available in Background Layer!");

            return false

        }

    } else {

        console.log("Select only one Layer!");

        return false

    }

}

/* Property READ & WRITE */

async function checkXMPProperty(xmpMeta, propertyName) {

    if (xmpMeta.doesPropertyExist(customNamespace, propertyName)) {

        return true

    } else {

        return false

    }

}

//Read XMP Property with Existence Check
async function getXMPProperty(xmpMeta, propertyName) {

    if (xmpMeta.doesPropertyExist(customNamespace, propertyName)) {

        const myProperty = xmpMeta.getProperty(customNamespace, propertyName);

        return JSON.parse(myProperty.value);

    } else {

        console.log(`Property ${propertyName} does not exist`);

        return false

    }

}

async function deleteXMPProperty(xmpMeta, propertyName) {

    if (xmpMeta.doesPropertyExist(customNamespace, propertyName)) {

        await xmpMeta.deleteProperty(customNamespace, propertyName);

    } else {

        console.log(`Error deleting property ${propertyName}`, error);

        return false

    }

}



// Write XMP Property
async function setXMPProperty(xmpMeta, propertyName, propertyValue) {

    try {

        await xmpMeta.setProperty(customNamespace, propertyName, JSON.stringify(propertyValue));

    } catch (error) {

        console.log(error);

    }

}

/* XMP WRITE */

// Writing XMP into Document
async function setXMPintoActiveDocument(xmpMeta) {

    await executeAsModal(async () => {

        app.activeDocument.xmpMetadata.rawData = xmpMeta.serialize();

    }, { commandName: "Setting XMP..." })

}

// Writing XMP into Layer
async function setXMPintoActiveLayer(xmpMeta) {

    if (app.activeDocument.activeLayers.length === 1) {
        
        if (!app.activeDocument.activeLayers[0].isBackgroundLayer) {    

            await executeAsModal(async () => {

                app.activeDocument.activeLayers[0].xmpMetadata = xmpMeta;
        
            }, { commandName: "Setting XMP..." })

        } else {

            console.log("Tring to set XMP into Background layer!");

        }

    } else {

        console.log("Tring to set XMP into multiple layers!");

    }

}

setDocumentProperty = async (propertyName, propertyValue) => {

    try {

        const xmpMeta = await getXMPfromActiveDocument();

        await setXMPProperty(xmpMeta, propertyName, propertyValue);

        await setXMPintoActiveDocument(xmpMeta);

    } catch (error) {

        console.log(error);

    }

}

setLayerProperty = async (propertyName, propertyValue) => {

    try {

        const xmpMeta = await getXMPfromActiveLayer();

        await setXMPProperty(xmpMeta, propertyName, propertyValue);

        await setXMPintoActiveLayer(xmpMeta);

    } catch (error) {

        console.log(error);

    }

}


getDocumentProperty = async (propertyName) => {

    try {

        const xmpMeta = await getXMPfromActiveDocument();

        const xmpProp = await getXMPProperty(xmpMeta, propertyName);

        if (xmpProp) {

            // console.log("Property Value in Document", xmpProp);

            return xmpProp

        } else {

            return false

        }

    } catch (error) {

        console.log(error);

    }

}

getLayerProperty = async (propertyName) => {

    try {

        const xmpMeta = await getXMPfromActiveLayer();

        const xmpProp = await getXMPProperty(xmpMeta, propertyName);

        if (xmpProp) {

            // console.log("Property Value in Layer", xmpProp);

            return xmpProp

        } else {

            return false

        }

    } catch (error) {

        console.log(error);

    }

}


deleteDocumentProperty = async (propertyName) => {

    try {

        const xmpMeta = await getXMPfromActiveDocument();

        await deleteXMPProperty(xmpMeta, propertyName);

        await setXMPintoActiveDocument(xmpMeta);

    } catch (error) {

        console.log(error);

    }

}

deleteLayerProperty = async (propertyName) => {

    try {

        const xmpMeta = await getXMPfromActiveLayer();

        await deleteXMPProperty(xmpMeta, propertyName);

        await setXMPintoActiveLayer(xmpMeta);

    } catch (error) {

        console.log(error);

    }

}


checkDocumentProperty = async (propertyName) => {

    try {

        const xmpMeta = await getXMPfromActiveDocument();

        return await checkXMPProperty(xmpMeta, propertyName);

    } catch (error) {

        console.log(error);

    }

}

checkLayerProperty = async (propertyName) => {

    try {

        const xmpMeta = await getXMPfromActiveLayer();

        return await checkXMPProperty(xmpMeta, propertyName);

    } catch (error) {

        console.log(error);

    }

}


// End of if statement
}

export const XMP = {
    isEnabled: isEnabled,
    setDocumentProperty: setDocumentProperty,
    getDocumentProperty: getDocumentProperty,
    getLayerProperty: getLayerProperty,
    setLayerProperty: setLayerProperty,
    deleteDocumentProperty: deleteDocumentProperty,
    deleteLayerProperty: deleteLayerProperty,
    checkDocumentProperty: checkDocumentProperty,
    checkLayerProperty: checkLayerProperty
}