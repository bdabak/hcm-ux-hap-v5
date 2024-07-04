sap.ui.define(["sap/ui/core/Control"], function (Control) {
    "use strict";
  
    return Control.extend("hcm.ux.hapv5.controls.TabContent", {
      metadata: {
        properties: {
          tabIndex:{
            type: "int",
            bindable: true,
          },
          active:{
            type: "boolean",
            bindable: true,
            defaultValue: false
         }
        },
        aggregations: {
            content:{
                type:"sap.ui.core.Control",
                multiple: false,
            }
        },
        defaultAggregation: "content",
        events: {
         
        },
      },
      renderer: function (oRM, oControl) {
        oRM
          .openStart("div", oControl)
          .class("smod-tab-content")
          .class(oControl.getActive() ? "active" : null)
          .attr("data-tab-index", oControl.getTabIndex())
          .openEnd()
          .renderControl(oControl.getContent())
          .close("div");
      },
    });
  });
  