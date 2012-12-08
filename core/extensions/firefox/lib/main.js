const {Cc,Ci,Cu} = require("chrome");

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
//Cu.import("resource://gre/modules/devtools/gDevTools.jsm");

let chromeembed = require("chrome-embed");
let tabs = require("tabs");
let data = require("self").data;
let pageMod = require("page-mod");
const observers = require("api-utils/observer-service");
const xulApp = require("api-utils/xul-app");

XPCOMUtils.defineLazyModuleGetter(this, "gDevTools", "resource:///modules/devtools/gDevTools.jsm");

let documentToInspect = null;

let webGLInspectorToolDefinition = {
  id: "webglinspector",
  key: "WebGL Inspector",
  ordinal: 0,
  icon: data.url("webgl-128.png"),
  url: data.url("hello.html"),
  label: "WebGL Inspector",
  isTargetSupported: function(target) {
    return true;
  },
  build: function(iframeWindow, toolbox) {
    //iframeWindow.document.body.innerHTML = "";
    var div = documentToInspect.body.lastChild;
    div.style.height = "100%";
    iframeWindow.document.body.appendChild(div);
    //return new WebConsolePanel(iframeWindow, toolbox);
  }
};

const HAS_DOCUMENT_ELEMENT_INSERTED =
        xulApp.versionInRange(xulApp.platformVersion, "2.0b6", "*");

const ON_CONTENT = HAS_DOCUMENT_ELEMENT_INSERTED ? 'document-element-inserted' :
                   'content-document-global-created';

function listen() {
  observers.add(
    ON_CONTENT, function(domObj) {
      let window = HAS_DOCUMENT_ELEMENT_INSERTED ? domObj.defaultView : domObj;  
      if (window && (window.location+"").indexOf("http") >= 0) {
        //try{
          chromeembed.attachToWindow(XPCNativeWrapper.unwrap(window));
        //} catch(e){
        //  dump(e.message + "\n");
        //}
        window.document.addEventListener("DOMContentLoaded", function() {
          documentToInspect = window.document;
          dump("loaded\n");
        });
      }
    }
  );
}

exports.main = function(aOptions, aCallbacks) {
  gDevTools.registerTool(webGLInspectorToolDefinition);

  listen();
  return;
  pageMod.PageMod({
     include: ['*'],
     contentScriptWhen: 'start',
     //contentScript: 'window.alert("Page matches ruleset");',
     contentScriptFile: data.url("embed.js"),
     onAttach: function(worker) {
       throw "blah";
     }
  });

  return;


  // Listen for tab content loads.
  tabs.on('ready', function(tab) {
    dump("Add\n");
    tab.attach({
      contentScriptFile: data.url("inject-inspector.js")
    })
  });
}
