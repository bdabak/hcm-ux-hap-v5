sap.ui.define([
	"sap/ui/core/Control"
], function(
	Control
) {
	"use strict";

	return Control.extend("hcm.ux.hapv5.controls.SideBarNavLinkItem", {
        metadata: {
            properties: {
              text:{
                type: "string",
                bindable: true
              },
              key:{
                type: "string",
                bindable: true
              }
            },
            aggregations: {
              
            },
            events: {
              
            },
          },
          init: function () {
          
          },
          renderer: function (oRM, oControl) {
            const sText = oControl.getText() || "";
            oRM
            //--Item text
            .openStart("li",oControl)
            .attr("key", oControl.getKey())
            .openEnd()

            //--Item link
            .openStart("span")
            .class("selectableItem")
            .openEnd()
            .text(sText)
            .close("span")
            //--Item link

            .close("li");
          //--Item text
          },
          ontap: function(e){
            e.preventDefault();
            e.stopPropagation();
            if($(e.target).hasClass("selectableItem") && !$(e.target).hasClass("selected")){
              $(".selectableItem").removeClass("selected");
              $(e.target).addClass("selected");
              this.getParent()?.getParent()?.fireSelect({
                selectedItem: this
              });
            }
          }
	});
});