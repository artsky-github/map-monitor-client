@echo off
call npm install
call npm link node-windows
cd service
node uninstall-w-service.js
node install-w-service.js
