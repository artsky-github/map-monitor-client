const hp2 = require("htmlparser2");
const fs = require("fs");
const os = require("os");
const scheduler = require("./schedule");
const cacher = require("./cache");
const sender = require("./ws-client");
const extractor = require("./extract");

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

// IIFE object for Vidtronix MAP printers used in SRQ Airport.
let MapStatus = (function () {
  const foundMapStatus = cacher.getMapBackup();
  if (foundMapStatus) {
    console.log(
      "---------------------------------------------------------------------"
    );
    console.log(`${new Date().toLocaleString()}: MAP status found in cache. `);
    console.log(
      "---------------------------------------------------------------------"
    );
    console.log(foundMapStatus);
    cacher.setMapBackup(foundMapStatus);
    sender.sendMapData(foundMapStatus);
    return foundMapStatus;
  } else {
    let btCountToday = 0;
    let btCountIgnore = 0;
    let btCountParSum = 0;
    let btRemaining = 200;
    let btLoadPath = "EMPTY";
    let bpCountToday = 0;
    let bpCountIgnore = 0;
    let bpCountParSum = 0;
    let bpRemainingA = 5000;
    let bpRemainingB = 5000;
    let bpLoadPathA = "EMPTY";
    let bpLoadPathB = "EMPTY";
    let btStatus = {};
    let bpStatus = {};
    let btTimestamp = "UNKNOWN";
    let bpTimestamp = "UNKNOWN";
    let lastUpdated = new Date().toLocaleString();
    let _id = os.hostname();
    console.log(
      "---------------------------------------------------------------------"
    );
    console.log(
      `${new Date().toLocaleString()}: MAP Status object has been created. `
    );
    console.log(
      "---------------------------------------------------------------------"
    );
    const MapStatus = {
      btCountToday,
      btCountIgnore,
      btCountParSum,
      btRemaining,
      btLoadPath,
      bpCountToday,
      bpCountIgnore,
      bpCountParSum,
      bpRemainingA,
      bpRemainingB,
      bpLoadPathA,
      bpLoadPathB,
      btStatus,
      bpStatus,
      btTimestamp,
      bpTimestamp,
      lastUpdated,
      _id,
    };
    console.log(MapStatus);
    cacher.setMapBackup(MapStatus);
    sender.sendMapData(MapStatus);
    return MapStatus;
  }
})();

scheduler.archiveCounts(MapStatus);

// callback function when the file is read, its contents are stored in data and parsed.
const readStreamAndParse = (cuppsfsFileName, resetFound) => {
  if (resetFound) {
    MapStatus = cacher.getMapBackup();
  }
  // The parsed document gets converted into a big DOM tree object. This object is then filtered based on the functions below.
  const domhandler = new hp2.DomHandler((err, dom) => {
    if (err) throw err;
    else {
      // Given a child node and its parent tag name, traverse to the parent node from the child node.
      const getParentTag = (parentTagName, childNode) => {
        let parentNode = childNode;
        while (parentNode.name !== parentTagName) {
          parentNode = parentNode.parent;
        }
        return parentNode;
      };

      // In the DOM object, obtain the most recent tag given the tag name.
      const getRecentTag = (tagName, domObject) => {
        const tagArray = hp2.DomUtils.getElementsByTagName(tagName, domObject);
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
          if (paperRemainder >= 200) {
            return "FULL";
          } else if (paperRemainder < 200 && paperRemainder > 50) {
            return "GOOD";
          } else if (paperRemainder < 50 && paperRemainder > 0) {
            return "LOW";
          } else {
            return "EMPTY";
          }
        }
      };
      const recentBtStatus = getRecentTag("btStatus", dom);
      const recentBpStatus = getRecentTag("bpStatus", dom);

      MapStatus.btCountToday =
        countPrints(dom, false) - MapStatus.btCountIgnore > 200
          ? 200
          : countPrints(dom, false) - MapStatus.btCountIgnore;
      MapStatus.btRemaining = 200 - MapStatus.btCountToday;
      MapStatus.btLoadPath = loadPathStatus(MapStatus.btRemaining, false);
      MapStatus.bpCountToday =
        countPrints(dom, true) - MapStatus.bpCountIgnore > 10000
          ? 10000
          : countPrints(dom, true) - MapStatus.bpCountIgnore;
      MapStatus.bpRemainingA =
        MapStatus.bpCountParSum + MapStatus.bpCountToday >=
        MapStatus.bpRemainingA
          ? 0
          : 5000 - (MapStatus.bpCountParSum + MapStatus.bpCountToday);
      MapStatus.bpRemainingB =
        MapStatus.bpCountToday >= MapStatus.bpRemainingA
          ? 5000 -
            Math.abs(
              MapStatus.bpCountParSum +
                MapStatus.bpCountToday -
                MapStatus.bpRemainingA
            )
          : 5000;
      MapStatus.bpLoadPathA = loadPathStatus(MapStatus.bpRemainingA, true);
      MapStatus.bpLoadPathB = loadPathStatus(MapStatus.bpRemainingB, true);
      MapStatus.btStatus = recentBtStatus.attribs;
      MapStatus.bpStatus = recentBpStatus.attribs;
      MapStatus.lastUpdated = new Date().toLocaleString();
      MapStatus.btTimestamp =
        getParentTag("cupps", recentBtStatus).attribs.timeStamp ?? "UNKNOWN";
      MapStatus.bpTimestamp =
        getParentTag("cupps", recentBpStatus).attribs.timeStamp ?? "UNKNOWN";

      console.log(
        "---------------------------------------------------------------------"
      );
      console.log(
        `${new Date().toLocaleString()}: MAP status has been updated`
      );
      console.log(
        "---------------------------------------------------------------------"
      );
      console.log(MapStatus);

      const extractedMap = extractor.extractChanges(
        MapStatus,
        cacher.getMapBackup()
      );
      extractedMap["_id"] = MapStatus._id;
      console.log(
        "---------------------------------------------------------------------"
      );
      console.log(
        `${new Date().toLocaleString()}: MAP status changes extracted.`
      );
      console.log(
        "---------------------------------------------------------------------"
      );
      console.log(extractedMap);

      cacher.setMapBackup(MapStatus);
      sender.sendMapData(extractedMap);
    }
  });
  // parser object that takes in the DomHandler object. xmlMode option has been set to true.
  const parser = new hp2.Parser(domhandler, { xmlMode: true });
  const readStream = fs.createReadStream(cuppsfsFileName, {
    encoding: "utf8",
  });

  console.log(
    "---------------------------------------------------------------------"
  );
  console.log(
    `${new Date().toLocaleString()}: Reading File ${cuppsfsFileName}`
  );
  console.log(
    "---------------------------------------------------------------------"
  );

  readStream.on("data", (chunk) => {
    parser.write(chunk);
  });

  readStream.on("end", () => {
    console.log(
      "---------------------------------------------------------------------"
    );
    console.log(`${new Date().toLocaleString()}: Finished Reading File.`);
    console.log(
      "---------------------------------------------------------------------"
    );
    parser.end();
    parser.reset();
  });

  readStream.on("error", (err) => {
    console.error(`Error reading the file: ${err}`);
  });
};

module.exports = { readStreamAndParse };
