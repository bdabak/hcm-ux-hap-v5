sap.ui.define(["sap/ui/core/Control", "../utils/CircularProgressBar"], function (Control, CircularProgressBarJS) {
    "use strict";

    return Control.extend("hcm.ux.hapv5.controls.CircleStat", {
        metadata: {
            properties: {
                value: { type: "float", bindable: true, defaultValue: 0 },
                index: { type: "string", bindable: true },
                size: { type: "int", bindable: true, defaultValue: 60 },
                label: { type: "string", bindable: true },
                ranges:{
                    type: "object",
                    bindable: true,
                    defaultValue: [
                        {
                            limit: 25, color: "#d32f2f",
                        },
                        {
                            limit: 50, color: "#9c27b0",
                        },
                        {
                            limit: 75, color: "#f57f17",
                        },
                        {
                            limit: 100, color: "#388e3c",
                        },
                    ]
                }
            },
            aggregations: {

            },
            events: {

            },
        },

        onAfterRendering: function () {
            this._circle = new CircularProgressBar(this.getIndex());
            this._circle.initial();
        },

        calculateColor: function(){
            const aRanges = this.getRanges() || [];
            const fValue = this.getValue();
            let sColor;

            aRanges.every((oRange)=>{
                if(fValue <= oRange.limit){
                    sColor = oRange.color;
                    return false;
                }
                return true;
            });

            return sColor;
        },

        renderer: function (oRM, oControl) {
            if (!oControl.getIndex()) {
                oControl._iIndex = Math.floor(Math.random() * 1000000);
                const sId = "circle-stat-" + oControl._iIndex;
                oControl.setProperty("index", sId, true);
            }

            oRM.openStart("div", oControl)
                .class("circle-stat-main")
                .openEnd()
                .openStart("div")
                .attr("id", oControl.getIndex())
                .class("circle-stat")
                .attr("data-pie", `{ "index": ${oControl._iIndex},"size":${oControl.getSize()}, "strokeBottom": 4,"percent": ${oControl.getValue()},"colorSlice": "${oControl.calculateColor()}", "colorCircle": "#dcdcdc", "round": true, "fill": "#fefefe"}`)
                .openEnd()
                .close("div") //Text
                .openStart("div")
                .class("circle-stat-label")
                .openEnd()
                .text(oControl.getLabel())
                .close("div") //Text
                .close("div"); //Main
        },


    });
});
