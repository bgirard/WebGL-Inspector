(function () {
    var ui = glinamespace("gli.ui");

    var Toolbar = function (w) {
        var self = this;
        var document = w.document;

        this.window = w;
        this.elements = {
            bar: w.root.getElementsByClassName("window-toolbar")[0]
        };
        this.buttons = {};
    };
    Toolbar.prototype.addSelection = function (name, tip) {
        var self = this;

        var el = document.createElement("div");
        el.className = "toolbar-button toolbar-button-enabled toolbar-button-command-" + name;

        el.title = tip;
        el.innerHTML = tip;

        el.onclick = function () {
            self.window.selectTab(name);
        };

        this.elements.bar.appendChild(el);

        this.buttons[name] = el;
    };
    Toolbar.prototype.toggleSelection = function (name) {
        for (var n in this.buttons) {
            var el = this.buttons[n];
            el.className = el.className.replace("toolbar-button-selected", "toolbar-button-enabled");
        }
        var el = this.buttons[name];
        if (el) {
            el.className = el.className.replace("toolbar-button-disabled", "toolbar-button-selected");
            el.className = el.className.replace("toolbar-button-enabled", "toolbar-button-selected");
        }
    };

    function writeDocument(document, elementHost) {
        var root = document.createElement("div");
        root.className = "window";

        // Toolbar
        // <div class="window-toolbar">
        // ...
        var toolbar = document.createElement("div");
        toolbar.className = "window-toolbar";
        root.appendChild(toolbar);

        // Middle
        // <div class="window-middle">
        // ...
        var middle = document.createElement("div");
        middle.className = "window-middle";
        root.appendChild(middle);

        if (elementHost) {
            elementHost.appendChild(root);
        } else {
            document.body.appendChild(root);
        }

        root.elements = {
            toolbar: toolbar,
            middle: middle
        };

        return root;
    };

    var Tab = function (w, container, name) {
        this.name = name;
        this.hasFocus = false;

        var el = this.el = document.createElement("div");
        el.className = "window-tab-root";
        container.appendChild(el);
    };
    Tab.prototype.gainFocus = function () {
        this.hasFocus = true;
        this.el.className += " window-tab-selected";
    };
    Tab.prototype.loseFocus = function () {
        this.hasFocus = false;
        this.el.className = this.el.className.replace(" window-tab-selected", "");
    };

    // TODO: move these someplace else
    var genericLeftRightView =
        '<div class="window-right-outer">' +
        '    <div class="window-right">' +
        '       <div class="window-right-inner">' +
        '           <!-- scrolling contents -->' +
        '       </div>' +
        '    </div>' +
        '    <div class="window-left">' +
        '        <div class="window-left-listing">' +
        '            <!-- state list -->' +
        '        </div>' +
        '        <div class="window-left-toolbar">' +
        '            ??</div>' +
        '    </div>' +
        '</div>';

    var TraceTab = function (w) {
        var html =
        '<div class="window-right-outer">' +
        '    <div class="window-right">' +
        '        <div class="window-trace-inspector">' +
        '            <!-- inspector -->' +
        '        </div>' +
        '        <div class="window-trace-outer">' +
        '            <div class="window-trace">' +
        '                <div class="trace-minibar">' +
        '                    <!-- minibar -->' +
        '                </div>' +
        '                <div class="trace-listing">' +
        '                    <!-- call trace -->' +
        '                </div>' +
        '            </div>' +
        '        </div>' +
        '    </div>' +
        '    <div class="window-left">' +
        '        <div class="window-left-listing">' +
        '            <!-- frame list -->' +
        '        </div>' +
        '        <div class="window-left-toolbar">' +
        '            capture, delete</div>' +
        '    </div>' +
        '</div>';
        this.el.innerHTML = html;

        this.frameListing = new gli.ui.FrameListing(w, this.el);
        this.traceView = new gli.ui.TraceView(w, this.el);

        this.frameListing.frameSelected.addListener(this, function (frame) {
            this.traceView.setFrame(frame);
        });

        var context = w.context;
        for (var n = 0; n < context.frames.length; n++) {
            var frame = context.frames[n];
            this.frameListing.appendFrame(frame);
        }
        if (context.frames.length > 0) {
            this.frameListing.selectFrame(context.frames[context.frames.length - 1]);
        }

        this.layout = function () {
            this.traceView.layout();
        };
    };

    var TimelineTab = function (w) {
    };

    var StateTab = function (w) {
        this.el.innerHTML = genericLeftRightView;
    };

    var TexturesTab = function (w) {
        this.el.innerHTML = genericLeftRightView;

        this.listing = new gli.ui.LeftListing(w, this.el, "texture", function (el, texture) {
            var number = document.createElement("div");
            number.className = "texture-item-number";
            number.innerHTML = texture.id;
            el.appendChild(number);
        });
        this.textureView = new gli.ui.TextureView(w, this.el);

        this.listing.valueSelected.addListener(this, function (texture) {
            this.textureView.setTexture(texture);
        });

        // TODO: append textures already present?
        var context = w.context;
        var textures = context.resources.getTextures();
        for (var n = 0; n < textures.length; n++) {
            var texture = textures[n];
            this.listing.appendValue(texture);
        }
    };

    var BuffersTab = function (w) {
        this.el.innerHTML = genericLeftRightView;

        this.listing = new gli.ui.LeftListing(w, this.el, "buffer", function (el, buffer) {
            var number = document.createElement("div");
            number.className = "buffer-item-number";
            number.innerHTML = buffer.id;
            el.appendChild(number);
        });
        this.bufferView = new gli.ui.BufferView(w, this.el);

        this.listing.valueSelected.addListener(this, function (buffer) {
            this.bufferView.setBuffer(buffer);
        });

        // TODO: append buffers already present?
        var context = w.context;
        var buffers = context.resources.getBuffers();
        for (var n = 0; n < buffers.length; n++) {
            var buffer = buffers[n];
            this.listing.appendValue(buffer);
        }
    };

    var ProgramsTab = function (w) {
        this.el.innerHTML = genericLeftRightView;

        this.listing = new gli.ui.LeftListing(w, this.el, "program", function (el, buffer) {
            var number = document.createElement("div");
            number.className = "program-item-number";
            number.innerHTML = buffer.id;
            el.appendChild(number);
        });
        this.programView = new gli.ui.ProgramView(w, this.el);

        this.listing.valueSelected.addListener(this, function (program) {
            this.programView.setProgram(program);
        });

        // TODO: append programs already present?
        var context = w.context;
        var programs = context.resources.getPrograms();
        for (var n = 0; n < programs.length; n++) {
            var program = programs[n];
            this.listing.appendValue(program);
        }
    };

    var Window = function (context, document, elementHost) {
        var self = this;
        this.context = context;
        this.document = document;

        this.root = writeDocument(document, elementHost);

        this.controller = new gli.replay.Controller();

        this.toolbar = new Toolbar(this);
        this.tabs = {};
        this.currentTab = null;

        var middle = this.root.elements.middle;
        function addTab(name, tip, implType) {
            var tab = new Tab(self, middle, name);

            if (implType) {
                implType.apply(tab, [self]);
            }

            self.toolbar.addSelection(name, tip);

            self.tabs[name] = tab;
        };

        addTab("trace", "Trace", TraceTab);
        addTab("timeline", "Timeline", TimelineTab);
        addTab("state", "State", StateTab);
        addTab("textures", "Textures", TexturesTab);
        addTab("buffers", "Buffers", BuffersTab);
        addTab("programs", "Programs", ProgramsTab);

        this.selectTab("trace");
    };

    Window.prototype.layout = function () {
        for (var n in this.tabs) {
            var tab = this.tabs[n];
            if (tab.layout) {
                tab.layout();
            }
        }
    };

    Window.prototype.selectTab = function (name) {
        if (this.currentTab && this.currentTab.name == name) {
            return;
        }
        console.log("switching to tab " + name);
        var tab = this.tabs[name];
        if (!tab) {
            return;
        }

        if (this.currentTab) {
            this.currentTab.loseFocus();
            this.currentTab = null;
        }

        this.currentTab = tab;
        this.currentTab.gainFocus();
        this.toolbar.toggleSelection(name);

        if (tab.layout) {
            tab.layout();
        }
    };

    Window.prototype.appendFrame = function (frame) {
        var tab = this.tabs["trace"];
        var frameListing = tab.frameListing;
        frameListing.appendFrame(frame);
        frameListing.selectFrame(frame);
    };

    ui.Window = Window;
})();