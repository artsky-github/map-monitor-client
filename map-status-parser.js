const hp2 = require("htmlparser2");
const chokidar = require("chokidar");
const fs = require("fs");
const os = require("os");

const MapStatus = (function () {
  let btCount = 0;
  let bpCount = 0;
  let btStatus = null;
  let bpStatus = null;
  let btTimestamp = null;
  let bpTimestamp = null;
  let pcName = os.hostname();
  return {
    btCount,
    bpCount,
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
    const btStatusArray = hp2.DomUtils.getElementsByTagName("btStatus", dom);
    const bpStatusArray = hp2.DomUtils.getElementsByTagName("bpStatus", dom);
    const recentBtStatus = btStatusArray[btStatusArray.length - 1];
    const recentBpStatus = bpStatusArray[bpStatusArray.length - 1];

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

const findParentTag = (parentTag, childNode) => {
  let parentNode = childNode;
  while (parentNode.name != parentTag) {
    parentNode = parentNode.parent;
  }
  return parentNode;
};

console.log("---- MapStatus object on program load ----");
console.log(MapStatus);
console.log("------------------------------------------");
watchCuppsLog("btp-bpp-fresh-startup.LOG");
