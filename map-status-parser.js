const hp2 = require("htmlparser2");
const chokidar = require("chokidar");
const fs = require("fs");
const os = require("os");
//const mongo = require("./mongodb-connection");
let date = new Date();

// Dependent on the correct time set on the individual CUPPS computer to access the right file.
const cuppsfsFileName = `CUPPSFS${date.getFullYear().toString().slice(-2)}${(
  "0" +
  (date.getMonth() + 1)
)
  .toString()
  .slice(-2)}${("0" + date.getDate()).toString().slice(-2)}.LOG`;

// IIFE object for Vidtronix MAP printers used in SRQ Airport.
const MapStatus = (function () {
  let btCount = 0;
  let btRemaining = 200;
  let btLoadPath = "FULL";
  let bpCount = 0;
  let bpRemainingA = 5000;
  let bpRemainingB = 5000;
  let bpLoadPathA = "FULL";
  let bpLoadPathB = "FULL";
  let btStatus = null;
  let bpStatus = null;
  let btTimestamp = null;
  let bpTimestamp = null;
  let _id = os.hostname();
  return {
    btCount,
    btRemaining,
    btLoadPath,
    bpCount,
    bpRemainingA,
    bpRemainingB,
    bpLoadPathA,
    bpLoadPathB,
    btStatus,
    bpStatus,
    btTimestamp,
    bpTimestamp,
    _id,
  };
})();

// IFEE object that contains all the possible successful AEA print status messages. Differing due to multiple printing applications used my multiple airlines.
const aeaPrintMessages = (function () {
  const bpSuccessMessages = [
    "T//CIPROK#100#201#300#VSR#01W",
    "CHECPROK#100#201#300#VSR#01S",
    "ATBCPROK#101#200#300#VSR",
    "CPROK#101#200#300#VSR",
    "CPROK#100#201#300#VSR",
    "C?ACIPROK#101#200#300#VSR",
    "CHECKPROK^100^201^300^VSR",
    "CHKINPROK_100_201_300_VSR",
  ];
  const btSuccessMessages = ["HDCPROK101", "GONOWPROK101", "MUSEPROK101"];
  return { bpSuccessMessages, btSuccessMessages };
})();

// The parsed document gets converted into a big DOM tree object. This object is then filtered based on the functions below.
const domhandler = new hp2.DomHandler((err, dom) => {
  if (err) throw err;
  else {
    // Given a child node and its parent tag name, traverse to the parent node from the child node.
    const findParentTag = (parentTagName, childNode) => {
      let parentNode = childNode;
      while (parentNode.name !== parentTagName) {
        parentNode = parentNode.parent;
      }
      return parentNode;
    };

    // Given an array of tags, return the lastest tag.
    const getRecentTag = (tagArray) => {
      return tagArray[tagArray.length - 1];
    };

    // Function used in conjunction with the countPrints function. Used to iteratively check if an aea message has any of the successful print messages.
    const hasSuccessMessage = (currMessage, successMessages) => {
      for (let message of successMessages) {
        if (currMessage === message) {
          return true;
        }
      }
      return false;
    };

    // Utilizing the AEA IFEE, DOM object, and whether we are counting BP or BT, filter the DOM and return the array length of all found success print messages.
    const countPrints = (dom, isBp) => {
      const successMessages = isBp
        ? aeaPrintMessages.bpSuccessMessages
        : aeaPrintMessages.btSuccessMessages;

      return hp2.DomUtils.filter((elem) => {
        return (
          elem.name === "aeaText" &&
          hasSuccessMessage(elem.children[0].data, successMessages)
        );
      }, dom).length;
    };

    // Depending if its BP or BT remainder and how much is left, return a status.
    const loadPathStatus = (paperRemainder, isBp) => {
      if (isBp) {
        if (paperRemainder >= 5000) {
          return "FULL";
        } else if (paperRemainder < 5000 && paperRemainder > 250) {
          return "GOOD";
        } else if (paperRemainder < 250 && paperRemainder > 0) {
          return "LOW";
        } else {
          return "EMPTY";
        }
      } else {
        if (paperRemainder >= 250) {
          return "FULL";
        } else if (paperRemainder < 250 && paperRemainder > 50) {
          return "GOOD";
        } else if (paperRemainder < 50 && paperRemainder > 0) {
          return "LOW";
        } else {
          return "EMPTY";
        }
      }
    };

    const btStatusArray = hp2.DomUtils.getElementsByTagName("btStatus", dom);
    const bpStatusArray = hp2.DomUtils.getElementsByTagName("bpStatus", dom);
    const recentBtStatus = getRecentTag(btStatusArray);
    const recentBpStatus = getRecentTag(bpStatusArray);

    MapStatus.btCount = countPrints(dom, false);
    MapStatus.btRemaining = 200 - MapStatus.btCount;
    MapStatus.btLoadPath = loadPathStatus(MapStatus.btRemaining, false);
    MapStatus.bpCount = countPrints(dom, true);
    MapStatus.bpRemainingA =
      MapStatus.bpCount > 5000 ? 0 : 5000 - MapStatus.bpCount;
    MapStatus.bpRemainingB =
      MapStatus.bpRemainingA === 0 ? 5000 - (MapStatus.bpCount - 5000) : 5000;
    MapStatus.bpLoadPathA = loadPathStatus(MapStatus.bpRemainingA, true);
    MapStatus.bpLoadPathB = loadPathStatus(MapStatus.bpRemainingB, true);
    MapStatus.btStatus = recentBtStatus.attribs;
    MapStatus.bpStatus = recentBpStatus.attribs;
    MapStatus.btTimestamp =
      findParentTag("cupps", recentBtStatus).attribs.timeStamp ?? "UNKNOWN";
    MapStatus.bpTimestamp =
      findParentTag("cupps", recentBpStatus).attribs.timeStamp ?? "UNKNOWN";

    date = new Date();
    console.log("-------------------------------------------");
    console.log(`${date.toLocaleString()}: MapStatus object has been updated`);
    console.log("-------------------------------------------");
    console.log(MapStatus);
    //mongo.add(MapStatus).catch(console.dir);
  }
});

// parser object that takes in the DomHandler object. xmlMode option has been set to true.
const parser = new hp2.Parser(domhandler, { xmlMode: true });

// function that immediately runs on program load and watches the file afterwards for changes.
const watchLog = () => {
  // callback function when the file is read, its contents are stored in data and parsed.
  const readAndParse = () => {
    fs.readFile(cuppsfsFileName, "utf8", (err, data) => {
      if (err) throw err;
      else {
        parser.write(data);
        parser.end();
        parser.reset();
      }
    });
  };

  // Due to issues with fs.watch(), chokidar library is more refined for watching events occuring to files. It runs on program load and runs when a change occurs on a file.
  chokidar
    .watch(cuppsfsFileName, { awaitWriteFinish: { stabilityThreshold: 5000 } })
    .on("ready", () => {
      readAndParse();
    })
    .on("change", () => {
      readAndParse();
    });
};

console.log("-------------------------------------------");
console.log(`${date.toLocaleString()}: MapStatus object has been created`);
console.log("-------------------------------------------");
console.log(MapStatus);
console.log("-------------------------------------------");
console.log(`${date.toLocaleString()}: Accessing: ${cuppsfsFileName}`);
console.log("-------------------------------------------");

module.exports = { watchLog };
