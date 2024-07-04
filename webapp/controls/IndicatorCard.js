sap.ui.define(["sap/ui/core/Control"], function (Control) {
    "use strict";
  
    return Control.extend("hcm.ux.hapv5.controls.IndicatorCard", {
      metadata: {
        properties: {
          label: {
            type: "string",
            bindable: true,
          },
          value: {
            type: "string",
            bindable: true,
          },
        },
        aggregations: {
          
        },
        events: {
        },
      },
      init: function () {
        //initialisation code, in this case, ensure css is imported
        var sLibraryPath = jQuery.sap.getModulePath("hcm.ux.hapv5"); //get the server location of the ui library
        jQuery.sap.includeStyleSheet(sLibraryPath + "/controls/IndicatorCard.css");
      },
      renderer: function (oRM, oControl) {

        oRM.openStart("div", oControl)
           .class("smod-indicator-card")
           .openEnd()
           .openStart("div")
           .class("smod-indicator-card-body")
           .openEnd()
           .openStart("h1")
           .class("smod-indicator-card-value")
           .openEnd()
           .text(oControl.getValue())
           .close("h1")
           .openStart("h6")
           .class("smod-indicator-card-label")
           .openEnd()
           .text(oControl.getLabel())
           .close("h6")
           .close("div")
           .close("div");
      },
    });
  });
  