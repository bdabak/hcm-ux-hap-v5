sap.ui.define(["sap/ui/core/Control"], function (Control) {
  "use strict";

  return Control.extend("hcm.ux.hapv5.controls.InfoStat", {
    metadata: {
      properties: {
        info: {
          type: "object",
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
      jQuery.sap.includeStyleSheet(sLibraryPath + "/controls/InfoStat.css");
    },
    renderer: function (oRM, oControl) {
      const aInfo = oControl.getInfo();
      let sCount = 0;
      oRM.openStart("div", oControl).class("smod-info-stats").openEnd();
      //--Main

      oRM.openStart("table").class("smod-info-stats-table").openEnd();
      $.each(aInfo, function (i, oInfo) {
        if (sCount > 3) {
          jQuery.sap.log.error("Max four lines allowed!");
          return false;
        }
        oRM
          .openStart("tr")
          .openEnd()
          .openStart("td")
          .class("smod-info-stats-table-row-label")
          .openEnd()
          .text(oInfo.Label)
          .close("td")
          .openStart("td")
          .class("smod-info-stats-table-row-value")
          .openEnd()
          .text(oInfo.Value)
          .close("td")
          .close("tr");
        sCount++;
      });
      oRM
        .close("table")

        //--Main
        .close("div");
    },
  });
});
