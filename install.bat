@echo off
call npm install
cd service
call npm link node-windows
node install-w-service.js
