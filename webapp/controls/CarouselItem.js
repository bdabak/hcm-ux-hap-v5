sap.ui.define(["sap/ui/core/Control"], function (Control) {
  "use strict";

  return Control.extend("hcm.ux.hapv5.controls.CarouselItem", {
    metadata: {
      properties: {
        index:{
            type: "int",
            bindable: true,
            defaultValue: null
        },
        active:{
            type: "boolean",
            bindable: true,
            defaultValue: false
        }
      },
      aggregations: {
        content:{
            type: "sap.ui.core.Control",
            multiple: false,
        }
      },
      defaultAggregation: "content",
      events: {},
    },
    renderer: function (oRM, oControl) {
        const bActive = oControl.getActive() || false;
      oRM
        .openStart("div", oControl)
        .class("smod-carousel-item")
        .class(bActive ? "active" : null)
        .openEnd()
        //Main
        .renderControl(oControl.getContent())
        //Main
        .close("div");
    },
  });
});
