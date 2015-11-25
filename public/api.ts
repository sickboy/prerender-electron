var ipc = require('ipc');

var g = <any>global;
function stripScripts(s) {
 var div = document.createElement('div');
 div.innerHTML = s;
 var scripts = div.getElementsByTagName('script');
 var i = scripts.length;
 while (i--) {
   scripts[i].parentNode.removeChild(scripts[i]);
 }
 return div.innerHTML;
}

// TODO: support
// prerender-status-code and prerender-header

g.api = {
  "dumpHtml": (html: string) => {
    ipc.send('prerender:document', stripScripts(html));
  }
}
