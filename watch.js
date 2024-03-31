const chokidar = require("chokidar");
const parser = require("./parse");

function watchLog() {
  const cuppsDate = new Date();
  // Dependent on the correct time set on the individual CUPPS computer to access the right file.
  const cuppsfsFileName = `CUPPSFS${cuppsDate
    .getFullYear()
    .toString()
    .slice(-2)}${("0" + (cuppsDate.getMonth() + 1)).toString().slice(-2)}${(
    "0" + cuppsDate.getDate()
  )
    .toString()
    .slice(-2)}.LOG`;

  console.log(
    "---------------------------------------------------------------------"
  );
  console.log(
    `${new Date().toLocaleString()}: Watching File ${cuppsfsFileName}`
  );
  console.log(
    "---------------------------------------------------------------------"
  );

  // Due to issues with fs.watch(), chokidar library is more refined for watching events occuring to files. It runs on program load and runs when a change occurs on a file.
  chokidar
    .watch(cuppsfsFileName, { awaitWriteFinish: { stabilityThreshold: 5000 } })
    .on("ready", () => {
      parser.readStreamAndParse(cuppsfsFileName);
    })
    .on("change", () => {
      console.log(
        "---------------------------------------------------------------------"
      );
      console.log(
        `${new Date().toLocaleString()}: File Change Detected! Update Map Status...`
      );
      console.log(
        "---------------------------------------------------------------------"
      );
      parser.readStreamAndParse(cuppsfsFileName);
    });
}
module.exports = { watchLog };
