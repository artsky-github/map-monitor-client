const hp2 = require("htmlparser2");
const chokidar = require("chokidar");
const fs = require("fs");
const os = require("os");
const db = require("./map-status-db");

// function that immediately runs on program load and watches the file afterwards for changes.
const watchLog = () => {
  let date = new Date();
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

  // Dependent on the correct time set on the individual CUPPS computer to access the right file.
  const cuppsfsFileName = `CUPPSFS${date.getFullYear().toString().slice(-2)}${(
    "0" +
    (date.getMonth() + 1)
  )
    .toString()
    .slice(-2)}${("0" + date.getDate()).toString().slice(-2)}.LOG`;

  // IIFE promise object for Vidtronix MAP printers used in SRQ Airport.
  let MapStatusPromise = (async function () {
    if (await db.existsMapStatus()) {
      console.log(
        "---------------------------------------------------------------------"
      );
      console.log(`${date.toLocaleString()}: MAP Status entry exists!`);
      console.log(
        "---------------------------------------------------------------------"
      );
      const MapStatus = await db.getMapStatus();
      console.log(MapStatus);
      return MapStatus;
    } else {
      let btCountToday = 0;
      let btCountParSum = 0;
      let btRemaining = 200;
      let btLoadPath = "EMPTY";
      let bpCountToday = 0;
      let bpCountParSum = 0;
      let bpRemainingA = 5000;
      let bpRemainingB = 5000;
      let bpLoadPathA = "EMPTY";
      let bpLoadPathB = "EMPTY";
      let btStatus = null;
      let bpStatus = null;
      let btTimestamp = null;
      let bpTimestamp = null;
      let _id = os.hostname();
      console.log(
        "---------------------------------------------------------------------"
      );
      console.log(
        `${date.toLocaleString()}: MAP Status object has been created. `
      );
      console.log(
        "---------------------------------------------------------------------"
      );
      const MapStatus = {
        btCountToday,
        btCountParSum,
        btRemaining,
        btLoadPath,
        bpCountToday,
        bpCountParSum,
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
      console.log(MapStatus);
      return MapStatus;
    }
  })();

  // When the process is shutdown, a SIGINT event signal is sent from pm2. This callback function will be run before exiting.
  process.on("SIGINT", () => {
    MapStatusPromise.then(async (data) => {
      console.log(
        "---------------------------------------------------------------------"
      );
      console.log(
        `${(date =
          new Date().toLocaleString())}: SIGINT caught! Saving to MAP partial sum and stopping process...`
      );
      console.log(
        "---------------------------------------------------------------------"
      );
      data.btCountParSum = data.btCountParSum + data.btCountToday;
      data.btCountToday = 0;
      data.bpCountParSum = data.bpCountParSum + data.bpCountToday;
      data.bpCountToday = 0;
      await db.insertMapStatus(data).catch(console.dir);
      process.exit();
    });
  });

  // callback function when the file is read, its contents are stored in data and parsed.
  const readStreamAndParse = () => {
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
          const tagArray = hp2.DomUtils.getElementsByTagName(
            tagName,
            domObject
          );
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

        MapStatusPromise.then((data) => {
          const recentBtStatus = getRecentTag("btStatus", dom);
          const recentBpStatus = getRecentTag("bpStatus", dom);

          data.btCountToday =
            data.btRemaining - countPrints(dom, false) < 0
              ? countPrints(dom, false) +
                (data.btRemaining - countPrints(dom, false))
              : countPrints(dom, false);
          data.btRemaining =
            data.btCountToday >= data.btRemaining
              ? 0
              : 200 - data.btCountParSum - data.btCountToday;
          data.btLoadPath = loadPathStatus(data.btRemaining, false);
          data.bpCountToday =
            data.bpRemainingB - countPrints(dom, true) < 0
              ? countPrints(dom, true) +
                (data.bpRemainingB - countPrints(dom, true))
              : countPrints(dom, true);
          data.bpRemainingB =
            data.bpCountToday >= data.bpRemainingA
              ? 5000 -
                Math.abs(
                  data.bpCountParSum + data.bpCountToday - data.bpRemainingA
                )
              : 5000;
          data.bpRemainingA =
            data.bpCountParSum + data.bpCountToday >= data.bpRemainingA
              ? 0
              : 5000 - (data.bpCountParSum + data.bpCountToday);
          data.bpLoadPathA = loadPathStatus(data.bpRemainingA, true);
          data.bpLoadPathB = loadPathStatus(data.bpRemainingB, true);
          data.btStatus = recentBtStatus.attribs;
          data.bpStatus = recentBpStatus.attribs;
          data.btTimestamp =
            getParentTag("cupps", recentBtStatus).attribs.timeStamp ??
            "UNKNOWN";
          data.bpTimestamp =
            getParentTag("cupps", recentBpStatus).attribs.timeStamp ??
            "UNKNOWN";

          console.log(
            "---------------------------------------------------------------------"
          );
          console.log(
            `${(date =
              new Date().toLocaleString())}: MAP Status Promise object data has been updated`
          );
          console.log(
            "---------------------------------------------------------------------"
          );
          console.log(data);
          db.insertMapStatus(data).catch(console.dir);
        });
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
    console.log(`${date.toLocaleString()}: Reading File ${cuppsfsFileName}`);
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
      console.log(`${date.toLocaleString()}: Finished Reading File.`);
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

  console.log(
    "---------------------------------------------------------------------"
  );
  console.log(`${date.toLocaleString()}: Watching File ${cuppsfsFileName}`);
  console.log(
    "---------------------------------------------------------------------"
  );

  // Due to issues with fs.watch(), chokidar library is more refined for watching events occuring to files. It runs on program load and runs when a change occurs on a file.
  chokidar
    .watch(cuppsfsFileName, { awaitWriteFinish: { stabilityThreshold: 5000 } })
    .on("ready", () => {
      readStreamAndParse();
    })
    .on("change", () => {
      console.log(
        "---------------------------------------------------------------------"
      );
      console.log(
        `${date.toLocaleString()}: File Change Detected! Update MapStatus...`
      );
      console.log(
        "---------------------------------------------------------------------"
      );
      readStreamAndParse();
    });
};

module.exports = { watchLog };
