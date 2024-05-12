const chokidar = require("chokidar");
const parser = require("./parse");
const net = require("net");
const path = require("path");
require("dotenv").config({ path: "../.env"});


const cuppsDate = new Date();
// Dependent on the correct time set on the individual CUPPS computer to access the right file.
const cuppsfsFileName = path.join(process.env.LOG_PATH, `CUPPSFS${cuppsDate
  .getFullYear()
  .toString()
  .slice(-2)}${("0" + (cuppsDate.getMonth() + 1)).toString().slice(-2)}${(
  "0" + cuppsDate.getDate()
)
  .toString()
  .slice(-2)}.LOG`);

function watchLog() {
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
    .watch(cuppsfsFileName, {ignorePermissionErrors: true, usePolling: true, interval: 5000})
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

const PORT = 6000;

const server = net.createServer((socket) => {
  console.log("Client connected");

  socket.on("data", (data) => {
    console.log("Received data:", data.toString());

    if (data.toString()) {
      parser.readStreamAndParse(cuppsfsFileName, data.toString());
    }
  });

  socket.on("end", () => {
    console.log("Client disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

module.exports = { watchLog };
