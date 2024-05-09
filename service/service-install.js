const Service = require("node-windows").Service;
const path = require("path"); 

const svc = new Service({
    name: "MAP Status Client",
    description: "MAP Status Client that reads CUPPSFS log files and returns data when a change occurs.",
    script: path.join("C:", "Apps", "map-monitor-client", "runnables", "run-client.js"),
    execPath: path.join("C:", "Program Files", "nodejs", "node.exe"),
});

svc.on("install", () => {
    svc.start(); 
})

svc.install(); 