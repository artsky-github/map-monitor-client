const hp = require("htmlparser2");
const chokidar = require("chokidar");
const fs = require("fs");
let bpRecentStatus;
let btRecentStatus;
let contents;

const domhandler = new hp.DomHandler((err, dom) => {
  if (err) throw err;
  else {
    console.log(typeof dom);
    bpAllStatus = hp.DomUtils.getElementsByTagName("bpStatus", dom);
    btAllStatus = hp.DomUtils.getElementsByTagName("btStatus", dom);
    bpRecentStatus = { bpStatus: bpAllStatus[bpAllStatus.length - 1] };
    btRecentStatus = { btStatus: btAllStatus[btAllStatus.length - 1] };
  }
});

const parser = new hp.Parser(domhandler, {
  xmlMode: true,
});

chokidar.watch("btp-bpp-fresh-startup.LOG").on("change", () => {
  fs.readFile("btp-bpp-fresh-startup.LOG", "utf8", (err, data) => {
    if (err) throw err;
    else {
      setTimeout(() => {
        parser.write(data);
        parser.end();
        parser.reset();
        console.log(bpRecentStatus);
        console.log(btRecentStatus);
      }, 1000);
    }
  });
});
