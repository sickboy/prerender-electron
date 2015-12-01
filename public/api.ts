"use strict";

let ipc = require('ipc');

let g = <any>global;
function stripScripts(doc: Document) {
 let scripts = doc.getElementsByTagName('script');
 let i = scripts.length;
 while (i--) scripts[i].parentNode.removeChild(scripts[i]);
 return doc.documentElement.outerHTML;
}

function getHeaders(doc: Document) {
  let head = doc.getElementsByTagName('head')[0];
  let meta = head.getElementsByTagName('meta');
  let headers: string[] = [];
  let status = "200";
  for (let i in meta) {
    if (meta.hasOwnProperty(i)) {
      var m = meta[i];
      if (m.getAttribute("name") == "prerender-status-code") status = m.getAttribute("content");
      else if (m.getAttribute("name") == "prerender-header") headers.push(m.getAttribute("content"));
    }
  }

  let details: {httpResponseCode?: string, headers?: string[]} = {}
  if (status != "200") details.httpResponseCode = status;
  if (headers.length > 0) details.headers = headers;
  return details;
}

g.api = {
  "dumpHtml": (html: string) => {
    var doc = document.implementation.createHTMLDocument('');
    doc.open();
    doc.write(html);
    doc.close();
    ipc.send('prerender:document', stripScripts(doc), getHeaders(doc));
  }
}
