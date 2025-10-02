(function () {
    const { xmp } = require("uxp");
    const {
        app,
        action: { batchPlay },
    } = require("photoshop");

    // Utility function to fetch the XMPMetadataAsUTF8 property
    // from the current document or layer.

    function fetchXMPMetadata(contextType) {
        const targetType = contextType;
        const res = batchPlay(
            [
                {
                    _obj: "get",
                    _target: {
                        _ref: [
                            { _property: "XMPMetadataAsUTF8" },
                            {
                                _ref: targetType,
                                _enum: "ordinal",
                                _value: "targetEnum",
                            },
                        ],
                    },
                },
            ],
            { synchronousExecution: true }
        );

        if (res[0].hasOwnProperty("XMPMetadataAsUTF8")) {
            // avoid "require is not a constructor" error
            const meta = new xmp.XMPMeta(res[0].XMPMetadataAsUTF8);
            meta.context = targetType;
            return meta;
        } else {
            // I don't return a new XMPMeta instance here because it wouldn't be
            // what ExtendScript did, and I believe ExtendScript backwards compatibility
            // is really important.
            return undefined;
        }
    }

    // Extend the original XMPMeta class to add contxt property
    if (!xmp.XMPMeta.prototype.hasOwnProperty("context")) {
        Object.defineProperty(xmp.XMPMeta.prototype, "context", {
            writable: true,
            value: "document", // Default value
        });
    }

    // Extend the original XMPMeta class to add rawData property
    if (!xmp.XMPMeta.prototype.hasOwnProperty("rawData")) {
        Object.defineProperty(xmp.XMPMeta.prototype, "rawData", {
            get: function () {
                const targetType =
                    this.context === "document" ? "document" : "layer";
                const res = batchPlay(
                    [
                        {
                            _obj: "get",
                            _target: {
                                _ref: [
                                    { _property: "XMPMetadataAsUTF8" },
                                    {
                                        _ref: targetType,
                                        _enum: "ordinal",
                                        _value: "targetEnum",
                                    },
                                ],
                            },
                        },
                    ],
                    { synchronousExecution: true }
                );

                if (res[0].hasOwnProperty("XMPMetadataAsUTF8")) {
                    return res[0].XMPMetadataAsUTF8;
                }
                return undefined;
            },
            set: function (value) {
                const targetType =
                    this.context === "document" ? "document" : "layer";
                const res = batchPlay(
                    [
                        {
                            _obj: "set",
                            _target: [
                                {
                                    _ref: "property",
                                    _property: "XMPMetadataAsUTF8",
                                },
                                {
                                    _ref: targetType,
                                    _enum: "ordinal",
                                    _value: "targetEnum",
                                },
                            ],
                            to: {
                                _obj: targetType,
                                XMPMetadataAsUTF8: value,
                            },
                        },
                    ],
                    { synchronousExecution: true }
                );

                if (res[0]?._obj === "error") {
                    throw new Error(res[0].message);
                }
            },
        });
    }

    // Define property on Document prototype
    if (!app.Document.prototype.hasOwnProperty("xmpMetadata")) {
        Object.defineProperty(app.Document.prototype, "xmpMetadata", {
            get: function () {
                return fetchXMPMetadata("document");
            },
            enumerable: true,
            configurable: false,
        });
    }

    // The Symbol ensures a unique and non-conflicting property name that cannot be accidentally accessed
    // or modified externally. It's used to store the actual XMP metadata for a layer, allowing us to
    // separate the internal representation from the getter and setter logic of the `xmpMetadata` property.
    // This approach helps in avoiding infinite recursion issues when defining custom setters.
    const XMP_METADATA_SYMBOL = Symbol("xmpMetadata");

    // Define property on Layer prototype
    if (!app.Layer.prototype.hasOwnProperty("xmpMetadata")) {
        Object.defineProperty(app.Layer.prototype, "xmpMetadata", {
            get: function () {
                return this[XMP_METADATA_SYMBOL] || fetchXMPMetadata("layer");
            },
            // This is needed for when the user sets the metadata on a layer that
            // doesn't have any, like this:
            //
            // var xmpMeta = new XMPMeta()
            // xmpMeta.setProperty(...)
            // Layer.xmpMetadata = xmpMeta
            //
            // This is to keep the same ExtendScript's behaviour: when a Layer doesn't have
            // any metadata, its xmpMetadata property is undefined
            // (and not an empty XMPMeta, which would be easier to implement).
            set: function (meta) {
                if (meta instanceof require("uxp").xmp.XMPMeta) {
                    if (!this[XMP_METADATA_SYMBOL]) {
                        this[XMP_METADATA_SYMBOL] =
                            new (require("uxp").xmp.XMPMeta)();
                        this[XMP_METADATA_SYMBOL].context = "layer"; // Set the context here
                    }
                    this[XMP_METADATA_SYMBOL].rawData = meta.serialize();
                } else {
                    throw new Error(
                        "Invalid data type. Expected an instance of XMPMeta."
                    );
                }
            },
            enumerable: true,
            configurable: false,
        });
    }
})();
