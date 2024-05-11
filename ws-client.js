const WebSocket = require("ws");
const cacher = require("./cache");
require("dotenv").config({ path: "../.env"});

const serverURI = `ws://${process.env.WSS_IP}:${process.env.WSS_PORT}`;

let wsClientPromise = createConnectPromise(); 

function createConnectPromise() {
  return new Promise((resolve) => {
    attemptConnectPromise(resolve);
  })
}

function attemptConnectPromise(resolve) {
  const wsClient = new WebSocket(serverURI);
  wsClient.on("open", () => {
    console.log(`WS Client Successfully Connected to WS Server on: ${serverURI}`);
    resolve(wsClient);
  });
  wsClient.on("error", (err) => {
    console.log(err);
    console.log("Auto Reconnecting in 5 seconds...")
    setTimeout(() => {attemptConnectPromise(resolve)}, 5000);
  });
}

function sendMapData(mapData) { 
  wsClientPromise.then((wsClient) => {
    if (wsClient._readyState === 3) {
      wsClientPromise = createConnectPromise();
      wsClientPromise.then((wsClient) => {
        console.log("Sending entire map cache...");
        console.log(cacher.getMapBackup());
        wsClient.send(JSON.stringify(cacher.getMapBackup()));
      })
    } else {
      console.log("WS Client Sending Data to WS Server");
      wsClient.send(JSON.stringify(mapData));
    }
  });
}

module.exports = { sendMapData };
