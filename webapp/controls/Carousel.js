sap.ui.define(["sap/ui/core/Control"], function (Control) {
  "use strict";

  return Control.extend("hcm.ux.hapv5.controls.Carousel", {
    metadata: {
      properties: {
        activeIndex: {
          type: "int",
          bindable: true,
          defaultValue: 0,
        },
        slideInterval: {
          type: "int",
          bindable: true,
          defaultValue: 5000,
        },
      },
      aggregations: {
        items: {
          type: "hcm.ux.hapv5.controls.CarouselItem",
          multiple: true,
          singularName: "item",
        },
      },
      defaultAggregation: "items",
      events: {},
    },

    init: function () {
      //First activates
      var sLibraryPath = jQuery.sap.getModulePath("hcm.ux.hapv5"); //get the server location of the ui library
      jQuery.sap.includeStyleSheet(sLibraryPath + "/controls/Carousel.css");

      this._rendered = false;
    },

    onAfterRendering: function () {
      if (!this._rendered) {
        this._rendered = true;
        const iSlideInterval = this.getSlideInterval();
        if (iSlideInterval > 0) {
          this._oSlideInterval = setInterval(() => {
            if(this._isPaused !== true){
                this.handleSlide("+");
            }
          }, iSlideInterval);
        }
      }
    },

    destroy: function () {
      if (this._oSlideInterval) {
        clearInterval(this._oSlideInterval);
      }
    },

    renderer: function (oRM, oControl) {
      const aItems = oControl.getItems() || [];
      const iActiveIndex = oControl.getActiveIndex() || 0;

      oRM.openStart("div", oControl).class("smod-carousel").openEnd();
      //Container

      //--Anchors
      oRM.openStart("ol").class("smod-carousel-indicators").openEnd();

      aItems.forEach((_, i) => {
        oRM
          .openStart("li")
          .class("smod-carousel-indicator")
          .class(i === iActiveIndex ? "active" : null)
          .attr("data-slide-to", i)
          .openEnd()
          .close("li");
      });

      oRM.close("ol");
      //--Anchors

      //--Inner
      oRM.openStart("div").class("smod-carousel-inner").openEnd();
      aItems.forEach((oItem, i) => {
        oItem.setActive(i === iActiveIndex);
        oItem.setIndex(i);
        oRM.renderControl(oItem);
      });
      oRM.close("div");
      //--Inner

      //--Buttons
      oRM
        .openStart("a")
        .class("smod-carousel-control-prev")
        .attr("role", "button")
        .attr("data-slide", "prev")
        .openEnd()
        .openStart("span")
        .class("smod-carousel-icon")
        .class("smod-carousel-icon-prev")
        .openEnd()
        .text("arrow_back_ios")
        .close("span")
        .close("a");

      oRM
        .openStart("a")
        .class("smod-carousel-control-next")
        .attr("role", "button")
        .attr("data-slide", "next")
        .openEnd()
        .openStart("span")
        .class("smod-carousel-icon")
        .class("smod-carousel-icon-next")
        .openEnd()
        .text("arrow_forward_ios")
        .close("span")
        .close("a");
      //--Buttons

      oRM.close("div"); //Container
    },

    ontap: function (e) {
      if (
        $(e.target).hasClass("smod-carousel-control-prev") ||
        $(e.target).hasClass("smod-carousel-icon-prev")
      ) {
        this.handleSlide("-");
      }

      if (
        $(e.target).hasClass("smod-carousel-control-next") ||
        $(e.target).hasClass("smod-carousel-icon-next")
      ) {
        this.handleSlide("+");
      }
    },
    handleSlide: function (sDirection) {
      let sPrevIndex = this.getActiveIndex();
      let sNextIndex = sPrevIndex;
      const aItems = this.getItems();

      if (sDirection === "+") {
        sNextIndex++;
        if (sNextIndex > aItems.length - 1) {
          sNextIndex = 0;
        }
      } else {
        sNextIndex--;
        if (sNextIndex < 0) {
          sNextIndex = aItems.length - 1;
        }
      }

      aItems[sPrevIndex]?.$()?.fadeOut(() => {
        aItems[sNextIndex]?.$()?.fadeIn();
        this.setActiveIndex(sNextIndex);
      });
    },
    onmouseover:function(){
        this._isPaused = true;
    },
    onmouseout:function(){
        this._isPaused = false;
    }
  });
});
