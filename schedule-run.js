const mapParser = require("./map-status-parser");
const schedule = require("node-schedule");

// cron job that will execute this function when the time hits 2:05AM everyday.
const job = schedule.scheduleJob("* * * * *", () => {
  process.exit();
});

mapParser.watchLog();
