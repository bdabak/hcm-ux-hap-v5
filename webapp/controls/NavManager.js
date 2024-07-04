sap.ui.define(["sap/ui/core/Control"], function (Control) {
  "use strict";

  return Control.extend("hcm.ux.hapv5.controls.NavManager", {
    metadata: {
      properties: {},
      aggregations: {
        sideContent: {
          type: "sap.ui.core.Control",
          multiple: false,
        },
        mainContent: {
          type: "sap.ui.core.Control",
          multiple: false,
        },
        topContent:{
          type: "sap.ui.core.Control",
          multiple: false,
        }
      },
      events: {
        press: {},
      },
    },
    init: function () {
      //initialisation code, in this case, ensure css is imported
      var sLibraryPath = jQuery.sap.getModulePath("hcm.ux.hapv5"); //get the server location of the ui library
      jQuery.sap.includeStyleSheet(sLibraryPath + "/controls/NavManager.css");
    },
    renderer: function (oRM, oControl) {
      oRM
        .openStart("div", oControl)
        .class("smod-nav-manager")
        .openEnd()
        .openStart("div")
        .class("smod-nav-manager-side-content")
        .openEnd()
        .renderControl(oControl.getSideContent())
        .close("div");

        //--Right content
        oRM.openStart("div")
        .class("smod-nav-manager-right-content")
        .openEnd()
        if(oControl.getTopContent()){
          oRM.openStart("div")
          .class("smod-nav-manager-top-content")
          .openEnd()
          .renderControl(oControl.getTopContent())
          .close("div");
        }
        
        oRM.openStart("div")
        .class("smod-nav-manager-main-content")
        .openEnd()
        .renderControl(oControl.getMainContent())
        .close("div")
         //--Main content
        .close("div")
         //--Right content
       

        .close("div");
    },
  });
});
