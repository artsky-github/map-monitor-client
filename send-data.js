const axios = require("axios");
const os = require("os");

const urlPost = "http://localhost:3000/post-data";

async function postMapData(mapData) {
  await axios
    .post(urlPost, mapData)
    .then((res) => {
      console.log(`Response: ${res.data}`);
    })
    .catch((err) => {
      console.log(`Error: ${err}`);
    });
}

const getMapData = axios.get(
  `http://localhost:3000/data?${new URLSearchParams(os.hostname()).toString()}`
);

module.exports = { postMapData, getMapData };
