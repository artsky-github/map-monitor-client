const fs = require("fs");

const cacheDir = "../cache";
const filePath = `${cacheDir}/map-cache.json`;

if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir);
}

function setMapBackup(MapData) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(MapData, null, 2));
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
}

function getMapBackup() {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    console.log(
      "---------------------------------------------------------------------"
    );
    console.log(
      `${new Date().toLocaleString()}: MAP status backup not found. `
    );
    console.log(
      "---------------------------------------------------------------------"
    );
    return 0;
  }
}

module.exports = { setMapBackup, getMapBackup };
