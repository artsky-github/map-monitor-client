const hp2 = require("htmlparser2");
const chokidar = require("chokidar");
const fs = require("fs");
const os = require("os");
const date = new Date();

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
  let bpRemaining = 10000;
  let bpLoadPathA = "FULL";
  let bpLoadPathB = "FULL";
  let btStatus = null;
  let bpStatus = null;
  let btTimestamp = null;
  let bpTimestamp = null;
  let pcName = os.hostname();
  return {
    btCount,
    btRemaining,
    btLoadPath,
    bpCount,
    bpRemaining,
    bpLoadPathA,
    bpLoadPathB,
    btStatus,
    bpStatus,
    btTimestamp,
    bpTimestamp,
    pcName,
  };
})();

// IFEE object that contains all the possible successful print status messages. Differing due to multiple printing applications used my multiple airlines.
const aeaPrintMessages = (function () {
  // successful print messages in order: CUPPS Diagnostic, GoNow (G4, F9),
  const bpSuccessMessages = [
    "T//CIPROK#100#201#300#VSR#01W",
    "CHECPROK#100#201#300#VSR#01S",
  ];
  const btSuccessMessages = ["HDCPROK101", "GONOWPROK101"];
  return { bpSuccessMessages, btSuccessMessages };
})();

const domhandler = new hp2.DomHandler((err, dom) => {
  if (err) throw err;
  else {
    const findParentTag = (parentTag, childNode) => {
      let parentNode = childNode;
      while (parentNode.name !== parentTag) {
        parentNode = parentNode.parent;
      }
      return parentNode;
    };

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

    /*const countCuppsMonitorPrints = (dom, isBp) => {
      const successMessage = isBp ? ".T//CIPROK#100#2" : ".EASEPROK101.";
      let successMessageRegex = new RegExp(`\\${successMessage}`, `g`);
      let counter = 0;

      const successNodes = hp2.DomUtils.filter((elem) => {
        if (elem.data === undefined) {
          return;
        }
        return elem.data.includes(successMessage);
      }, dom);
      for (let currNode of successNodes) {
        counter += currNode.data.match(successMessageRegex).length;
      }
      return counter;
    };*/

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

    MapStatus.btCount = countPrints(dom, false); //+ countCuppsMonitorPrints(dom, false);
    MapStatus.btRemaining = 200 - MapStatus.btCount;
    MapStatus.btLoadPath = loadPathStatus(MapStatus.btRemaining, false);
    MapStatus.bpCount = countPrints(dom, true); //+ countCuppsMonitorPrints(dom, true);
    MapStatus.bpRemaining = 10000 - MapStatus.bpCount;
    MapStatus.bpLoadPathA = loadPathStatus(MapStatus.bpRemaining - 5000, true);
    MapStatus.bpLoadPathB = loadPathStatus(MapStatus.bpRemaining, true);
    MapStatus.btStatus = recentBtStatus.attribs;
    MapStatus.bpStatus = recentBpStatus.attribs;
    MapStatus.btTimestamp = findParentTag(
      "cupps",
      recentBtStatus
    ).attribs.timeStamp;
    MapStatus.bpTimestamp = findParentTag(
      "cupps",
      recentBpStatus
    ).attribs.timeStamp;

    console.log("---- MapStatus object has been updated ----");
    console.log(MapStatus);
    console.log("-------------------------------------------");
  }
});

const parser = new hp2.Parser(domhandler, { xmlMode: true });

const watchCuppsLog = () => {
  chokidar
    .watch(cuppsfsFileName, { awaitWriteFinish: { stabilityThreshold: 5000 } })
    .on("change", () => {
      const chunkReader = fs.createReadStream(cuppsfsFileName);
      fs.readFile(cuppsfsFileName, "utf8", (err, data) => {
        if (err) throw err;
        else {
          parser.write(data);
          parser.end();
          parser.reset();
        }
      });
    });
};

console.log("---- MapStatus object has been created ----");
console.log(MapStatus);
console.log("------------------------------------------");
console.log(`Accessing: ${cuppsfsFileName}`);

module.exports = { watchCuppsLog };
