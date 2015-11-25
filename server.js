var cp = require('child_process'),
fs = require('fs');
var express = require('express'),
app = express(),
port = process.env.port || 4000;


var outPath = "renders/";

app.use((req, res, next) => {
  if (!req.path.startsWith("/http")) {
    res.sendStatus(404);
    return;
  }
  var outFile = outPath + 'out.html';
  var outFileDetails = outFile + '.details.json';
  var r = cp.spawnSync('node_modules\\.bin\\electron.cmd', ['main\\main.js', req.path.substring(1), outFile]);
  console.log("result: ", r.status, r.stdout, r.stderr);
  var document = fs.readFileSync(outFile, {encoding: 'utf-8'});
  fs.unlink(outFile);
  if (fs.existsSync(outFileDetails)) {
    var details = JSON.parse(fs.readFileSync(outFileDetails, {encoding: 'utf-8'}));
    fs.unlink(outFileDetails);
    console.log("details: ", details);
    // TODO: use details ??
    if (details.httpResponseCode != 200) {
      res.send(details.httpResponseCode, document);
      return;
    }
  }
  res.send(document);
});

app.listen(port);
