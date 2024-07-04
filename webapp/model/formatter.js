sap.ui.define([], function () {
  "use strict";

  return {
    /**
     * Rounds the number unit value to 2 digits
     * @public
     * @param {string} sValue the number string to be rounded
     * @returns {string} sValue with 2 digits rounded
     */
    numberUnit: function (sValue) {
      if (!sValue) {
        return "";
      }
      return parseFloat(sValue).toFixed(2);
    },
    getImagePath: function (sPath) {
      var sImagePath = jQuery.sap.getModulePath(
        "hcm.ux.hapv5",
        "/images/loading.gif"
      );

      return sImagePath;
    },
    getStatusText: function (sName, sSubName) {
      var sLabel = "";
      sLabel = sName !== "" ? sName : "";
      if (sLabel !== "" && sSubName !== "") {
        sLabel = sLabel + " - " + sSubName;
      } else if (sSubName !== "") {
        sLabel = sSubName;
      }
      return sLabel;
    },
    convertToStartCase: function (sSentence) {
      var aWords = sSentence.split(" ");
      var sConverted = "";

      $.each(aWords, function (sIndex, sWord) {
        var sNewWord =
          sWord.substr(0, 1).toUpperCase() + sWord.substr(1).toLowerCase();
        if (sConverted === "") {
          sConverted = sNewWord;
        } else {
          sConverted = sConverted + " " + sNewWord;
        }
      });
      return sConverted;
    },
    convertToIntegerDecimal: function (sValue) {
      try {
        if (sValue % 1 == 0) {
          return parseInt(sValue);
        } else {
          return parseFloat(sValue).toFixed(2);
        }
      } catch (oErr) {
        return sValue;
      }
    },
    convertFloatToString: function (fVal) {
      return fVal.toLocaleString().replaceAll(",", "").replaceAll(".", ",");
    },
    formatFloat: function (d, v) {
      var oFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
        groupingEnabled: true, // grouping is enabled
        groupingSeparator: ".", // grouping separator is '.'
        groupingSize: 3, // the amount of digits to be grouped (here: thousand)
        decimalSeparator: ",", // the decimal separator must be different from the grouping separator
        decimals: d,
      });
      return oFormat.format(v);
    },
    convertMessageType: function (sMsgty) {
      switch (sMsgty) {
        case "E":
        case "A":
        case "X":
          return sap.ui.core.MessageType.Error;
        case "W":
          return sap.ui.core.MessageType.Warning;
        case "I":
          return sap.ui.core.MessageType.Information;
        case "S":
          return sap.ui.core.MessageType.Success;
        default:
          return sap.ui.core.MessageType.None;
      }
    },
    convertMessageTitle: function (sMsgty) {
      switch (sMsgty) {
        case "E":
        case "A":
        case "X":
          return "Hata";
        case "W":
          return "Uyarı";
        case "I":
          return "Bilgi";
        case "S":
          return "Başarı";
        default:
          return "Mesaj";
      }
    },
    formatWeighting: function (v, d = 2, u = true) {
      if (!parseFloat(v) >= 1) {
        return null;
      }
      var oFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
        groupingEnabled: false, // grouping is enabled
        decimalSeparator: ",", // the decimal separator must be different from the grouping separator
        decimals: d,
      });

      var f = oFormat.format(parseFloat(v));

      if (u) {
        f = " (" + f + "%)";
      }

      return f;
    },
  };
});
