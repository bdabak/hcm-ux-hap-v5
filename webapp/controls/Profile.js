sap.ui.define(["sap/ui/core/Control"], function (Control) {
  "use strict";

  return Control.extend("hcm.ux.hapv5.controls.Profile", {
    metadata: {
      properties: {
        src: {
          type: "string",
          bindable: true,
        },
        title: {
          type: "string",
          bindable: true,
        },
        info1: {
          type: "string",
          bindable: true,
        },
        info2: {
          type: "string",
          bindable: true,
        },
        info3: {
          type: "string",
          bindable: true,
        },
        showDetail: {
          type: "boolean",
          bindable: true,
          defaultValue: false,
        },
      },
      aggregations: {
        _avatar: {
          type: "sap.f.Avatar",
          multiple: false,
        },
      },
      events: {
        press: {},
      },
    },
    init: function () {
      //initialisation code, in this case, ensure css is imported
      const sLibraryPath = jQuery.sap.getModulePath("hcm.ux.hapv5"); //get the server location of the ui library
      jQuery.sap.includeStyleSheet(sLibraryPath + "/controls/Profile.css");

      const oAvatar = new sap.f.Avatar({
        displaySize: "M",
        showBorder: true,
        press: () => {
          this.firePress();
        },
      }).addStyleClass("smod-profile-avatar");

      this.setAggregation("_avatar", oAvatar);

      this._initialSrc =
        jQuery.sap.getModulePath("hcm.ux.hapv5") + "/images/image_loading.gif";
    },
    onAfterRendering: function(){
      const bShowDetail = this.getShowDetail();
      const that = this;
      if (!bShowDetail) {
        return;
      }

      const oIcon = this.$().find(".smod-profile-content-info-icon")[0];
      
      if(oIcon && !this._oTippy){
        let iTimeout = setTimeout(()=>{
          this._oTippy ?  this._oTippy.show() : null;
        },2000);

        this._oTippy = tippy(oIcon, {
          theme: "material",
          animation: "scale",
          placement: "right",
          delay: [0, 2000],
          content: "Nitelik CV'si",
          onDestroy: function (instance) {
            that._tooltipIsOn = false;
            this._oTippy.destroy();
            this._oTippy = null;
            clearTimeout(iTimeout);
          },
          onHide: function (instance) {
            that._tooltipIsOn = false;
            clearTimeout(iTimeout);
            this._oTippy = null;
          },
          onClickOutside: function (instance) {
            that._tooltipIsOn = false;
            clearTimeout(iTimeout);
            this._oTippy = null;
          },
          onMount: function(){
            that._tooltipIsOn = true;
          }
        });
      }

    },
    renderer: function (oRM, oControl) {
      const sSrc = oControl.getSrc() ? oControl.getSrc() : this._initialSrc;
      const oAvatar = oControl.getAggregation("_avatar");
      const bShowDetail = oControl.getShowDetail();

      //--set image source
      oAvatar.setSrc(sSrc);

      oRM
        .openStart("div", oControl)
        .class("smod-profile")
        .openEnd()

        //--Avatar
        .openStart("div")
        .class("smod-profile-avatar")
        .openEnd()
        .renderControl(oAvatar)
        .close("div")
        //--Avatar

        //--Title and info content
        .openStart("div")
        .class("smod-profile-content")
        .openEnd()

        .openStart("span")
        .class("smod-profile-content-title")
        .openEnd()
        .text(oControl.getTitle())
        .close("span")

        .openStart("span")
        .class("smod-profile-content-info")
        .openEnd()
        .text(oControl.getInfo1())
        .close("span")

        .openStart("span")
        .class("smod-profile-content-info")
        .openEnd()
        .text(oControl.getInfo2())
        .close("span")

        .openStart("span")
        .class("smod-profile-content-info")
        .openEnd()
        .text(oControl.getInfo3())
        .close("span")
        .close("div");
      //--Title and info content
      if (bShowDetail) {
        oRM
          .openStart("span")
          .class("smod-profile-content-info-icon")
          .openEnd()
          .text("person_search")
          .close("span");
      }

      oRM.close("div");
    },

    ontap: function (e) {
      if ($(e.target).hasClass("smod-profile-content-info-icon")) {
        this.firePress();
      }
    },
    onmouseover: function (e) {
      const bShowDetail = this.getShowDetail();
      const that = this;
      if (!bShowDetail) {
        return;
      }
      e.stopPropagation();
      if (
        ($(e.target).hasClass("smod-profile-content-info-icon") ||
          $(e.target).hasClass("smod-profile-avatar")) &&
        !this._tooltipIsOn
      ) {
        
        tippy($(e.target)[0], {
          theme: "material",
          animation: "scale",
          placement: "right",
          delay: [50, 0],
          content: "Nitelik CV'si",
          onDestroy: function (instance) {
            that._tooltipIsOn = false;
          },
          onHide: function (instance) {
            that._tooltipIsOn = false;
          },
          onClickOutside: function (instance) {
            that._tooltipIsOn = false;
          },
          onMount: function(){
            that._tooltipIsOn = true;
          }
        });
      }
    },
  });
});
