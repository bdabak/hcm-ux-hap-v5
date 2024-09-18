sap.ui.define(
  ["sap/ui/core/Control", "sap/ui/core/IconPool"],
  function (Control, IconPool) {
    "use strict";

    return Control.extend("hcm.ux.hapv5.controls.SideBarNavLink", {
      metadata: {
        properties: {
          key: {
            type: "string",
            bindable: true,
          },
          text: {
            type: "string",
            bindable: true,
          },
          icon: {
            type: "string",
            bindable: true,
          },
          selected: {
            type: "boolean",
            bindable: true,
            defaultValue: false,
          },
        },
        aggregations: {
          items: {
            type: "hcm.ux.hapv5.controls.SideBarNavLinkItem",
            multiple: "true",
            singularName: "item",
          },
        },
        events: {
          press: {},
        },
      },
      init: function () {
      },
      renderer: function (oRM, oControl) {
        const aItems = oControl.getItems() || [];
        const sText = oControl.getText() || "";
        const sIcon = oControl.getIcon() || "";
        const bSelected = oControl.getSelected() || false;
        const bSapUiIcon = sIcon.includes("sap-icon://") || false;
        const sIconContent = IconPool.getIconInfo(sIcon)?.content || sIcon;
        oRM
          //--Side filter link
          .openStart("li", oControl)
          .class(aItems.length > 0 ? "menuLink" : "directLink")
          .class(aItems.length > 0 ? "showMenu" : "selectableItem")
          .class(bSelected ? "selected" : null)
          .openEnd();

        if (aItems.length === 0) {
          oRM
            .openStart("span")
            .openEnd()

            .openStart("span") //--Logo icon
            .class("linkIcon")
            .class(bSapUiIcon ? "sapUiIcon" : "customUiIcon")
            .attr("data-sap-ui-icon-content", sIconContent)
            .openEnd()
            .text(bSapUiIcon ? null : sIcon)
            .close("span") //-- Logo icon

            .openStart("span") //--Logo title
            .class("smod-sb-link-name")
            .openEnd()
            .text(sText)
            .close("span") //-- Logo title

            .close("span")

            //--Submenu
            .openStart("ul")
            .class("smod-sb-sub-menu")
            .class("blank")
            .openEnd()

            //--Item text
            .openStart("li")
            .openEnd()

            //--Popover link
            .openStart("span")
            .class("smod-sb-link-name")
            .openEnd()
            .text(sText)
            .close("span")
            //--Popover link

            .close("li")
            //--Item text

            .close("ul");
          //--Submenu
        } else {
          oRM
            .openStart("div")
            .class("smod-sb-icon-link")
            .openEnd()

            //--Item text & logo
            .openStart("span")
            .class("menuLink")
            .openEnd()

            .openStart("span") //--Logo icon
            .class("linkIcon")
            .class(bSapUiIcon ? "sapUiIcon" : "customUiIcon")
            .attr("data-sap-ui-icon-content", sIconContent)
            .openEnd()
            .text(bSapUiIcon ? null : sIcon)
            .close("span") //-- Logo icon

            .openStart("span") //--Logo title
            .class("smod-sb-link-name")
            .openEnd()
            .text(sText)
            .close("span") //-- Logo title

            .close("span")
            //--Item text & logo

            //--Chevron
            .openStart("span")
            .class("linkIcon")
            .class("customUiIcon")
            .class("arrowIcon")
            .openEnd()
            .text("expand_more")
            .close("span")
            //--Chevron

            .close("div")

            //--Submenu
            .openStart("ul")
            .class("smod-sb-sub-menu")
            .openEnd()

            //--Item text
            .openStart("li")
            .class("menuTitle")
            .openEnd()

            //--Popover header
            .openStart("span")
            .class("smod-sb-link-name")
            .class("menuLink")
            .openEnd()
            .text(sText)
            .close("span");
          //--Popover header

          //--Item text

          aItems.forEach((oItem) => {
            oRM.renderControl(oItem);
          });

          oRM.close("ul");
        }

        oRM.close("li");
        //--Side filter link
      },
      ontap: function (e) {
        e.preventDefault();
        e.stopPropagation();

        if (this.$().hasClass("menuLink")) {
          this.$().toggleClass("showMenu");
        }

        if (this.$().hasClass("directLink") && !this.$().hasClass("selected")) {
          $(".selectableItem").removeClass("selected");
          this.getParent()?.fireSelect({
            selectedItem: this,
          });
          this.$().addClass("selected");
          this.setProperty("selected", true, true);
        }
      },
    });
  }
);
