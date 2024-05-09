const cacher = require("./cache");

const extractChanges = (mapData, comparisonData) => {
  const extractedData = {};
  for (let key of Object.keys(mapData)) {
    if (typeof mapData[key] === "object") {
      const subData = extractChanges(mapData[key], comparisonData[key]);
      if (Object.keys(subData).length !== 0) {
        extractedData[key] = subData;
      }
    } else if (mapData[key] !== comparisonData[key]) {
      extractedData[key] = mapData[key];
    }
  }
  return extractedData;
};

module.exports = { extractChanges };
