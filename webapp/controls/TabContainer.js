sap.ui.define(["sap/ui/core/Control"], function (Control) {
  "use strict";

  return Control.extend("hcm.ux.hapv5.controls.TabContainer", {
    metadata: {
      properties: {
        activeTabIndex: {
          type: "int",
          bindable: true,
          defaultValue: 0,
        },
      },
      aggregations: {
        tabs: {
          type: "hcm.ux.hapv5.controls.Tab",
          multiple: true,
          singularName: "tab",
        },
        contents: {
          type: "hcm.ux.hapv5.controls.TabContent",
          multiple: true,
          singularName: "content",
        },
      },
      events: {
        tabChange: {
          parameters: {
            tabIndex: { type: "int" },
          },
        },
      },
    },
    init: function () {
      //initialisation code, in this case, ensure css is imported
      var sLibraryPath = jQuery.sap.getModulePath("hcm.ux.hapv5"); //get the server location of the ui library
      jQuery.sap.includeStyleSheet(sLibraryPath + "/controls/Tab.css");
    },
    renderer: function (oRM, oControl) {
      const aTab = oControl.getAggregation("tabs");
      const aContent = oControl.getAggregation("contents");
      oRM.openStart("div", oControl).class("smod-tab-container").openEnd();

      //--Tab
      oRM.openStart("div").class("smod-tabs").openEnd();
      aTab.forEach((oTab, i) => {
        oTab.setTabIndex(i);
          oTab.setActive(oControl.getActiveTabIndex() === i);
        oRM.renderControl(oTab);
      });
      oRM.close("div");

      //--Content
      aContent.forEach((oContent, i) => {
        oContent.setTabIndex(i);
        oContent.setActive(oControl.getActiveTabIndex() === i);
        oRM.renderControl(oContent);
      });

      oRM.close("div");
    },
    handleTabChange: function(oTab){
      this.fireTabChange({
        tabIndex: oTab.getTabIndex()
      });

      this.setActiveTabIndex(oTab.getTabIndex());
    }
  });
});
