"use strict";

var BrowserWindow = require('browser-window'); // Module to create native browser window.
var path = require('path');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow: GitHubElectron.BrowserWindow = null;
var publicFolder = path.resolve(__dirname, '../public');

var preloadScript = path.resolve(publicFolder, 'api.js');
mainWindow = new BrowserWindow({
  width: 1024,
  height: 768,
  show: true,
  frame: false,
  "web-preferences": {
    "node-integration": false,
    preload: preloadScript, //options.local ? undefined : preloadScript
  }
});

mainWindow.on('closed', function() {
  // Dereference the window object, usually you would store windows
  // in an array if your app supports multi windows, this is the time
  // when you should delete the corresponding element.
    mainWindow = null;
});

mainWindow.loadUrl("http://withsix.com");
