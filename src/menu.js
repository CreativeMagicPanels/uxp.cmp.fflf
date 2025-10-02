const { entrypoints } = require("uxp");

const {
    setLanguage,
    getLangText
} = require("./lang");

const {
    setOption,
    clearOptions,
    getDefaultValue,
    setDefaultValue,
    resetDefaultValue,
    setActiveSamples
} = require("./options");

const shell=require("uxp").shell;

// const {
//     buildToolSet
// } = require("./tools");

export function initMenu() {
    try {
        console.log("Menu Init");

        entrypoints.setup({
            panels: {
                main: {
                    show(event) { },
                    menuItems: [
                        // by default all items are enabled and unchecked
                        { id: "name", label: "First Frame, Last Frame", enabled: false },
                        { id: "reload", label: "Reload Panel"},
                        { id: "sp346794", label: "-" },
                        {
                            id: "langs", label: "Languages", submenu:
                                [
                                    { id: "en_GB", label: "English" },
                                    { id: "de_DE", label: "Deutsch"},
                                    { id: "fr_FR", label: "Français"},
                                    { id: "it_IT", label: "Italiano" },
                                    { id: "es_ES", label: "Español"},
                                    { id: "pt_BR", label: "Português"},
                                    { id: "hi_IN", label: "हिन्दी"},
                                    { id: "sp65276", label: "-" }, // SPACER
                                    { id: "autolang", label: "Auto", checked: true },
                                    { id: "spacer0240476094769350799839", label: "-" }, // SPACER
                                    { id: "lang-error", label: getLangText("menu lang error")},                                    
                                ]
                        },
                        { id: "samples", label: "Image Samples", submenu:
                            [
                                { id: "2", label: "2 (more quick)", checked: false },
                                { id: "3", label: "3", checked: false },
                                { id: "5", label: "5", checked: false },
                                { id: "7", label: "7 (more precise)", checked: false },
                            ]
                        },

                        { id: "sp98374983", label: "-" }, // SPACER 
                        // { id: "defaults", label: "Default Values"},
                        { id: "reset", label: "Reset Options"},
                    ],
                    invokeMenu(id) {
                        // console.log("Clicked menu with ID", id);
                        // Storing the menu items array
                        const { menuItems } = entrypoints.getPanel("main");
                        switch (id) {
                            case "en_GB":
                            case "it_IT":
                            case "fr_FR":
                            case "de_DE":
                            case "es_ES":
                            case "pt_BR":
                            case "hi_IN":
                            case "autolang":
                                setOption("activeLanguage", id);
                                window.location.reload();
                                break;
                            case "lang-error":
                                const link = getLanguageErrorLink();
                                console.log("LANGUAGE ERROR LINK", link);
                                shell.openExternal(link);
                                break;                                
                            case "2":
                            case "3":
                            case "5":
                            case "7":
                                setActiveSamples(id);
                                break;
                            case "reload":
                                window.location.reload()
                                break;
                            case "about":
                                showAbout();
                                break;
                            case "reset":
                                clearOptions();
                                window.location.reload()
                                break;
                        }
                    }
                }
            }
        })

    } catch (e) {
        console.log(e);
    }

}

export function setCompactMode(trueOrFalse) {

    const { menuItems } = entrypoints.getPanel("main");

    menuItems.getItem("compact").checked = trueOrFalse;

    if (trueOrFalse) {
        document.querySelector("body").classList.add("compact");
    } else {
        document.querySelector("body").classList.remove("compact");
    }

    setOption("compactMode", trueOrFalse);
}

export function showTools(trueOrFalse) {

    // console.log("Show Section Tools:", trueOrFalse)
    
    const { menuItems } = entrypoints.getPanel("main");

    menuItems.getItem("tools").checked = trueOrFalse;

    document.querySelectorAll(".tools").forEach((tools) => {

        if (trueOrFalse) {
            tools.classList.remove("hide");
        } else {
            tools.classList.add("hide");
        }

    });

    setOption("showTools", trueOrFalse);
}

export function setStickyTools(trueOrFalse) {

    const { menuItems } = entrypoints.getPanel("main");

    menuItems.getItem("toolsticky").checked = trueOrFalse;

    document.querySelectorAll(".tools.inside").forEach((tools) => {

        tools.remove();

    });

    buildToolSet(trueOrFalse);

    setOption("stickyTools", trueOrFalse);

}

export function setActiveSection(thisSection) {

    const pagesNumber = 6;

    const { menuItems } = entrypoints.getPanel("main");

    if (!menuItems.getItem(thisSection).enabled) return;


    // console.log("Set Active Selection:", thisSection);



    setOption("activeSection", thisSection);

    

    for (let i = 1; i < pagesNumber + 1; i++) {
        menuItems.getItem(`page${i}`).checked = false;
        document.querySelector("header").classList.remove(`page${i}`);
    }

    menuItems.getItem(thisSection).checked = true;

    document.querySelectorAll(".tab").forEach((tab) => {

        tab.classList.remove("active");

        if (tab.getAttribute("data-section") === thisSection) {

            tab.classList.add("active");

        }

    });

    document.querySelectorAll(".tools").forEach((tools) => {

        tools.classList.remove("active");

        if (tools.getAttribute("data-section") === thisSection) {

            tools.classList.add("active");

        }

    });    

    document.querySelectorAll("section").forEach((section) => {

        section.classList.remove("active");

        if (section.id === thisSection) {

            section.classList.add("active");

        }

    });

    // document.querySelector("header").classList.add(thisSection);

    // document.querySelector("header").querySelector(".text").innerHTML = getLangText(thisSection).toUpperCase();
    // document.querySelector("header").querySelector(".prefix").innerHTML = getLangText("player").toUpperCase();

}

export async function showDefaults() {

    try{

        const dialogID = document.getElementById("default-values");

        dialogID.querySelectorAll(".default-value").forEach((input) => {

            input.value = getDefaultValue(input.getAttribute("data-item"));

        });

        dialogID.querySelectorAll(".icon.reset").forEach((resetButton) => {
                
            resetButton.addEventListener("click", () => {

                const thisItem = resetButton.getAttribute("data-item");

                resetDefaultValue(thisItem);

                dialogID.querySelectorAll(".default-value").forEach((input) => {

                    if (input.getAttribute("data-item") === thisItem) {
                        input.value = getDefaultValue(thisItem);
                    }

                    // input.value = getDefaultValue(input.getAttribute("data-item"));
        
                });                

                // dialogID.querySelector(thisItem).value = getDefaultValue(thisItem);
            })
    
        });

        dialogID.querySelector("#defaults-ok").addEventListener("click", () => {
            dialogID.close("saveValues")
        })
        
        dialogID.querySelector("#defaults-ko").addEventListener("click", () => {
            dialogID.close("reasonCanceled")
        })

        let getRes = await dialogID.uxpShowModal({
            title: getLangText("dialog defaults title"),
            resize:"none",// "both","none", "horizontal"???, "vertical"???,
            size:{
                width:350,
                height:300
            }
        })

        // console.log(getRes);
        
        if (!getRes || getRes === "reasonCanceled") {
            console.log("Nope")

            return;
        } else if (getRes === "saveValues") {

            dialogID.querySelectorAll(".default-value").forEach((input) => {

                setDefaultValue(input.getAttribute("data-item"), parseFloat(input.value));

            });

            // setDefaultValue("fsProBlur", dialogID.querySelector("#defaults-freqSepPro").value)

        }

    } catch(e) {
        console.log(e)
    }

}

async function showAbout() {

    try {

        let getRes = await document.getElementById("about").uxpShowModal({
            title: getLangText("dialog about title"),
            resize: "none",// "both","none", "horizontal"???, "vertical"???,
            size: {
                width: 300,
                height: 450
            }
        })

    } catch (e) {

        console.log(e);

    }

}