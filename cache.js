const fs = require("fs");

const cacheDir = "./cache";
const filePath = `${cacheDir}/map-backup.json`;

if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir);
}

function setMapBackup(MapData) {
  fs.writeFile(filePath, JSON.stringify(MapData), (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log(
        "---------------------------------------------------------------------"
      );
      console.log(
        `${new Date().toLocaleString()}: MAP status successfully cached. `
      );
      console.log(
        "---------------------------------------------------------------------"
      );
    }
  });
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
