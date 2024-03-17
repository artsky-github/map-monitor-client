const axios = require("axios");
const os = require("os");

const webURL = "http://localhost:3000";

async function postMapData(mapData) {
  await axios
    .post(`${webURL}/post-map-data`, mapData)
    .then((res) => {
      console.log(`Response: ${res.data}`);
    })
    .catch((err) => {
      console.log(`Error: ${err}`);
    });
}

async function getMapData() {
  const mapData = await axios
    .get(
      `${webURL}/get-map-data?${new URLSearchParams(os.hostname()).toString()}`
    )
    .then((res) => {
      return res.data;
    });

  return mapData;
}

module.exports = { postMapData, getMapData };
