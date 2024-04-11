const WebSocket = require("ws");

const serverURI = "ws://localhost:4000";

const wsClientPromise = new Promise((resolve, reject) => {
  const wsClient = new WebSocket(serverURI);

  wsClient.on("open", () => {
    console.log("Successfully connected to WS Server");
    resolve(wsClient);
  });
  wsClient.on("error", (err) => {
    console.log("Web Socket error: " + err);
    reject(err);
  });
  wsClient.on("message", (message) => {
    console.log("recieved from server" + message);
  });
  wsClient.on("close", () => {
    console.log("Web Socket Connection Closed");
  });
});

async function sendMapData(mapData) {
  const wsClient = await wsClientPromise;
  wsClient.send(JSON.stringify(mapData));
}

module.exports = { sendMapData };
