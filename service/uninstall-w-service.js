var Service = require('node-windows').Service;
const path = require("path");

var svc = new Service({
  name:'MAP Status Client',
  script: path.join("C:", "Apps", "map-monitor-client", "runnables", "run-client.js"),
});

svc.on('uninstall',function(){
  console.log('Uninstall complete.');
  console.log('The service exists: ',svc.exists);
});

svc.uninstall();