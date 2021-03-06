"use strict";

// TODO: eventually support multiple browser windows per process, and leaving process running for x amount of iterations
// TODO: Support server-based redirects

var BrowserWindow = require('browser-window'); // Module to create native browser window.
var path = require('path');
var app = require('app');
var ipc = require('ipc');
var fs = require('fs');

var publicFolder = path.resolve(__dirname, '../public');

var config = {
  timeout: 2 * 60 * 1000,
  stripScripts: true,
  publicFolder: publicFolder,
  debug: true
}

var shift = 1; // when running from cli electron needs shift
var outFile = process.argv[1+shift];
var url = process.argv[2+shift];
if (config.debug) console.log("In", url, "Out", outFile);
if (!url) {
  console.error("no valid url specified");
  process.exit(1);
}
if (!outFile) {
  console.error("no valid outFile specified");
  process.exit(1);
}

url = decodeURIComponent(url);

var appReady = new Promise((resolve, reject) => app.on('ready', () => resolve()));

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow: GitHubElectron.BrowserWindow = null;

class State {
  outFileHeaders: string;
  timedOut: boolean;
  processing: boolean;
  document: string;
  details: {httpResponseCode?: string, headers?: {}};

  constructor(public url: string, public outFile: string) {
    this.outFileHeaders = outFile + ".details.json";
  }

  write() {
    if (config.debug) console.log("dumping document..");
    fs.writeFileSync(state.outFile, this.document, { encoding: 'utf-8'});
    if (config.debug) console.log("dumping document.. done!");
    if (this.details) {
      if (config.debug) console.log("dumping details..");
      fs.writeFileSync(state.outFileHeaders, this.buildDetails(), { encoding: 'utf-8'});
      if (config.debug) console.log("dumping details.. done!");
    }
  }

  buildDetails() { return JSON.stringify(this.details) }
}

var state = new State(url, outFile);
ipc.on('prerender:document', (evt, document: string, details?) => {
  if (state.timedOut) return;
  try {
    state.processing = true;
    state.document = document;
    if (details) {
      if (!state.details) state.details = {}
      if (details.httpResponseCode) state.details.httpResponseCode = details.httpResponseCode;
      if (details.headers) {
        details.headers.forEach((x: string) => {
          let split = x.split(": ")
          state.details[split[0]] = split.slice(1).join(": ");
        })
      }
    }
    state.write();
  } finally {
    mainWindow.close();
  }
})

appReady.then(x => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    show: false,
    //frame: false,
    "web-preferences": {
      "node-integration": false,
      preload: path.resolve(publicFolder, 'api.js'),
      images: false
    }
  });

  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
  mainWindow.webContents.on('did-get-response-details', (evt, status, newURL, originalURL, httpResponseCode, requestMethod, referrer, headers) => {
    if (state.details) return;
    state.details = {httpResponseCode: httpResponseCode, headers: headers}
  });

  if (config.debug) console.log("waiting for document...");

  mainWindow.loadUrl(state.url);

  var timedOut = null;
  setTimeout(() => {
    if (state.processing) return;
    try {
      state.timedOut = true;
      if (config.debug) console.log("timed out");
      state.details = {httpResponseCode: "504"};
      state.document = "Gateway timeout";
      state.write();
    } finally {
      mainWindow.close();
    }
  }, config.timeout);

  mainWindow.webContents.executeJavaScript(`
    var i = setInterval(() => {
      if (window.prerenderReady) {
        clearInterval(i);
        try {
          window.api.dumpHtml(document.documentElement.innerHTML);
        } catch (err) {
          console.error(err);
          // TODO: signal error state so it doesnt wait for timeout..
        }
      }
    }, 100);
  `);
});
