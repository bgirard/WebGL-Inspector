var hasInjected = false;

// If we're reloading after enabling the inspector, load immediately
if (sessionStorage.WebGLInspectorEnabled == "yes") {
    hasInjected = true;

    // We have the loader.js file ready to help out
    var pathRoot = chrome.extension.getURL("");
    gliloader.load(["host", "replay", "ui"]);

    // Show icon
    chrome.extension.sendRequest({}, function (response) { });
}

// Once the DOM is ready, bind to the content event
document.addEventListener("DOMContentLoaded", function () {

    function performInjection() {
        if (hasInjected == false) {
            hasInjected = true;

            // We have the loader.js file ready to help out
            var pathRoot = chrome.extension.getURL("");
            gliloader.load(["host", "replay", "ui"], function () {

                // Fake a context loss/restore
                var resetEvent = document.createEvent("Event");
                resetEvent.initEvent("WebGLForceResetEvent", true, true);
                document.body.dispatchEvent(resetEvent);

            });
        }
    }

    chrome.extension.onRequest.addListener(function (msg) {
        if (msg.inject == true) {
            performInjection();
        }
        else if (msg.reload == true) {
            if (sessionStorage.WebGLInspectorEnabled == "yes") {
                sessionStorage.WebGLInspectorEnabled = "no";
            } else {
                sessionStorage.WebGLInspectorEnabled = "yes"
            }
            window.location.reload();
        }
        //sendResponse({});
    });

    document.body.addEventListener("WebGLEnabledEvent", function () {
        chrome.extension.sendRequest({}, function (response) { });
    }, false);
}, false);


// --------- NOTE: THIS FUNCTION IS INJECTED INTO THE PAGE DIRECTLY ---------
// This relies on us being executed before the dom is ready so that we can overwrite any calls
// to canvas.getContext. When a call is made, we fire off an event that is handled in our extension
// above (as chrome.extension.* is not available from the page).
function main() {
    var webglcanvases = null;

    // Create enabled event
    function fireEnabledEvent() {
        if (webglcanvases == null) {
            // Only setup events/etc on first enable
            webglcanvases = [];

            // Setup handling for reset
            function resetCanvas(canvas) {
                var lostEvent = document.createEvent("Event");
                lostEvent.initEvent("webglcontextlost", true, true);
                canvas.dispatchEvent(lostEvent);
                var restoreEvent = document.createEvent("Event");
                restoreEvent.initEvent("webglcontextrestored", true, true);
                canvas.dispatchEvent(restoreEvent);
            };

            // Listen for reset events
            document.body.addEventListener("WebGLForceResetEvent", function () {
                for (var n = 0; n < webglcanvases.length; n++) {
                    resetCanvas(webglcanvases[n]);
                }
            }, false);
        }

        // If gli exists, then we are already present and shouldn't do anything
        if (!window.gli) {
            var enabledEvent = document.createEvent("Event");
            enabledEvent.initEvent("WebGLEnabledEvent", true, true);
            document.body.dispatchEvent(enabledEvent);
        } else {
            console.log("WebGL Inspector already embedded on the page - disabling extension");
        }
    };

    // Rewrite getContext to snoop for webgl
    var originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function () {
        var ignoreCanvas = this.internalInspectorSurface;
        if (ignoreCanvas) {
            return originalGetContext.apply(this, arguments);
        }

        var result = originalGetContext.apply(this, arguments);
        if (result == null) {
            return null;
        }

        var contextNames = ["moz-webgl", "webkit-3d", "experimental-webgl", "webgl"];
        var requestingWebGL = contextNames.indexOf(arguments[0]) != -1;
        if (requestingWebGL) {
            // Page is requesting a WebGL context!
            fireEnabledEvent(this);
            if (webglcanvases.indexOf(this) == -1) {
                webglcanvases.push(this);
            }
        }

        if (requestingWebGL) {
            // If we are injected, inspect this context
            if (window["gli"] !== undefined) {
                if (gli.host.inspectContext) {
                    // TODO: pull options from extension
                    result = gli.host.inspectContext(this, result);
                }
            }
        }

        return result;
    };
}
var script = document.createElement('script');
script.appendChild(document.createTextNode('(' + main + ')();'));
(document.body || document.head || document.documentElement).appendChild(script);