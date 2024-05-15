var Service = require('node-windows').Service;
const path = require("path");
require("dotenv").config({path: "../.env"}); 

var svc = new Service({
  name:'MAP Status Client',
  script: path.join(__dirname, `${process.env.RUN_PATH}`),
});

svc.on('uninstall',function(){
  console.log('Uninstall complete.');
  console.log('The service exists: ',svc.exists);
});

svc.uninstall();