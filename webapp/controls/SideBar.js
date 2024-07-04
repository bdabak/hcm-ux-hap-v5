sap.ui.define(["sap/ui/core/Control"], function (Control) {
  "use strict";

  return Control.extend("hcm.ux.hapv5.controls.SideBar", {
    metadata: {
      properties: {
        title: {
          type: "string",
          bindable: true,
        },
        expandedLogo: {
          type: "sap.ui.core.URI",
          bindable: true,
        },
        collapsedLogo: {
          type: "sap.ui.core.URI",
          bindable: true,
        },
      },
      aggregations: {
        header: {
          type: "sap.ui.core.Control",
          multiple: false,
        },
        links: {
          type: "hcm.ux.hapv5.controls.SideBarNavLink",
          multiple: "true",
          singularName: "link",
        },
        footer: {
          type: "sap.ui.core.Control",
          multiple: false,
        },
      },
      defaultAggregation: "navLinks",
      events: {
        select: {
          parameters: {
            selectedItem: { type: "hcm.ux.hapv5.controls.SideBarNavLinkItem" },
          },
        },
      },
    },
    init: function () {
      var sLibraryPath = jQuery.sap.getModulePath("hcm.ux.hapv5"); //get the server location of the ui library
      jQuery.sap.includeStyleSheet(sLibraryPath + "/controls/SideBar.css");
    },
    renderer: function (oRM, oControl) {
      const aLinks = oControl.getLinks() || [];
      oRM
        .openStart("div", oControl)
        .class("smod-sb")
        .openEnd() //--Side filter main

        //--Logo
        .openStart("div")
        .class("smod-sb-logo-details")
        .openEnd()

      if (oControl.getExpandedLogo() && oControl.getCollapsedLogo()) {
        oRM
          .openStart("div") //--Logo icon
          .class("smod-sb-brand-logo")
          .class("toggleMenu")
          .openEnd()
          //--Expanded
          .voidStart("img") //--Logo image expandded
          .class("smod-sb-brand-logo-expanded")
		  .class("toggleMenu")
          .attr("role", "button")
          .attr("tabIndex", "0")
          .attr("src", oControl.getExpandedLogo())
		  .voidEnd()
          //--Expanded

          //--Collapsed
          .voidStart("img") //--Logo image collapsed
          .class("smod-sb-brand-logo-collapsed")
		  .class("toggleMenu")
          .attr("role", "button")
          .attr("tabIndex", "0")
          .attr("src", oControl.getCollapsedLogo())
		  .voidEnd()
          .close("div"); //-- Logo icon
       	  //--Collapsed
      } else {
        oRM
          .openStart("span") //--Logo icon
          .class("linkIcon")
          .class("toggleMenu")
          .openEnd()
          .text("menu")
          .close("span") //-- Logo icon
          .openStart("span") //--Logo title
          .class("smod-sb-title")
          .openEnd()
          .text(oControl.getTitle())
          .close("span"); //-- Logo title
      }

      oRM
        .close("div")
        //--Logo

        //--Header
        .openStart("div")
        .class("smod-sb-header")
        .openEnd()
        .renderControl(oControl.getHeader())
        .close("div")
        //--Header

        //--Nav links
        .openStart("ul")
        .class("smod-sb-nav-links")
        .openEnd();
      aLinks.forEach((oLink) => {
        oRM.renderControl(oLink);
      });
      oRM
        .openStart("li")
        .openEnd()
        //--Footer
        .openStart("div")
        .class("smod-sb-footer")
        .openEnd()
        .renderControl(oControl.getFooter())
        .close("div")
        //--Footer
        .close("li")
        .close("ul")
        //--Nav links

        .close("div"); //--Side filter main
    },
    ontap: function (e) {
      e.preventDefault();
      e.stopPropagation();
      if ($(e.target).hasClass("toggleMenu")) {
        this.$().toggleClass("close");
      }
    },
  });
});
