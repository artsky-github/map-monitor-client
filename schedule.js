const ncron = require("node-cron");
const cacher = require("./cache");

function archiveCounts(MapStatus) {
  ncron.schedule("0 2 * * *", () => {
    console.log(
      "---------------------------------------------------------------------"
    );
    console.log(
      `${new Date().toLocaleString()}: CRON executed. Archiving paper counts... `
    );
    console.log(
      "---------------------------------------------------------------------"
    );
    MapStatus.btCountParSum = MapStatus.btCountParSum + MapStatus.btCountToday;
    MapStatus.btCountToday = 0;
    MapStatus.bpCountParSum = MapStatus.bpCountParSum + MapStatus.bpCountToday;
    MapStatus.bpCountToday = 0;
    console.log(MapStatus);
    cacher.setMapBackup(MapStatus);
  });
}

module.exports = { archiveCounts };
