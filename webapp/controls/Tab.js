sap.ui.define(["sap/ui/core/Control"], function (Control) {
    "use strict";
  
    return Control.extend("hcm.ux.hapv5.controls.Tab", {
      metadata: {
        properties: {
            title:{
                type: "string",
                bindable: true,
            },
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
        aggregations: {},
        defaultAggregation: "content",
        events: {
        },
      },
      renderer: function (oRM, oControl) {
        oRM
          .openStart("div", oControl)
          .class("smod-tab")
          .class(oControl.getActive() ? "active" : null)
          .attr("data-tab-index", oControl.getTabIndex())
          .openEnd()
          .text(oControl.getTitle())
          .close("div");
      },
      ontap: function(){
        this.getParent().handleTabChange(this);
      }
    });
  });
  