const { imaging, app, constants } = require("photoshop");

const { localFileSystem } = require('uxp').storage;

import { initOptions } from './options';

import { initMenu } from './menu';

import { getLangText, initLang } from './lang';

import { initUi } from './ui';

import { initMatch, doMatch } from './match';

// require('./listener');

initLang();

initMenu();

initOptions();

initUi();

let matching = {
    first: false,
    last: false,
    match: false
}

// initMatch();

document.querySelectorAll(".dropdown").forEach(item => {

    let myTimeout;

    item.addEventListener("click", (e) => {

        document.querySelectorAll(".dropdown").forEach(item => {

            item.classList.remove("open");

        });

        e.currentTarget.classList.add("open");

    });

    item.addEventListener("mouseenter", (e) => {

        clearTimeout(myTimeout);

    });
    

    item.addEventListener("mouseleave", (e) => {

        const target = e.currentTarget;
        
        myTimeout = setTimeout(() => {
            
        target.classList.remove("open");
        
        }, 350);

    });

});

document.querySelectorAll(".menu-item").forEach(item => {

    item.addEventListener("click", async (e) => {

        e.stopPropagation();

        document.querySelectorAll(".dropdown").forEach(item => {

            item.classList.remove("open");

        });        

        const selector = e.currentTarget.parentElement.parentElement;

        const content = selector.querySelector(".text");

        const type = selector.getAttribute("data-type");
    
        const value = e.currentTarget.getAttribute("value");

        // content.innerHTML = getLangText("text selector match prefix") + getLangText(e.currentTarget.getAttribute("data-label"));

        selector.classList.remove("document");
        selector.classList.remove("external");
        selector.classList.remove("reference");

        switch (value) {
            case "active":
                selector.classList.add("document");
                content.innerHTML = app.activeDocument.name;
                switch (type) {
                    case "first":
                        matching.first = app.activeDocument.id;
                        break;
                    case "last":
                        matching.last = app.activeDocument.id;
                        break;
                    case "match":
                        matching.match = app.activeDocument.id;
                        break;
                }
                break;

            case "first":
                selector.classList.add("reference");
                content.innerHTML = getLangText("text selector match prefix") + getLangText(e.currentTarget.getAttribute("data-label"));
                matching.match = "first"; 
                break;

            case "last":
                selector.classList.add("reference");
                content.innerHTML = getLangText("text selector match prefix") + getLangText(e.currentTarget.getAttribute("data-label"));
                matching.match = "last";
                break;

            case "external":

                const openImage = await localFileSystem.getFileForOpening();
                
                if (openImage) {

                    selector.classList.add("external");

                    switch (type) {
                        case "first":
                            matching.first = openImage;;
                            break;
                        case "last":
                            matching.last = openImage;
                            break;
                        case "match":
                            matching.match = openImage;
                            break;
                    }

                    content.innerHTML = openImage.name;

                };
                break;

        }

        // initMatch(value);

        console.log("Selected:", matching);


        // document.querySelector(".operation").classList.remove("open");

    });

});

document.querySelector(".button").addEventListener("click", async (e) => {
    
    await doMatch(matching);

});