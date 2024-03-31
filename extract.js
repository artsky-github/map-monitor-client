const cacher = require("./cache");

const extractChanges = (mapData, primaryKey) => {
  const backupData = cacher.getMapBackup();
  const extractedData = {};
  for (let key of Object.keys(mapData)) {
    if (typeof mapData[key] === "object") {
      extractChanges(mapData[key], backupData[key]);
    } else if (mapData[key] !== backupData[key]) {
      extractedData[key] = mapData[key];
    }
  }
  extractedData["_id"] = primaryKey;
  return extractedData;
};

module.exports = { extractChanges };
