const Service = require("node-windows").Service;
require("dotenv").config({path: "../.env"});
const path = require("path");

const svc = new Service({
    name: "MAP Status Client",
    description: "MAP Status Client that reads CUPPSFS log files and returns data when a change occurs.",
    script: path.join(__dirname, `${process.env.RUN_PATH}`),
    execPath: `${process.env.EXEC_PATH}`,
    maxRetries: Number.MAX_SAFE_INTEGER,
    maxRestarts: 3,
});

svc.on("install", () => {
    svc.start(); 
})

svc.install();