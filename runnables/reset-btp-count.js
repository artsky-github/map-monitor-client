const mapCache = require("../cache/map-cache.json");
const fs = require("fs");
const cacheDir = "../cache";
const filePath = `${cacheDir}/map-cache.json`;

mapCache.btCountIgnore += mapCache.btCountToday;
mapCache.btCountParSum = 0;
try {
  fs.writeFileSync(filePath, JSON.stringify(mapCache, null, 2));
  console.log(
    "---------------------------------------------------------------------"
  );
  console.log(
    `${new Date().toLocaleString()}: MAP status successfully cached. `
  );
  console.log(
    "---------------------------------------------------------------------"
  );
} catch (err) {
  console.log(
    "---------------------------------------------------------------------"
  );
  console.log(
    `${new Date().toLocaleString()}: Error writing JSON file: ${err}`
  );
  console.log(
    "---------------------------------------------------------------------"
  );
}

const net = require("net");

const PORT = 6000;
const HOST = "localhost";

const client = new net.Socket();

client.connect(PORT, HOST, () => {
  console.log("Connected to server");
  client.write("true");
  client.end();
});

client.on("close", () => {
  console.log("Connection closed");
});
