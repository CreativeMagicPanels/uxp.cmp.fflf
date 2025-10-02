const { imaging, app, constants } = require("photoshop");

var listener = (e, d) => {
  let myEvent = e;
  let myData = d;

  console.log(myEvent, myData); // just display whatever event PS is catching

  if (myEvent === "select") {
    console.log(myData._target[0]._ref);
  }
  
}

require('photoshop').action.addNotificationListener([
  { // pick your event(s)
    event: "select"
  },
  {
    event: "open"
  },
  {
    event: "make"
  },
  {
    event: "move"
  },
  {
    event: "close"
  },
  {
    event: "delete"
  },
  {
    event: "show"
  },
  {
    event: "hide"
  },
  {
    event: "set"
  }
], listener);