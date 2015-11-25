var cp = require('child_process'),
fs = require('fs');
var express = require('express'),
cluster = require('express-cluster')
port = process.env.port || 4000,
outPath = "renders/";

cluster(function(worker) {
  var app = express();
  app.use((req, res, next) => {
    try {
      var url = req.originalUrl; // not compatible when mounting on sub folder (or at least then need to keep that into account)
      if (!url.startsWith("/http")) {
        res.sendStatus(404);
        return;
      }
      var outFile = outPath + 'out-' + worker.id + '-' + Math.floor((Math.random() * 9999999) + 1) + '.html';
      var outFileDetails = outFile + '.details.json';
      var theUrl = url.substring(1);
      if (theUrl.includes("_escaped_fragment_=")) {
        theUrl = theUrl.replace("_escaped_fragment_=&", "");
        theUrl = theUrl.replace("?_escaped_fragment_=", "");
        theUrl = theUrl.replace("&_escaped_fragment_=", "");
        //res.status(400).send("Renderer should not get escaped fragment");
        //return;
      }
      var r = cp.spawnSync('node_modules\\.bin\\electron.cmd', ['main\\main.js', theUrl, outFile]);
      console.log("result: ", r.status, r.stdout, r.stderr);
      var document = fs.readFileSync(outFile, {encoding: 'utf-8'});
      fs.unlink(outFile);
      if (fs.existsSync(outFileDetails)) {
        var details = JSON.parse(fs.readFileSync(outFileDetails, {encoding: 'utf-8'}));
        fs.unlink(outFileDetails);
        console.log("details: ", details);
        // TODO: use details ??
        if (details.httpResponseCode != 200) {
          res.status(details.httpResponseCode).send(document);
          return;
        }
      }
      res.send(document);
    } catch (err) {
      console.error("error", err);
      res.status(500).send("An error has occurred");
    }
  });

  app.listen(port);
}, {count: 2});
