const scheduler = require("node-cron");

function archiveCount(MapStatusPromise) {
  scheduler.schedule("0 2 * * *", () => {
    MapStatusPromise.then(async (data) => {
      console.log(
        "---------------------------------------------------------------------"
      );
      console.log(
        `${(date =
          new Date().toLocaleString())}: CRON executed. Archiving paper counts... `
      );
      console.log(
        "---------------------------------------------------------------------"
      );
      data.btCountParSum = data.btCountParSum + data.btCountToday;
      data.btCountToday = 0;
      data.bpCountParSum = data.bpCountParSum + data.bpCountToday;
      data.bpCountToday = 0;
      //await requester.postMapData(data);
      console.log(data);
    });
  });
}

module.exports = { archiveCount };
