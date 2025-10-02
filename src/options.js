const {
    setLanguage
} = require("./lang");

const {
    setActiveSection
} = require("./menu");

const { entrypoints } = require("uxp");

let panelOptions = window.localStorage;

const defaultOptions = {
    activeLanguage: "autolang",
    activeSection: "page2",
    autoRefresh: false,
    matchColors: ["2b2b2b","575757","808080","ababab","d6d6d6"],
    matchSamples: 7,
    storedSamples: 0,
    matchHue: 0,
    matchSaturation: 0,
    matchBrightness: 0,
    clipProtection: true,
    clipRange: 100,
    correctionLayer: false,
    skinTones: false,
    skinProtection: 50,
    openSets: [],
} 

export async function initOptions() {

    console.log("Options Init");

    setLanguage(getOption("activeLanguage"));

    setActiveSamples(getOption("matchSamples"));

    // setOpenSets();

    // setActiveSection(getOption("activeSection"));


}

// Set an Option
export function setOption(name, value) {

    try {

        panelOptions.setItem(name, JSON.stringify(value))

    } catch(e) {

        console.log("Error Setting Option", e)

    }

}

// Get an Option
// If the option is not found, the default value is used.
export function getOption(name) {

    try {

        let myOption = JSON.parse(panelOptions.getItem(name));

        if (myOption === null) {

            myOption = defaultOptions[name];

        };

        return myOption;

    } catch(e) {

        console.log("Error Getting Option", e)

    }

}

export function getDefaultOption(name) {

    return defaultOptions[name];

}

// Removes an Option from the memory
// The default value will get used on the next call to getOption
export function resetOption(name) {

    panelOptions.removeItem(name)

}

// Clears all options from the memory
export function clearOptions() {

    panelOptions.clear();

}


// Set a Default value
export function setDefaultValue(name, value) {
    try {

        let dV = getOption("defaultValues");

        dV[name] = value;

        setOption("defaultValues", dV);
        
    } catch(e) {

        console.log("Error Setting Deault Value", e)

    }

}

// Gets a Default Value
export function getDefaultValue(name) {

    try {

        let dV = getOption("defaultValues");

        return dV[name];

    } catch(e) {

        console.log("Error Getting Default Value", e)

    }

}

// Resets a Default Value
export function resetDefaultValue(name) {

    try {

        let dV = getOption("defaultValues");

        dV[name] = defaultOptions.defaultValues[name];

        console.log("Resetting Default Value", name, dV[name], defaultOptions.defaultValues[name]);

        setOption("defaultValues", dV);

    } catch(e) {

        console.log("Error Resetting Default Value", e)

    }

}

function setOpenSets() {

    const openSets = getOption("openSets");

    console.log("Open Sets", openSets);

    if (openSets.length > 0) {

        document.querySelectorAll("section").forEach((section, index) => {

            if (openSets.includes(index)) {

                section.classList.add("open");

            } else {

                section.classList.remove("open");

            }

        });

    }

}

export function getOpenSets() {

    const openSets = [];

    document.querySelectorAll("section").forEach((section, index) => {

        if (section.classList.contains("open")) {

            openSets.push(index);

        }

    });

    setOption("openSets", openSets);

};

export function setActiveSamples(number) {

    try {

        setOption("matchSamples", parseInt(number));

        const { menuItems } = entrypoints.getPanel("main");

        menuItems.getItem("2").checked = false;
        menuItems.getItem("3").checked = false;
        menuItems.getItem("5").checked = false;
        menuItems.getItem("7").checked = false;

        menuItems.getItem(number).checked = true;

    } catch(e) {

        console.log("Error Setting Active Samples", e)
        
    }

}