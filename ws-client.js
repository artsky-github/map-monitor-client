const WebSocket = require("ws");

/*
const waitToConnect = new Promise((resolve, reject) => {
  const wssURL = "ws://localhost:4000";
  const ws = new WebSocket(wssURL);

  ws.on("open", () => {
    console.log(`WS Connection Established at ${wssURL}`);
    resolve(ws);
  });
  ws.on("error", (error) => {
    reject(error);
  });
  ws.on("close", () => {
    console.log("WS Connection Closed");
  });
});

/*function waitForMessage(resolvedConnect) {
  return new Promise((resolve, reject) => {
    const messageHandler = (data) => {
      resolve(JSON.parse(data));
    };
    const errorHandler = (error) => {
      reject(error);
    };

    resolvedConnect.addEventListener("message", messageHandler);
    resolvedConnect.addEventListener("error", errorHandler);

    const cleanup() = 
  });
}*/

async function sendMapData(data) {
  const resolvedConnection = await waitToConnect;
  resolvedConnection.send(JSON.stringify(data));
  resolvedConnection.on("message", (message) => {
    console.log(message + "cool beans");
  });
}

async function getMapData(osName) {
  const resolvedConnect = await waitToConnect;
  resolvedConnect.send(osName);
  const mapData = await waitForMessage(WsResolved);
  return mapData;
}

module.exports = { getMapData, sendMapData };
