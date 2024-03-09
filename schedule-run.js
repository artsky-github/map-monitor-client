const mapParser = require("./map-status-parser");
const schedule = require("node-schedule");

const job = schedule.scheduleJob("*/20 * * * *", () => {
  //process.exit();
});

mapParser.watchLog();
