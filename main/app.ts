"use strict";

// TODO: eventually support multiple browser windows per process, and leaving process running for x amount of iterations

var shift = 1; // when running from cli electron needs shift
var url = process.argv[1+shift];
var outFile = process.argv[2+shift];
var stripScripts = true;
console.log("Url", url);
console.log("OutFile", outFile);

var BrowserWindow = require('browser-window'); // Module to create native browser window.
var path = require('path');
var app = require('app');
var ipc = require('ipc');
var fs = require('fs');

var appReady = new Promise((resolve, reject) => app.on('ready', () => resolve()));

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow: GitHubElectron.BrowserWindow = null;
var publicFolder = path.resolve(__dirname, '../public');

var preloadScript = path.resolve(publicFolder, 'api.js');

ipc.on('prerender:document', (evt, document: string) => {
  console.log("dumping document..");
  fs.writeFileSync(outFile, document, { encoding: 'utf-8'});
  console.log("dumping document.. done!");
  mainWindow.close();
})

appReady.then(x => {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    show: false,
    //frame: false,
    "web-preferences": {
      "node-integration": false,
      preload: preloadScript,
      images: false
    }
  });

  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  //mainWindow.openDevTools();

  console.log("waiting for document...");

  mainWindow.loadUrl(url);
  // TODO: Disable image loading etc?

  mainWindow.webContents.executeJavaScript(`
    var i = setInterval(() => {
      if (window.prerenderReady) {
        window.api.dumpHtml(document.documentElement.innerHTML);
        clearInterval(i);
      }
    }, 100);
  `);

  // TODO: Dump html after prerenderReady on window is true
  // Then strip <script tags>
});
