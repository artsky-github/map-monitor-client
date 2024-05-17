@echo off
call npm install
call npm link node-windows
cd service
node install-w-service.js
