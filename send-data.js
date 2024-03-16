const axios = require("axios");

const url = "http://localhost:3000/post";

function sendData(postData) {
  axios
    .post(url, postData)
    .then((res) => {
      console.log(`Response: ${res}`);
    })
    .catch((err) => {
      console.log(`Error: ${err}`);
    });
}

module.exports = { sendData };
