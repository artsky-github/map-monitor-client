const hp2 = require("htmlparser2");
const chokidar = require("chokidar");
const fs = require("fs");
const os = require("os");
const dh = require("domhandler");
const date = new Date();
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
  let bpCount = 0;
  let bpRemaining = 5000;
  let btStatus = null;
  let bpStatus = null;
  let btTimestamp = null;
  let bpTimestamp = null;
  let pcName = os.hostname();
  return {
    btCount,
    btRemaining,
    bpCount,
    bpRemaining,
    btStatus,
    bpStatus,
    btTimestamp,
    bpTimestamp,
    pcName,
  };
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

    const countPrints = (dom, isBp) => {
      const successMessage = isBp
        ? "T//CIPROK#100#201#300#VSR#01W"
        : "HDCPROK101";

      return hp2.DomUtils.filter((elem) => {
        return (
          elem.name === "aeaText" && elem.children[0].data === successMessage
        );
      }, dom).length;
    };

    const countCuppsMonitorPrints = (dom, isBp) => {
      const successMessage = isBp ? "T//CIPROK#100#20" : ".EASEPROK101.";
      let successMessageRegex; 
      let counter = 0; 
      switch (isBp) {
        case (true) :
          successMessageRegex = new RegExp(`${successMessage}`,`g`);
          break; 
        case (false) :
          successMessageRegex = new RegExp(`\\${successMessage}`,`g`);
          break; 
      }
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
    };

    const btStatusArray = hp2.DomUtils.getElementsByTagName("btStatus", dom);
    const bpStatusArray = hp2.DomUtils.getElementsByTagName("bpStatus", dom);
    const recentBtStatus = getRecentTag(btStatusArray);
    const recentBpStatus = getRecentTag(bpStatusArray);

    MapStatus.bpCount = countPrints(dom, true) + countCuppsMonitorPrints(dom, true);
    MapStatus.bpRemaining = MapStatus.bpRemaining - MapStatus.bpCount;
    MapStatus.btCount = countPrints(dom, false) + countCuppsMonitorPrints(dom, false);
    MapStatus.btRemaining = MapStatus.btRemaining - MapStatus.btCount;
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

const watchCuppsLog = (filename) => {
  chokidar
    .watch(filename, { awaitWriteFinish: { stabilityThreshold: 5000 } })
    .on("change", () => {
      fs.readFile(filename, "utf8", (err, data) => {
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
watchCuppsLog(cuppsfsFileName);
