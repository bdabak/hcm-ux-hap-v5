sap.ui.define(["sap/ui/core/Control"], function (Control) {
    "use strict";

    return Control.extend("hcm.ux.hapv5.controls.CircleStatContainer", {
        metadata: {
            properties: {
            },
            aggregations: {
                stats: {
                    type: "hcm.ux.hapv5.controls.CircleStat",
                    multiple: true,
                    singularName: "stat"
                }
            },
            defaultAggregation: "stats",
            events: {},
        },

        init: function () {
            //First activates
            var sLibraryPath = jQuery.sap.getModulePath("hcm.ux.hapv5"); //get the server location of the ui library
            jQuery.sap.includeStyleSheet(sLibraryPath + "/controls/CircleStat.css");
        },


        renderer: function (oRM, oControl) {
            const aStats = oControl.getStats() || [];
            oRM.openStart("div", oControl)
                .class("circle-stat-container")
                .class("circle-stat-container-" + aStats.length)
                .class("active")
                .openEnd() //Container
                .openStart("div")
                .class("circle-stat-container-row")
                .openEnd() //Row
                .openStart("div")
                .class("circle-stat-container-col")
                .openEnd() //Col
                .openStart("div")
                .class("circle-stat-container-grid")
                .openEnd(); //Grid

            aStats.forEach((oStat) => {
                oRM.renderControl(oStat);
            });
            oRM
                .close("div") //Grid
                .close("div") //Col
                .openStart("span")
                .class("close-icon")
                .openEnd()
                .text("close")
                .close("span")
                .close("div") //Row

                .openStart("div")
                .class("open-stats")
                .attr("role", "button")
                .attr("tabIndex", "0")
                .openEnd()
                .openStart("span")
                .class("open-stats-icon")
                .attr("title", "Süreç İlerleme Durumu")
                .openEnd()
                .text("bar_chart")
                .close("span")
                .close("div") //Button

                .close("div"); //Container
        },

        ontap: function(e){
            if($(e.target).hasClass("close-icon")){
                this.$().removeClass("active");
            }
            if($(e.target).hasClass("open-stats") || $(e.target).hasClass("open-stats-icon")) {
                this.$().addClass("active");
            }
        }


    });
});
