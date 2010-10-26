Getting Started
====================

Running the Inspector
---------------------
There are currently two ways to use the inspector - one is to directly embed it in your GL application (should work in all browsers that
support WebGL), and the other is to use one of the supported extensions.

### Directly Embedding
*NOTE*: this will eventually get prettier (a single js file and a single initialize call)
* include all .js files under core/
* link in style sheet core/ui/gli.css
* after you getContext on your canvas, call:
        gl = gli.inspectContext(canvas, rawgl, {
            breakOnError: false,
            frameSeparator: 'finish'
        });
* setup the UI (this will go away):
        gli.ui.inject();
        gli.ui.initialize(gl, document.getElementById("gli-window"), document.getElementById("gli-statehud"), document.getElementById("gli-outputhud"));
* add a `gl.finish()` call at the end of your frame loop

### Chrome Extension
* create a symlink from core/ to extensions/chrome/core/ (`ln -s` on unix or `mklink /D` on Windows)
* navigate to chrome://extensions
* click 'load unpacked extension...' and select the extensions/chrome/ directory
* open a page with WebGL content and click the 'GL' icon in the top right of the address bar
* see below for instructions on how to get sites working

Supported Content
---------------------
*NOTE*: if you know of any good ways to get around this, let me know! :)
Due to the WebGL API some minor changes are required to get the inspector working.

In all cases, a frame separation call is required to let the inspector know when a frame ends. The default is `gl.finish()`, but it can be changed
in the options. If it's not possible to modify the code you can change the call to something you know happens first every frame, such as a call to
`gl.viewport()` or `gl.clear()`, however this can be unreliable.

When using the extensions it is required that the page implement WebGL context loss/restoration logic with a special rule: in the webglcontextrestored
you must throw out the existing WebGLRenderingContext returned from the `canvas.getContext()` call and request a new one. 
For example:
    canvas.addEventListener("webglcontextrestored", function () {
        gl = canvas.getContext("experimental-webgl");
        // ... reload the rest of the resources as normal
    }, false);
*NOTE*: I'd like to find a way to remove this restriction, but am not sure it's possible with the Chrome/Safari security restrictions - ideas welcome