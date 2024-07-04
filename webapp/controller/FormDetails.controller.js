/*global _,moment*/
sap.ui.define(
  [
    "hcm/ux/hapv5/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/MessagePopover",
    "sap/m/MessagePopoverItem",
    "com/smod/ux/mat/controls/MessageAlert",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/format/DateFormat",
    "com/smod/ux/lib/controls/ResultBoard",
    "com/smod/ux/lib/controls/Switch",
    "sap/f/GridContainer",
    "sap/f/GridContainerSettings",
    "sap/ui/core/Fragment",
    "hcm/ux/hapv5/model/formatter",
  ],
  function (
    BaseController,
    JSONModel,
    History,
    MessageToast,
    MessageBox,
    MessagePopover,
    MessageItem,
    MessageAlert,
    Filter,
    FilterOperator,
    DateFormat,
    ResultBoard,
    Switch,
    GridContainer,
    GridContainerSettings,
    Fragment,
    formatter
  ) {
    "use strict";

    return BaseController.extend("hcm.ux.hapv5.controller.FormDetails", {
      formatter: formatter,
      hasChanges: false,
      formUIElements: [],

      /* =========================================================== */
      /* lifecycle methods                                           */
      /* =========================================================== */

      /**
       * Called when the worklist controller is instantiated.
       * @public
       */
      onInit: function () {
        // Model used to manipulate control states. The chosen values make sure,
        // detail page is busy indication immediately so there is no break in
        // between the busy indication for loading the view's meta data
        var oViewModel = new JSONModel(this._defineInitialModel());

        var oGraphModel = new JSONModel();

        //Set page layout
        this._oPageLayout = this.byId("idDetailObjectPageLayout");
        this._oNavContainer = this.byId("idPageNavigationContainer");

        // Store original busy indicator delay, so it can be restored later on
        this.setModel(oViewModel, "formDetailsModel");
        this.setModel(oGraphModel, "formGraphModel");

        this.getRouter()
          .getRoute("formdetail")
          .attachPatternMatched(this._onPatternMatched, this);

        var that = this;

        $(function () {
          window.onhashchange = function (oEvent) {
            var oHash = oEvent.currentTarget.hasher.getHash();
            if (oHash.indexOf("GetDetail") === -1) {
              that._initializeViewModel();
              that._setChangeListeners(false);
            }
            if (that._oTour) {
              that._oTour?.cancel();
              that._oTour?.destroy();
            }
          };
        });
      },

      /* =========================================================== */
      /* event handlers                                              */
      /* =========================================================== */

      onNavBack: function (sFromSave) {
        this._doNavBack(false);
      },

      onExit: function (oEvent) {
        this._initializeViewModel();
        this._setChangeListeners(false);
      },
      // onAutoSave: function (oEvent) {
      //   this._handleSaveDocument(false, true);
      // },
      onMessagesButtonPress: function (oEvent) {
        var oViewModel = this.getModel("formDetailsModel");
        var that = this;
        if (!this._oMessagePopover) {
          this._oMessagePopover = new MessagePopover({
            items: {
              path: "/formMessages",
              template: new MessageItem({
                type: "{type}",
                title: "{message}",
              }),
            },
            headerButton: new sap.m.Button({
              icon: "sap-icon://delete",
              text: "{i18n>clearMessages}",
              press: function () {
                that._removeAllMessages();
                that._oMessagePopover.close();
              },
            }),
          });
          this._oMessagePopover.setModel(oViewModel);
          // this._oMessagePopover.attachAfterClose(null, function () {
          // 	that._removeAllMessages();
          // }, this);
        }
        if (oEvent) {
          this._oMessagePopover.openBy(oEvent.getSource());
        } else {
          var oNavContainer = this.byId("idPageNavigationContainer");
          var oCurrentPage = oNavContainer.getCurrentPage();
          this._oMessagePopover.openBy(
            oCurrentPage.getFooter().getAggregation("content")[0]
          );
        }
      },
      onEmployeeInfo: function (oEvent) {
        const sId = oEvent.getSource().data("EmployeeId") || null;
        const oModel = this.getModel();
        const oViewModel = this.getModel("formDetailsModel");

        if (!sId) {
          return;
        }

        const oUrlParam = {
          Pernr: sId,
          Datum: oViewModel.getProperty("/formData/HeaderDates/ApStartDate"),
        };

        oModel.callFunction("/GetEmployeeInfo", {
          urlParameters: oUrlParam,
          success: (oData) => {
            Swal.fire({
              title: `<strong>Çalışan Bilgileri</strong>`,
              customClass: {
                popup: "widerSwalContainer",
              },
              html: `
                <div class="employeeInfoPopup">
                  <table class="smodTableResponsive">
                    <tbody>
                    <tr>
                      <td><span class="rowLabel">Çalışanın Mevcut Ünvanı / Kademesi</span></td>
                      <td>${oData.Stltx} / ${oData.Trfgr}</td>
                    </tr>
                    <tr>
                      <td><span class="rowLabel">Kademe Atlama Tarihi</span></td>
                      <td>${this._formatDate(oData.Stvor)}</td>
                    </tr>
                    <tr>
                      <td><span class="rowLabel">Toplam Tecrübe Süresi</span></td>
                      <td>${formatter.convertFloatToString(
                        oData.Senyr
                      )} Yıl</td>
                    </tr>
                    <tr>
                      <td><span class="rowLabel">Son Değerlendirme Puanı</span></td>
                      <td>${formatter.convertFloatToString(oData.FappLast)}</td>
                    </tr>
                    <tr>
                      <td><span class="rowLabel">Son 1 Yıl Mazeretsiz Devamsızlık Süresi</span></td>
                      <td>${formatter.convertFloatToString(
                        oData.AbsenceDays
                      )} Gün</td>
                    </tr>
                    <tr>
                      <td><span class="rowLabel">Son 1 Yıl Ceza Durumu</span></td>
                      <td>${
                        oData.Disciplinary === "" ? "Yok" : oData.Disciplinary
                      }</td>
                    </tr>
                    <tr>
                      <td><span class="rowLabel">Eğitim Durumu</span></td>
                      <td>${oData.Education}</td>
                    </tr>
                    </tbody>
                  </table>
                </div>
              `,
              showCloseButton: true,
              showCancelButton: false,
              focusConfirm: true,
              confirmButtonText: `Tamam`,
              confirmButtonColor: "#0a6ed1",
              cancelButtonText: `Kapat`,
            });
          },
          error: () => {},
        });
      },
      onNavigateToPage: function (oEvent) {
        const oSource = oEvent.getParameter("selectedItem");
        const oViewModel = this.getModel("formDetailsModel");
        const aNavData = oViewModel.getProperty("/navigationData");

        var oNavData = _.find(aNavData, ["Index", oSource.getKey()]);

        this._oNavContainer?.to(oNavData?.Page.getId(), "fade");
      },
      onNavItemSelected: function (oEvent) {
        var oViewModel = this.getModel("formDetailsModel");
        var aNavigationData = oViewModel.getProperty("/navigationData");

        var iIndex = _.findIndex(aNavigationData, [
          "RowIid",
          oEvent.getParameter("rowIid"),
        ]);

        var oElement = aNavigationData[iIndex];

        var oViewModel = this.getModel("formDetailsModel");
        var iOffset = 1;

        var oCompPage =
          _.find(this.formUIElements, {
            RowIid: "0999",
            UIType: "Page",
          }) || null;

        if (oCompPage) {
          iOffset = 2;
        }

        var bIsLast = iIndex === aNavigationData.length - iOffset;

        try {
          if (
            oElement &&
            !_.isEqual(this._oNavContainer.getCurrentPage(), oElement.Page)
          ) {
            this._oNavContainer.to(oElement.Page.getId());
            oViewModel.setProperty("/navigationElementId", oElement.ElementId);
            if (bIsLast) {
              oViewModel.setProperty("/saveAndNextButtonVisibility", false);
            } else {
              oViewModel.setProperty("/saveAndNextButtonVisibility", true);
            }
          }
        } catch (oEx) {
          jQuery.sap.log.error("Navigation failed:" + oElement);
        }
      },
      onEscapeDialog: function (oPromise) {
        oPromise.reject();
      },
      onSurveyClose: function () {
        this._oSurveyDialog.close();
        this._oSurveyDialog.destroyContent();
      },
      onSurveyFinished: function () {
        var sAppraisalId = this._oSurveyDialog.data("appraisalId");
        var sRowIid = this._oSurveyDialog.data("elementRowIid");
        var sFormId = this._oSurveyDialog.data("elementFormId");

        var sSurveyIncompleted = this._checkSurveyHasFinished(
          sAppraisalId,
          sRowIid,
          sFormId
        );
        if (sSurveyIncompleted) {
          MessageBox.warning(
            this.getResourceBundle().getText("allQuestionsMustBeFilled")
          );
          return false;
        }
        this._oSurveyDialog.close();
        this._oSurveyDialog.destroyContent();
      },
      onOpenFormMessagePopover: function (oEvent) {
        const oMP = this._getFormMessagePopover();
        let oMB = null;

        if (oEvent) {
          oMB = oEvent.getSource();
        } else {
          oMB =
            this.byId("idErrorMessagesButton") ||
            sap.ui.getCore().byId("idErrorMessagesButton");
        }

        if (oMB && oMP) {
          if (oMB.isActive()) {
            oMP.openBy(oMB);
          } else {
            var oDelegate = {
              onAfterRendering: function () {
                oMP.openBy(oMB);
              },
            };
            oMB.addEventDelegate(oDelegate);
          }
        }
      },
      onCloseAttachmentPopover: function () {
        this._oListAttachmentDialog.close();
      },

      onCloseAddElementCatalog: function () {
        this._oAddNewElementCatalogDialog.close();
        MessageToast.show(this.getText("addOperationCancelled"));
      },
      onApplyAddElementCatalog: function (oEvent) {
        var oEnhanceModel = this.getModel("enhanceModel");
        var oCatalog = oEnhanceModel.getProperty("/Hierarchy");
        var aSelectedObjects = [];

        var _returnSelected = function (oElement) {
          if (oElement.hasOwnProperty("Children")) {
            if (oElement.Children.length > 0) {
              $.each(oElement.Children, function (sIndex, oChild) {
                if (
                  oChild.hasOwnProperty("AlreadySelected") &&
                  oChild.hasOwnProperty("Selected")
                ) {
                  if (!oChild.AlreadySelected && oChild.Selected) {
                    var oSelectedObject = {
                      Otype: oChild.Otype,
                      Objid: oChild.Objid,
                    };
                    aSelectedObjects.push(oSelectedObject);
                  }
                }
                _returnSelected(oChild);
              });
            }
          }
        };

        _returnSelected(oCatalog);

        //MessageToast.show("Seçilen öğe:" + oSource.data("referenceObjectId") + "," + oSource.data("referenceObjectType"));
        if (aSelectedObjects.length > 0) {
          this._enhanceDocumentFromCatalog(aSelectedObjects);
        } else {
          this._oAddNewElementCatalogDialog.close();
          MessageToast.show(this.getText("noElementSelected"));
        }
      },
      onCloseAddElementFree: function () {
        this._restoreOldFormState();
        this._oAddNewElementFreeFormDialog.close();

        MessageToast.show(this.getText("addOperationCancelled"));
      },
      onApplyAddElementFree: function () {
        var oViewModel = this.getModel("formDetailsModel");
        var oNewElement = oViewModel.getProperty("/newElement");
        var sTargetPath = "/bodyElements/" + oNewElement.RowIid + "/Name";

        if (typeof this._addElementCallBack === "function") {
          this._addElementCallBack.call();
        }

        oNewElement.Value = oViewModel.getProperty(sTargetPath);
        this._oAddNewElementFreeFormDialog.close();
        MessageToast.show(this.getText("newElementAdded", [oNewElement.Value]));
      },
      onCloseAddElementObjective: function () {
        this._restoreOldFormState();
        this._oAddNewElementObjectiveDialog.close();
        MessageToast.show(this.getText("addOperationCancelled"));
      },
      onSelectObjective: function (oEvent) {
        var oViewModel = this.getModel("formDetailsModel");
        var oViewData = oViewModel.getData();
        var oNewElement = oViewModel.getProperty("/newElement");

        try {
          var oObjective = oViewModel.getProperty(
            oEvent.getSource().getParent().getBindingContextPath()
          );

          var oObjTeam = _.find(oViewData.formData["BodyCells"], {
            ColumnIid: this._sObjTeamColumn,
            NoteString: oObjective.Objid,
          });
          if (!_.isEmpty(oObjTeam)) {
            MessageToast.show(this.getText("teamObjectiveExist"));
          }
          if (typeof this._addElementCallBack === "function") {
            this._addElementCallBack.call();
          }

          //team goal is set with OBJID that will be displayed as STEXT with the help of formatter
          oViewModel.setProperty(
            "/bodyCells/" +
              oNewElement.RowIid +
              "/" +
              this._sObjTeamColumn +
              "/NoteString",
            oObjective.Objid
          );

          if (!oViewData.formParameters["OBJECTIVE_DONOT_INHERITE"]) {
            oViewModel.setProperty(
              "/bodyElements/" + oNewElement.RowIid + "/Name",
              oObjective.Stext
            );
            oViewModel.setProperty(
              "/bodyCells/" +
                oNewElement.RowIid +
                "/" +
                this._sObjColumn +
                "/NoteString",
              oObjective.Description
            );
            oViewModel.setProperty(
              "/bodyCells/" +
                oNewElement.RowIid +
                "/" +
                this._sObjMeaColumn +
                "/ValueString",
              oObjective.Zzmeaning
            );
            oViewModel.setProperty(
              "/bodyCells/" +
                oNewElement.RowIid +
                "/" +
                this._sObjUniColumn +
                "/ValueString",
              oObjective.Zzunit
            );
            oViewModel.setProperty(
              "/bodyCells/" +
                oNewElement.RowIid +
                "/" +
                this._sExpValColumn +
                "/ValueString",
              oObjective.ZzexpResult.replace(".", ",")
            );
          }
        } catch (oEx) {}

        this._oAddNewElementObjectiveDialog
          .getAggregation("content")[0]
          .getBinding("items")
          .filter([]);
        this._oAddNewElementObjectiveDialog.close();
      },
      onApplyAddElementObjective: function (oEvent) {
        var oViewModel = this.getModel("formDetailsModel");
        var oViewData = oViewModel.getData();
        var oNewElement = oViewModel.getProperty("/newElement");
        var aContexts = oEvent.getParameter("selectedContexts");

        if (aContexts) {
          if (aContexts.length > 1) {
            MessageBox.error(this.getText("maxObjectiveSelection"));
          } else {
            var oObjective = aContexts[0].getObject();

            if (typeof this._addElementCallBack === "function") {
              this._addElementCallBack.call();
            }

            //team goal is set with OBJID that will be displayed as STEXT with the help of formatter
            oViewModel.setProperty(
              "/bodyCells/" +
                oNewElement.RowIid +
                "/" +
                this._sObjTeamColumn +
                "/NoteString",
              oObjective.Objid
            );

            if (!oViewData.formParameters["OBJECTIVE_DONOT_INHERITE"]) {
              oViewModel.setProperty(
                "/bodyElements/" + oNewElement.RowIid + "/Name",
                oObjective.Stext
              );
              oViewModel.setProperty(
                "/bodyCells/" +
                  oNewElement.RowIid +
                  "/" +
                  this._sObjColumn +
                  "/NoteString",
                oObjective.Description
              );
              oViewModel.setProperty(
                "/bodyCells/" +
                  oNewElement.RowIid +
                  "/" +
                  this._sObjMeaColumn +
                  "/ValueString",
                oObjective.Zzmeaning
              );
              oViewModel.setProperty(
                "/bodyCells/" +
                  oNewElement.RowIid +
                  "/" +
                  this._sObjUniColumn +
                  "/ValueString",
                oObjective.Zzunit
              );
              oViewModel.setProperty(
                "/bodyCells/" +
                  oNewElement.RowIid +
                  "/" +
                  this._sExpValColumn +
                  "/ValueNum",
                oObjective.ZzexpResult
              );
            }
          }
        }

        oEvent.getSource().getBinding("items").filter([]);
      },
      onSearchAddElementObjective: function (oEvent) {
        var sValue = oEvent.getParameter("query");
        var oFilter = new Filter(
          "Description",
          FilterOperator.Contains,
          sValue
        );
        var oBinding = oEvent
          .getSource()
          .getParent()
          .getParent()
          .getBinding("items");
        if (sValue !== null && sValue !== null && sValue !== undefined) {
          oBinding.filter([oFilter]);
        } else {
          oBinding.filter([]);
        }
      },
      onFileTypeMissmatch: function (oEvent) {
        var aFileTypes = oEvent.getSource().getFileType();
        jQuery.each(aFileTypes, function (key, value) {
          aFileTypes[key] = "*." + value;
        });
        var sSupportedFileTypes = aFileTypes.join(", ");
        MessageBox.warning(
          this.getResourceBundle().getText("fileTypeMismatch", [
            oEvent.getParameter("fileType"),
            sSupportedFileTypes,
          ])
        );
      },
      onAttachmentUploadPress: function (oEvent) {
        var oFileUploader = sap.ui.getCore().byId("idAttachmentFileUploader");

        if (!oFileUploader.getValue()) {
          MessageToast.show(
            this.getResourceBundle().getText("fileSelectionRequired")
          );
          return;
        }

        var oModel = this.getModel();
        var oViewModel = this.getModel("formDetailsModel");

        /*Destroy header parameters*/
        oFileUploader.destroyHeaderParameters();

        /*Set security token*/
        oModel.refreshSecurityToken();
        oFileUploader.addHeaderParameter(
          new sap.ui.unified.FileUploaderParameter({
            name: "x-csrf-token",
            value: oModel.getSecurityToken(),
          })
        );

        /*Set filename*/
        var sFileName = oFileUploader.getValue();
        sFileName = encodeURIComponent(sFileName);
        oFileUploader.addHeaderParameter(
          new sap.ui.unified.FileUploaderParameter({
            name: "content-disposition",
            value: "inline; filename='" + sFileName + "'",
          })
        );

        /*Set upload path*/
        var sPath =
          oModel.sServiceUrl +
          "/AttachOperationsSet(" +
          "AppraisalId=guid'" +
          oViewModel.getProperty("/currentAppraisalId") +
          "'," +
          "RowIid='" +
          oViewModel.getProperty("/currentRowIid") +
          "')/Attachment";

        oFileUploader.setUploadUrl(sPath);

        this._openBusyFragment("fileBeingUploaded");

        /*Upload file*/
        oFileUploader.upload();
      },

      onAttachmentUploadComplete: function (oEvent) {
        var oViewModel = this.getModel("formDetailsModel");
        var sAppraisalId = oViewModel.getProperty("/currentAppraisalId");
        this._closeBusyFragment();

        var oFileUploader = sap.ui.getCore().byId("idAttachmentFileUploader");
        oFileUploader.destroyHeaderParameters();
        oFileUploader.clear();

        var sStatus = oEvent.getParameter("status");
        var sResponse = oEvent.getParameter("response");

        if (sStatus == "201" || sStatus == "200") {
          MessageBox.success(
            this.getResourceBundle().getText("fileUploadSuccess")
          );
          this._oUploadAttachmentDialog.close();
        } else {
          MessageBox.error(
            this.getResourceBundle().getText("fileUploadError", [sResponse])
          );
        }

        this._refreshAttachmentList(sAppraisalId);
      },

      onAttachmentFileChange: function (oEvent) {
        MessageToast.show(
          this.getResourceBundle().getText("fileUploadWarning", [
            oEvent.getParameter("newValue"),
          ])
        );
      },

      onFileSizeExceed: function (oEvent) {
        MessageBox.error(
          this.getResourceBundle().getText("fileSizeExceeded", [
            oEvent.getSource().getMaximumFileSize(),
          ])
        );
      },

      onCloseUploadFormDialog: function () {
        MessageToast.show(
          this.getResourceBundle().getText("fileUploadCancelled")
        );
        this._oUploadAttachmentDialog.close();
      },

      onGetTrainingGroupHeader: function (oGroup) {
        return new sap.m.GroupHeaderListItem({
          title: oGroup.key,
          upperCase: false,
        });
      },
      onTrainingDialogClose: function () {
        var oList = sap.ui.getCore().byId("idDevTrainingsList");
        var oBinding = oList.getBinding("items");
        var aFilter = [];
        oBinding.filter(aFilter);

        this._oDevTrainingsDialog.close();
      },
      /**
       * Handlers
       * @function
       * @private
       */
      _setViewState: function (bState) {
        var oModel = this.getModel("formDetailsModel");
        oModel.setProperty("/busy", bState);
      },
      _doNavBack: function (sFromSave) {
        var that = this;
        if (sFromSave) {
          this._setChangeListeners(false);
          this._doNavToMain();
        } else {
          if (this.hasChanges) {
            this._generateConfirmDialog(
              "formHasChanges",
              "formQuitWithoutSave",
              [],
              "exitWithoutSave",
              "Emphasized",
              "sap-icon://nav-back",
              that._doNavToMain,
              "Warning"
            );
          } else {
            this._setChangeListeners(false);
            this._doNavToMain();
          }
        }
      },
      _generateConfirmDialog: function (
        sConfirmHeaderi18n,
        sConfirmTexti18n,
        sConfirmTextParams,
        sButtonText,
        sButtonType,
        sButtonIcon,
        oCallBack,
        sDialogType,
        sEndButtonText,
        sEndButtonType,
        sEndButtonIcon,
        oEndCallBack
      ) {
        var sConfirmHeader =
          this.getResourceBundle().getText(sConfirmHeaderi18n);
        var sConfirmText = this.getResourceBundle().getText(
          sConfirmTexti18n,
          sConfirmTextParams
        );
        var that = this;
        var oEndButtonProp = null;

        var oBeginButtonProp = {
          text: that.getResourceBundle().getText(sButtonText),
          type: sButtonType,
          icon: sButtonIcon,
          onPressed: oCallBack.bind(that),
        };

        if (sEndButtonText) {
          oEndButtonProp = {
            text: that.getResourceBundle().getText(sEndButtonText),
            type: sEndButtonType,
            icon: sEndButtonIcon,
            onPressed: oEndCallBack.bind(that),
          };
        }

        that.confirmDialog = this._callConfirmDialog(
          sConfirmHeader,
          "Message",
          sDialogType,
          sConfirmText,
          oBeginButtonProp,
          oEndButtonProp
        );

        that.confirmDialog.open();
      },

      _showShepherdIntro: function (oEvent) {
        
        if(this._oTour){
          this._oTour.start();
        }

      },
      _addShepherdStep: function (
        sTitle,
        sText,
        sElementSelector,
        sPosition,
        bArrow,
        bBack,
        bNext,
        bDone,
        sId
      ) {
        let oStep = {
          title: sTitle ? sTitle : null,
          text: sText,
          arrow: bArrow,
          canClickTarget: false,
          attachTo: {
            element: sElementSelector,
            on: sPosition,
          },
          buttons: [],
          id: sId ? sId : "id" + new Date().getTime(),
        };

        if (bBack) {
          oStep.buttons.push({
            action() {
              return this.back();
            },
            classes: "shepherd-button-secondary",
            text: "&larr;\tGeri",
          });
        }

        if (bDone) {
          oStep.buttons.push({
            action() {
              return this.complete();
            },
            classes: "shepherd-button-complete",
            text: "Bitir",
          });
        }
        if (bNext) {
          oStep.buttons.push({
            action() {
              return this.next();
            },
            text: "İleri\t&rarr;",
          });
        }

        this._oTour.addStep(oStep);
      },

      _doNavToMain: function () {
        var that = this;

        this._clearUI().then(function () {
          that._initializeViewModel();

          //
          var oHistory = History.getInstance();
          var sPreviousHash = oHistory.getPreviousHash();

          if (sPreviousHash !== undefined) {
            window.history.go(-1);
          } else {
            that.getRouter().navTo("formlist", null, true);
          }
        });
      },
      _clearUI: function () {
        var that = this;
        return new Promise(function (resolve, reject) {
          that._oNavContainer.setInitialPage(null);

          $.each(that.formUIElements, function (i, oFormElement) {
            try {
              var oElem = sap.ui.getCore().byId(oFormElement.UIElementId);
              if (oElem) {
                if (typeof oElem.destroyCustomData === "function") {
                  oElem.destroyCustomData();
                }
                if (typeof oElem.destroyContent === "function") {
                  oElem.destroyContent();
                }
                if (typeof oElem.destroyItems === "function") {
                  oElem.destroyItems();
                }
                if (typeof oElem.destroy === "function") {
                  oElem.destroy();
                }
              }
            } catch (e) {}
          });

          // that.byId("idTriggerAutoSave")?.clearTriggerInterval();

          resolve(true);
        });
      },
      _formatDate: function (sDate) {
        try {
          var oDateFormat = DateFormat.getDateTimeInstance({
            pattern: "dd/MM/yyyy",
          });

          return oDateFormat.format(sDate);
        } catch (ex) {
          return "";
        }
      },
      _refreshSidebarFooterData: function () {
        var oViewModel = this.getModel("formDetailsModel");
        var aResultsTable = oViewModel.getProperty("/formData/ResultTable");

        var oFooterData = {
          TableData: [],
          FooterData: [],
          Pages: [],
        };

        //Footer new
        let aResults = _.filter(aResultsTable, function (oResultLine) {
          if (oResultLine.Sort === "099") {
            return false;
          }
          if (oResultLine.Sort.includes) {
            return !oResultLine.Sort.includes(".");
          } else {
            if (oResultLine.Sort.indexOf(".") !== -1) {
              return false;
            } else {
              return true;
            }
          }
        });

        var aCaption = _.uniqBy(aResults, "RowName");

        $.each(aCaption, (i, oCaption) => {
          let oPage = {
            Title: oCaption.RowName,
            Items: [],
          };

          let aCell = _.filter(aResults, ["RowName", oCaption.RowName]) || [];

          if (aCell.length > 0) {
            $.each(aCell, (j, oCell) => {
              if (oCell.Value !== null && oCell.Value !== "") {
                oPage.Items.push({
                  Name: oCell.ColName,
                  Value: oCell.Value,
                });
              }
            });
            oFooterData.Pages.push(oPage);
          }
        });
        //Footer new

        return oFooterData;
      },
      _prepareSideBarData: function () {
        var oViewModel = this.getModel("formDetailsModel");

        var oAppraisee = oViewModel.getProperty("/formData/HeaderAppraisee/0");
        var oAppraiser1st = oViewModel.getProperty(
          "/formData/HeaderAppraiser/0"
        );
        var oAppraiser2nd = oViewModel.getProperty("/formData/HeaderOthers/0");
        var oAppraiser3rd = oViewModel.getProperty("/formData/HeaderOthers/1");
        var oStatus = oViewModel.getProperty("/formData/HeaderStatus");
        var oDates = oViewModel.getProperty("/formData/HeaderDates");
        var aResultsTable = oViewModel.getProperty("/formData/ResultTable");
        var oFormParameters = oViewModel.getProperty("/formParameters");
        var oBodyCells = oViewModel.getProperty("/bodyCells");
        var oSideBarData = oViewModel.getProperty("/sidebarData");
        oSideBarData.visible = true;

        /*Appraisee Data*/
        oSideBarData.appeeInfo.Id = oAppraisee.Id;
        oSideBarData.appeeInfo.ImageSource =
          "/sap/opu/odata/sap/ZHCM_UX_HAP_SRV/EmployeeInfoSet('" +
          oAppraisee.Id +
          "')/$value";
        oSideBarData.appeeInfo.Title = oAppraisee.Name;
        oSideBarData.appeeInfo.Line1 = oAppraisee.Plstx;
        oSideBarData.appeeInfo.Line2 = oAppraisee.Orgtx;
        /*Appraisee Data*/

        if (oAppraiser1st) {
          /*Appraiser 1st Data*/
          oSideBarData.apper1stInfo.ImageSource =
            "/sap/opu/odata/sap/ZHCM_UX_HAP_SRV/EmployeeInfoSet('" +
            oAppraiser1st.Id +
            "')/$value";
          oSideBarData.apper1stInfo.Id = oAppraiser1st.Id;
          oSideBarData.apper1stInfo.Title = oAppraiser1st.Name;
          oSideBarData.apper1stInfo.Line1 = oAppraiser1st.Plstx;
          oSideBarData.apper1stInfo.Line2 = oAppraiser1st.Orgtx;
          /*Appraiser 1st Data*/
        }

        if (oAppraiser2nd) {
          /*Appraiser 2nd Data*/
          oSideBarData.apper2ndInfo.ImageSource =
            "/sap/opu/odata/sap/ZHCM_UX_HAP_SRV/EmployeeInfoSet('" +
            oAppraiser2nd.Id +
            "')/$value";
          oSideBarData.apper2ndInfo.Id = oAppraiser2nd.Id;
          oSideBarData.apper2ndInfo.Title = oAppraiser2nd.Name;
          oSideBarData.apper2ndInfo.Line1 = oAppraiser2nd.Plstx;
          oSideBarData.apper2ndInfo.Line2 = oAppraiser2nd.Orgtx;
          /*Appraiser 2nd Data*/
        }

        if (oAppraiser3rd) {
          /*Appraiser 3rd Data*/
          oSideBarData.apper3rdInfo.ImageSource =
            "/sap/opu/odata/sap/ZHCM_UX_HAP_SRV/EmployeeInfoSet('" +
            oAppraiser3rd.Id +
            "')/$value";
          oSideBarData.apper3rdInfo.Id = oAppraiser3rd.Id;
          oSideBarData.apper3rdInfo.Title = oAppraiser3rd.Name;
          oSideBarData.apper3rdInfo.Line1 = oAppraiser3rd.Plstx;
          oSideBarData.apper3rdInfo.Line2 = oAppraiser3rd.Orgtx;
          /*Appraiser 3rd Data*/
        }

        /*Status Data*/
        oSideBarData.statusInfo = [];
        oSideBarData.statusInfo.push(
          {
            Label: "Form Durumu",
            Value: oStatus.ApStatusName,
          },
          {
            Label: "Alt Durum",
            Value: oStatus.ApStatusSubName,
          },
          {
            Label: "Dönem Başlangıcı",
            Value: this._formatDate(oDates.ApStartDate),
          },
          {
            Label: "Dönem Sonu",
            Value: this._formatDate(oDates.ApEndDate),
          }
        );
        /*Status Data*/

        /*Footer Data*/
        var aResults = _.filter(aResultsTable, function (oResultLine) {
          if (oResultLine.Sort === "099") {
            return false;
          }
          if (oResultLine.Sort.includes) {
            return !oResultLine.Sort.includes(".");
          } else {
            if (oResultLine.Sort.indexOf(".") !== -1) {
              return false;
            } else {
              return true;
            }
          }
        });

        var aCaption = _.uniqBy(aResults, "RowName");
        var aColumns = _.uniqBy(aResults, "ColIid");
        var aFinalRow = _.filter(aResultsTable, ["Sort", "099"]);
        var sRowIndex = 0;
        var sColIndex = 0;

        oSideBarData.footerData = {
          TableData: [],
          FooterData: [],
          Pages: [],
        };
        //SUMMARY_WEIGHT_SHOW

        //Footer new
        $.each(aCaption, (i, oCaption) => {
          let oPage = {
            Title: oCaption.RowName,
            Items: [],
          };

          let aCell = _.filter(aResults, ["RowName", oCaption.RowName]) || [];

          if (aCell.length > 0) {
            $.each(aCell, (j, oCell) => {
              if (oCell.Value !== null && oCell.Value !== "") {
                oPage.Items.push({
                  Name: oCell.ColName,
                  Value: oCell.Value,
                });
              }
            });
            oSideBarData.footerData.Pages.push(oPage);
          }
        });
        //Footer new

        //Form captions

        if (aCaption.length > 0) {
          oSideBarData.footerData.TableData[sColIndex] = {
            Type: "Caption",
            ColumnIndex: sColIndex,
            Data: [
              {
                Value: oFormParameters["SUMMARY_HEADER_TITLE"], //SUMMARY_HEADER_TITLE
                Type: "HeaderEmpty",
                ColumnIndex: sColIndex,
                RowIndex: sRowIndex,
              },
            ],
          };
        }

        $.each(aCaption, function (sIndex, oCaption) {
          sRowIndex++;
          var sColValue = "";
          if (oFormParameters["SUMMARY_WEIGHT_SHOW"] === "X") {
            try {
              var oCell = oBodyCells[oCaption.RowIid][oCaption.ColumnIid];
              sColValue =
                oCaption.RowName +
                " (" +
                oCell.ValueTxt +
                "" +
                oCell.ValueText +
                ")";
            } catch (oEx) {
              sColValue = oCaption.RowName;
            }
          } else {
            sColValue = oCaption.RowName;
          }
          oSideBarData.footerData.TableData[0].Data.push({
            Value: sColValue,
            Type: "RowLabel",
            ColumnIndex: sColIndex,
            RowIndex: sRowIndex,
          });
        });

        $.each(aColumns, function (i, oColumn) {
          sColIndex++;
          sRowIndex = 0;
          oSideBarData.footerData.TableData[sColIndex] = {
            Type: "Column",
            ColumnIndex: sColIndex,
            Data: [
              {
                Value: oColumn.ColName,
                Type: "Header",
                ColumnIndex: sColIndex,
                RowIndex: sRowIndex,
              },
            ],
          };
          var aCellVal = _.filter(aResults, ["ColIid", oColumn.ColIid]);
          $.each(aCellVal, function (i, oCell) {
            sRowIndex++;
            oSideBarData.footerData.TableData[sColIndex].Data.push({
              Value: oCell.Value,
              Type: "RowValue",
              ColumnIndex: sColIndex,
              RowIndex: sRowIndex,
            });
          });
        });
        /*Footer of Footer Begin*/
        if (aFinalRow[0]) {
          var sFooterRowColSpan = aFinalRow.length === 1 ? 2 : 1;
          oSideBarData.footerData.FooterData[0] = {
            Type: "Footer",
            Data: [
              {
                Value: aFinalRow[0].RowName,
                Type: "FooterLabel",
                ColSpan: sFooterRowColSpan,
              },
            ],
          };

          $.each(aColumns, function (sIndex, oColumn) {
            var aCellVal = _.filter(aFinalRow, ["ColIid", oColumn.ColIid]);
            $.each(aCellVal, function (sInd3, oCell) {
              oSideBarData.footerData.FooterData[0].Data.push({
                Value: oCell.Value,
                Type: "FooterValue",
                ColSpan: sFooterRowColSpan,
              });
            });
          });

          if (oFormParameters["FINAL_NOTE_AFTER_CALIB"]) {
            oSideBarData.footerData.FooterData.push({
              Type: "FooterFinal",
              Data: [
                {
                  Value: "KALİBRASYON SONUCU",
                  Type: "FooterLabel",
                  ColSpan: aFinalRow.length === 1 ? 2 : 1,
                },
                {
                  Value: oFormParameters["FINAL_NOTE_AFTER_CALIB"],
                  Type: "FooterValue",
                  ColSpan: aFinalRow.length === 1 ? 2 : 3,
                },
              ],
            });
          }

          if (oFormParameters["FINAL_TEXT_AFTER_CALIB"]) {
            oSideBarData.footerData.FooterData.push({
              Type: "FooterNote",
              Data: [
                {
                  Value: oFormParameters["FINAL_TEXT_AFTER_CALIB"],
                  Type: "FooterValue",
                  ColSpan: 3,
                },
              ],
            });
          }

          //FINAL_NOTE_AFTER_CALIB
          //FINAL_TEXT_AFTER_CALIB
        }

        /*Footer of Footer End*/
        /*Footer Data*/

        oViewModel.setProperty("/sidebarData", oSideBarData);
      },
      _registerSaveShortcut: function () {
        var that = this;

        // this.byId("idTriggerAutoSave")?.setTriggerInterval();

        /*Register save */
        $(document).ready(function () {
          $(document).bind("keydown", function (event) {
            if (
              ((event.which == 115 || event.which == 83) &&
                (event.ctrlKey || event.metaKey)) ||
              event.which == 19
            ) {
              event.preventDefault();
              that._handleSaveDocument(false);
              return false;
            }
            return true;
          });
        });
      },
      _unregisterSaveShortcut: function () {
        $(document).unbind("keydown");
      },
      _defineInitialModel: function () {
        return {
          busy: false,
          delay: 0,
          appraisalId: null,
          currentRowIid: null,
          currentAppraisalId: null,
          navigationData: [],
          sidebarData: {
            visible: false,
            appeeInfo: {},
            apper1stInfo: {},
            apper2ndInfo: {},
            apper3rdInfo: {},
            statusInfo: [],
            footerData: [],
          },
          progressData: [],
          formProp: [],
          formParameters: {},
          formData: {},
          bodyElements: {},
          bodyElementsCopy: {},
          bodyCells: {},
          bodyCellsCopy: {},
          bodyColumns: {},
          bodyCellValues: {},
          currentForm: {},
          formMessages: [],
          newElement: {
            Value: null,
            RowIid: null,
            PlaceHolder: null,
            ParentName: null,
          },
          beforeAddFreeFormData: {},
          objectiveDialog: {
            AppraisalId: null,
            Objectives: [],
            FormParameters: {},
          },
          attachmentCollection: {},
          elementSurveys: {},
          surveyCloseButtonVisible: false,
          headerVisible: false,
          currentCellValueDescription: [],
          introSteps: [],
          footerButtons: [],
          formSections: [],
          allSectionsClicked: false,
          developmentPlan: {},
          saveAndNextButtonVisibility: false,
          objectiveWizardSettings: {
            selectedObjective: null,
            dependentObjectives: {
              Children: [],
            },
            newRowIid: null,
            errorList: [],
          },
          objectHierarchy: null,
          pauseAutoSave: false,
        };
      },
      _initializeViewModel: function () {
        var oViewModel = this.getModel("formDetailsModel");

        this._unregisterSaveShortcut();
        this._resetSections();

        //this._oNavContainer.destroyPages();
        //this._oNavContainer.removeAllPages();
        this._oNavContainer.setInitialPage(null);

        //Initiate
        oViewModel.setData(this._defineInitialModel());

        this.hasChanges = false;
        this.formUIElements = [];

        this._removeAllMessages();

        this._oIntro = null;
        this._sIntro = false;
      },
      _onPatternMatched: function (oEvent) {
        var oRenderer = sap.ushell.Container.getRenderer("fiori2");
        oRenderer.setHeaderVisibility(false, false, ["app"]);

        /*Initiate view data*/
        this._initializeViewModel();

        /*Close busy dialog*/
        this.getUIHelper().setListViewBusy(false);

        var sAppraisalId = oEvent.getParameter("arguments").appraisalId;
        var oViewModel = this.getModel("formDetailsModel");
        var oFormData = this.getUIHelper().getCurrentForm();
        //console.log(oFormData);
        //Set form data and appraisal id
        oViewModel.setProperty("/currentForm", oFormData);
        oViewModel.setProperty("/appraisalId", sAppraisalId);

        //Get other details form
        this._getDocumentDetail();
      },

      _convertToGuid: function (sId) {
        var regexGroupGuid = /(\w{8})(\w{4})(\w{4})(\w{4})(\w{12})/;
        return sId.toLowerCase().replace(regexGroupGuid, "$1-$2-$3-$4-$5");
      },
      _getDocumentDetail: function () {
        var oModel = this.getModel();
        var oViewModel = this.getModel("formDetailsModel");
        var that = this;
        var oFormData = {};
        var aFormProp = [];
        var aFilters = [];
        var bHasErrors = false;
        var sAppraisalId = oViewModel.getProperty("/appraisalId");

        var sQuery =
          "/DocumentOperationsSet(AppraisalId=guid'" +
          sAppraisalId +
          "',PartApId='0000')";
        var sExpand =
          "BodyElements,BodyColumns,BodyCells,BodyCellValues," +
          "BodyCellRanges,BodyElementButtons,HeaderAppraisee," +
          "HeaderAppraiser,HeaderOthers,HeaderDates,HeaderDisplay," +
          "HeaderText,HeaderStatus,DocProcessing,Buttons,DocTab,Return," +
          "FeAlreadyChosen,FeFlatAvailable,FeSelectableOtype,FeStrucAvailable," +
          "FeBodyElementsAdd,ReturnOp,FormQuestions,FormAnswers,Competencies," +
          "Objectives,FormParameters,ResultTable,Intros,DocProgress";

        aFilters.push(
          new sap.ui.model.Filter("Mode", sap.ui.model.FilterOperator.EQ, "X")
        );

        this._openBusyFragment("formDetailPrepared", []);

        oViewModel.setProperty("/formData", {});
        oViewModel.setProperty("/headerVisible", false);
        oViewModel.setProperty("/formProp", []);

        this._unregisterSaveShortcut();

        oModel.read(sQuery, {
          urlParameters: {
            $expand: sExpand,
          },
          filters: aFilters,
          success: function (oData, oResponse) {
            aFormProp = sExpand.split(",");
            for (var i = 0; i < aFormProp.length; i++) {
              if (oData[aFormProp[i]].hasOwnProperty("results")) {
                oFormData[aFormProp[i]] = _.cloneDeep(
                  oData[aFormProp[i]].results
                );
              } else {
                oFormData[aFormProp[i]] = _.cloneDeep(oData[aFormProp[i]]);
              }
            }

            oViewModel.setProperty("/formData", oFormData);

            if (
              oFormData.DocProcessing.DocumentMode === "B" ||
              oFormData.DocProcessing.DocumentMode === "X"
            ) {
              oViewModel.setProperty("/formEditable", true);
              that._registerSaveShortcut(); // CTRL+S registration
            } else {
              oViewModel.setProperty("/formEditable", false);
            }

            //--Set header visible
            oViewModel.setProperty("/headerVisible", true);

            oViewModel.setProperty("/formProp", aFormProp);
            that._formBodyElementsObject();
            that._formBodyColumnsObject();
            that._formBodyCellsObject();
            that._cloneComparisonObjects();
            that._formElementSurveysObject();
            that._formParametersObject();
            that._prepareSideBarData();
            that._refreshAttachmentList(sAppraisalId);

            that._buildUI();
            that._closeBusyFragment();

            if (oData.Return !== null) {
              if (oData.Return.hasOwnProperty("results")) {
                bHasErrors = that._processReturnMessages(
                  oData.Return.results,
                  true
                );
              }
            }
          },
          error: function (oError) {
            that._closeBusyFragment();
          },
        });
      },

      _setChangeListeners: function (bSet) {
        var that = this;
        var oViewModel = this.getModel("formDetailsModel");
        var oCellsModel = new sap.ui.model.Binding(
          oViewModel,
          "/",
          oViewModel.getContext("/bodyCells")
        );
        var oElementsModel = new sap.ui.model.Binding(
          oViewModel,
          "/",
          oViewModel.getContext("/bodyElements")
        );
        if (bSet) {
          oCellsModel.attachChange(function (oEvent) {
            if (!that._compareClonedObjects()) {
              that.hasChanges = true;
            }
          });

          oElementsModel.attachChange(function (oEvent) {
            if (!that._compareClonedObjects()) {
              that.hasChanges = true;
            }
          });

          that.hasChanges = false;
        } else {
          oCellsModel.detachChange(function () {
            that.hasChanges = false;
          });
          oElementsModel.detachChange(function () {
            that.hasChanges = false;
          });
        }
      },

      _refreshAttachmentList: function (sAppraisalId) {
        var oModel = this.getModel();
        var oViewModel = this.getModel("formDetailsModel");
        var that = this;

        /*Initiate attachment list*/
        oViewModel.setProperty("/attachmentCollection", {});

        var oUrlParams = {
          AppraisalId: sAppraisalId,
        };

        var oAttCollection = {};

        oModel.callFunction("/GetAttachmentList", {
          method: "GET",
          urlParameters: oUrlParams,
          success: function (oData, oResponse) {
            $.each(oData.results, function (sIndex, oLine) {
              if (!oAttCollection.hasOwnProperty(oLine.RowIid)) {
                oAttCollection[oLine.RowIid] = {
                  attachmentList: [],
                };
              }
              oLine.Type = oLine.Type.toLowerCase();
              oAttCollection[oLine.RowIid].attachmentList.push(oLine);
            });
            oViewModel.setProperty("/attachmentCollection", oAttCollection);

            that._setChangeListeners(true, sAppraisalId);
            that.hasChange = false;
          },
          error: function (oError) {
            that.hasChange = false;
          },
        });
      },

      /**
       * Build UI of performance form
       * @function
       * @private
       */
      _getToolbarTemplate: function () {
        var that = this;
        var oViewModel = this.getModel("formDetailsModel");
        var sAppraisalId = oViewModel.getProperty("/appraisalId");

        this._adjustButtons();

        var oActionButton = new sap.m.Button({
          text: "{formDetailsModel>Text}",
          visible: {
            parts: [
              {
                path: "formDetailsModel>Availability",
              },
              {
                path: "formDetailsModel>StatusRelevant",
              },
              {
                path: "formDetailsModel>Id",
              },
              {
                path: "formDetailsModel>/saveAndNextButtonVisibility",
              },
            ],
            formatter: function (
              sAvailability,
              sStatusRelevant,
              sButtonId,
              bSaveNextVisible
            ) {
              if (sButtonId === "SAVE&KEEP" || sButtonId === "NEXT&KEEP") {
                return bSaveNextVisible;
              }
              if (sAvailability === "" || sAvailability === "B") {
                return true;
              } else {
                return false;
              }
            },
          },
          enabled: {
            parts: [
              {
                path: "formDetailsModel>Availability",
              },
              {
                path: "formDetailsModel>StatusRelevant",
              },
              {
                path: "formDetailsModel>Id",
              },
              {
                path: "formDetailsModel>/saveAndNextButtonVisibility",
              },
            ],
            formatter: function (
              sAvailability,
              sStatusRelevant,
              sId,
              bEnabled
            ) {
              if (sId === "SAVE&KEEP" || sId === "NEXT&KEEP") {
                return bEnabled;
              }
              if (sAvailability === "" || sAvailability === "B") {
                if (sStatusRelevant) {
                  return true;
                } else {
                  return true;
                }
              } else {
                return false;
              }
            },
          },
          type: {
            parts: [
              {
                path: "formDetailsModel>Id",
              },
              {
                path: "formDetailsModel>StatusRelevant",
              },
              {
                path: "formDetailsModel>Icon",
              },
            ],
            formatter: function (sId, sStatusRelevant, sIcon) {
              if (sStatusRelevant === true) {
                if (sId.includes("REJECT")) {
                  return "Reject";
                } else {
                  return "Accept";
                }
              }

              if (
                sId === "SAVE" ||
                sId === "SAVE&KEEP" ||
                sId === "NEXT&KEEP"
              ) {
                return "Emphasized";
              }

              if (sId === "CANCEL") {
                return "Reject";
              }

              if (sId === "SHOW_INTRO") {
                return "Accept";
              }

              return "Default";
            },
          },
          icon: {
            parts: [
              {
                path: "formDetailsModel>Id",
              },
              {
                path: "formDetailsModel>StatusRelevant",
              },
              {
                path: "formDetailsModel>Icon",
              },
            ],
            formatter: function (sId, sStatusRelevant, sIcon) {
              switch (sId) {
                case "SAVE":
                  return "sap-icon://save";
                case "CANCEL":
                  return "sap-icon://sys-cancel-2";
                case "PRINT":
                  return "sap-icon://print";
                case "SHOW_INTRO":
                  return "sap-icon://hint";
              }
            },
          },
          press: that._handleActionButtonPressed.bind(this),
        }).addStyleClass("sapUiTinyMarginEnd");

        /*Add custom data 2 for binding*/
        var oAppraisalId = new sap.ui.core.CustomData({
          key: "AppraisalId",
          value: sAppraisalId,
        });
        oActionButton.addCustomData(oAppraisalId);

        var oButtonId = new sap.ui.core.CustomData({
          key: "ButtonId",
          value: "{formDetailsModel>Id}",
          writeToDom: true,
        });
        oActionButton.addCustomData(oButtonId);
        var oStatusRelevant = new sap.ui.core.CustomData({
          key: "StatusRelevant",
          value: "{formDetailsModel>StatusRelevant}",
        });
        oActionButton.addCustomData(oStatusRelevant);
        var oStatusNoteAvailability = new sap.ui.core.CustomData({
          key: "StatusNoteAvailability",
          value: "{formDetailsModel>StatusNoteAvailability}",
        });
        oActionButton.addCustomData(oStatusNoteAvailability);
        var oEmphasize = new sap.ui.core.CustomData({
          key: "IsEmphasized",
          value:
            "{= ${formDetailsModel>StatusRelevant} ? 'Emphasized' : 'None'}",
          writeToDom: true,
        });
        oActionButton.addCustomData(oEmphasize);
        var oTargetSection = new sap.ui.core.CustomData({
          key: "TargetSection",
          value: "{formDetailsModel>TargetSection}",
        });
        oActionButton.addCustomData(oTargetSection);

        return oActionButton;
      },
      _prepareIntro: function () {
        var oViewModel = this.getModel("formDetailsModel");
        var sAppraisalId = oViewModel.getProperty("/appraisalId");
        var aIntros = oViewModel.getProperty("/formData/Intros") || [];

        if (!aIntros.length > 0) {
          return;
        }
        var oStore = jQuery.sap.storage(jQuery.sap.storage.Type.local);

        var sStoreKey = aIntros[0].TemplateId + "_Intro";

        if (!this._oTour) {
          this._oTour = new Shepherd.Tour({
            useModalOverlay: true,
            defaultStepOptions: {
              scrollTo: true,
            },
          });

          Shepherd.on("complete", () => {
            oStore && oStore.put(sStoreKey, true);
          });
        }

        //--Clear old steps
        this._oTour?.steps &&
        this._oTour.steps?.length &&
        this._oTour.steps?.length > 0
          ? [...this._oTour.steps].forEach((s) => s?.destroy())
          : null;

        aIntros.forEach((o, i) => {
          this._addShepherdStep(
            o.Title, // sTitle,
            o.ContentLine1 + o.ContentLine2 + o.ContentLine3, // sText,
            o.Selector, // sElementSelector,
            o.Location, // sPosition,
            o.Arrow, // bArrow,
            i !== 0, // bBack,
            i !== aIntros.length - 1, // bNext,
            true, // bDone,
            "idShepherdStep" + o.Seqnr // sId
          );
        });

        var bShow = oStore.get(sStoreKey) === true ? false : true;
        if (bShow) {
          var waitForEl = function (selector, callback) {
            if (jQuery(selector).length) {
              callback();
            } else {
              setTimeout(function () {
                waitForEl(selector, callback);
              }, 500);
            }
          };

          waitForEl(aIntros[0].Selector, () => {
            this._showShepherdIntro();
          });
        }
      },
      _getSaveMenuTemplate: function () {
        var that = this;
        var oMenuItem = new sap.m.MenuItem({
          text: "{formDetailsModel>Text}",
          press: that._handleActionButtonPressed.bind(that),
          visible: {
            parts: [
              {
                path: "formDetailsModel>Availability",
              },
              {
                path: "formDetailsModel>Id",
              },
              {
                path: "formDetailsModel>/saveAndNextButtonVisibility",
              },
            ],
            formatter: function (sAvailability, sId, bSaveNextVisible) {
              if (sId === "SAVE&KEEP" || sId === "NEXT&KEEP") {
                return bSaveNextVisible;
              }

              if (sAvailability === "" || sAvailability === "B") {
                return true;
              } else {
                return false;
              }
            },
          },
          icon: {
            parts: [
              {
                path: "formDetailsModel>Id",
              },
            ],
            formatter: function (sId) {
              switch (sId) {
                case "SAVE":
                  return "sap-icon://save";
                case "SAVE&EXIT":
                  return "sap-icon://system-exit";
                case "SAVE&KEEP":
                  return "sap-icon://open-command-field";
              }
            },
          },
        });
        var oSaveMenu = new sap.m.MenuButton({
          text: "Kaydet",
          type: "Emphasized",
          menu: new sap.m.Menu().bindAggregation("items", {
            path: "formDetailsModel>/saveButtons",
            template: oMenuItem,
          }),
          visible:
            "{= ${formDetailsModel>/formEditable} && ${formDetailsModel>/saveButtons}.length > 0 }",
        });

        /*Add custom data 2 for binding*/
        var oButtonId = new sap.ui.core.CustomData({
          key: "ButtonId",
          value: "{formDetailsModel>Id}",
          writeToDom: true,
        });
        oMenuItem.addCustomData(oButtonId);
        var oStatusRelevant = new sap.ui.core.CustomData({
          key: "StatusRelevant",
          value: "{formDetailsModel>StatusRelevant}",
        });
        oMenuItem.addCustomData(oStatusRelevant);
        var oStatusNoteAvailability = new sap.ui.core.CustomData({
          key: "StatusNoteAvailability",
          value: "{formDetailsModel>StatusNoteAvailability}",
        });
        oMenuItem.addCustomData(oStatusNoteAvailability);
        var oEmphasize = new sap.ui.core.CustomData({
          key: "IsEmphasized",
          value:
            "{= ${formDetailsModel>StatusRelevant} ? 'Emphasized' : 'None'}",
          writeToDom: true,
        });
        oMenuItem.addCustomData(oEmphasize);
        var oTargetSection = new sap.ui.core.CustomData({
          key: "TargetSection",
          value: "{formDetailsModel>TargetSection}",
        });
        oMenuItem.addCustomData(oTargetSection);

        this._addUIElement(null, "SaveMenu", null, oMenuItem);

        return oSaveMenu;
      },

      _setToolbar: function () {
        const oToolbar = this.byId("idDetailPageToolbar");

        if (!oToolbar) {
          return;
        }

        //--Remove everything
        oToolbar.destroyContent();
        //--Remove everything
        oToolbar.removeAllContent();

        //--Add error button
        const oErrorButton = new sap.m.Button("idErrorMessagesButton", {
          type: "Emphasized",
          text: {
            path: "formDetailsModel>/formMessages",
            formatter: function (aFormMessages) {
              return aFormMessages.length;
            },
          },
          icon: "sap-icon://message-popup",
          visible: {
            path: "formDetailsModel>/formMessages",
            formatter: function (aFormMessages) {
              return aFormMessages.length > 0;
            },
          },
          press: this.onOpenFormMessagePopover.bind(this),
        });

        const oButtonRow = new sap.m.FlexBox({
          direction: "Row",
        }).bindAggregation("items", {
          path: "formDetailsModel>/footerButtons",
          template: this._getToolbarTemplate(),
        }).addStyleClass("smod-page-footer-buttons");

        // const oSaveMenu = this._getSaveMenuTemplate();

        oToolbar.addContent(oErrorButton);
        oToolbar.addContent(new sap.m.ToolbarSpacer());
        oToolbar.addContent(oButtonRow);
        // oToolbar.addContent(oSaveMenu);
      },

      _buildUI: function () {
        var oViewModel = this.getModel("formDetailsModel");
        var oViewData = oViewModel.getData();
        var aTabs = _.filter(oViewData.formData.DocTab, ["Tab", "X"]);
        var aNavigationData = [];
        var that = this;

        //--Set toolbar
        this._setToolbar();

        $.each(aTabs, function (sIndex, oTab) {
          if (
            oTab.ElementType !== "VA" &&
            oViewData.bodyElements[oTab.RowIid].Availability !== "H"
          ) {
            var oElement = _.find(oViewData.formData.BodyElements, [
              "RowIid",
              oTab.RowIid,
            ]);

            var oPage = new sap.m.Page({
              title:
                "{formDetailsModel>/bodyElements/" + oTab.RowIid + "/Name}",
              showNavButton: true,
              showFooter: true,
              floatingFooter: false,
              navButtonPress: function () {
                that._doNavToMain();
              },
              // footer: oToolbar,
            }).addStyleClass("hapPage");

            that._addUIElement(oTab.RowIid, "Page", null, oPage);

            var oCell = _.find(oViewData.formData.BodyCells, {
              RowIid: oTab.RowIid,
              ColumnIid: that._sWeightColumn,
            });
            var sName;
            if (oCell && oCell.ValueString !== "") {
              sName =
                oElement.Name +
                " (" +
                formatter.convertFloatToString(
                  parseFloat(oCell.ValueString)
                ) +
                "%)";
            } else {
              sName = oElement.Name;
            }
            aNavigationData.push({
              Index: (aNavigationData.length + 1).toString(),
              RowIid: oTab.RowIid,
              ElementType: oTab.ElementType,
              ElementId: oTab.ElementId,
              Name: sName,
              Children: [],
              Icon: oTab.TabIcon,
              Page: oPage,
              Selected: sIndex === 1,
            });

            //Set current selected element as index
            if (aNavigationData.length === 1) {
              oViewModel.setProperty("/navigationElementId", oTab.ElementId);
            }

            var oPageHeader = that._buildObjectPageHeader(oElement);

            var oPageLayout = new sap.uxap.ObjectPageLayout({
              enableLazyLoading: true,
              headerTitle: oPageHeader,
            });

            that._addUIElement(oTab.RowIid, "PageLayout", null, oPageLayout);

            that._buildObjectPageLayoutContent(
              oPageLayout,
              oTab.RowIid,
              oViewData
            );

            oPage.addContent(oPageLayout);

            that._addUIElement(oTab.RowIid, "PageLayout", null, oPageLayout);

            that._oNavContainer.addPage(oPage);

            if (!that._oNavContainer.getInitialPage()) {
              that._oNavContainer.setInitialPage(oPage);
              that._oNavContainer.to(oPage.getId());
            }
          }
        });

        if (aNavigationData.length > 1) {
          oViewModel.setProperty("/saveAndNextButtonVisibility", true);
        } else {
          oViewModel.setProperty("/saveAndNextButtonVisibility", false);
        }

        oViewModel.setProperty("/navigationData", aNavigationData);

        //--Prepare intro
        this._prepareIntro();
      },

      _buildObjectTitle: function (oElement) {
        var that = this;

        var _isFieldVisible = function (sCellValueAvailability, sValue) {
          if (
            sCellValueAvailability !== null &&
            sCellValueAvailability !== undefined
          ) {
            return sCellValueAvailability !== "H" && sValue !== "";
          } else {
            return false;
          }
        };

        return new sap.m.HBox({
          alignItems: "End",
          items: [
            new sap.m.Title({
              text: `{formDetailsModel>/bodyElements/${oElement.RowIid}/Name}`,
            }).addStyleClass("sapUiTinyMarginEnd"),
            new ResultBoard({
              tooltip: "Ağırlık",
              status: "Error",
              bgColor: "#fff",
              value: {
                path: `formDetailsModel>/bodyCells/${oElement.RowIid}/${that._sWeightColumn}/ValueNum`,
                type: "sap.ui.model.type.Float",
                formatter: (v)=>{
                  return formatter.convertFloatToString(parseFloat(v))
                }
              },
              unit: " %",
              visible: {
                parts: [
                  {
                    path: `formDetailsModel>/bodyCells/${oElement.RowIid}/${that._sWeightColumn}/CellValueAvailability`,
                  },
                  {
                    path: `formDetailsModel>/bodyCells/${oElement.RowIid}/${that._sWeightColumn}/ValueNum`,
                  },
                ],
                formatter: _isFieldVisible,
              },
            }).addStyleClass("sapUiTinyMarginEnd"),

            // new ResultBoard({
            //   icon: "sap-icon://employee",
            //   tooltip: "Çalışan Değerlendirmesi",
            //   status: "Warning",
            //   bgColor: "#fff",
            //   value: `{formDetailsModel>/bodyCells/${oElement.RowIid}/${that._sEmpAppColumn}/ValueText}`,
            //   visible: {
            //     parts: [
            //       {
            //         path: `formDetailsModel>/bodyCells/${oElement.RowIid}/${that._sEmpAppColumn}/CellValueAvailability`,
            //       },
            //       {
            //         path: `formDetailsModel>/bodyCells/${oElement.RowIid}/${that._sEmpAppColumn}/ValueText`,
            //       },
            //     ],
            //     formatter: _isFieldVisible,
            //   },
            // }).addStyleClass("sapUiTinyMarginEnd"),

            // new ResultBoard({
            //   icon: "sap-icon://manager",
            //   status: "Success",
            //   bgColor: "#fff",
            //   tooltip: "Yönetici Değerlendirmesi",
            //   value: `{formDetailsModel>/bodyCells/${oElement.RowIid}/${that._sFinAppColumn}/ValueText}`,
            //   visible: {
            //     parts: [
            //       {
            //         path: `formDetailsModel>/bodyCells/${oElement.RowIid}/${that._sFinAppColumn}/CellValueAvailability`,
            //       },
            //       {
            //         path: `formDetailsModel>/bodyCells/${oElement.RowIid}/${that._sFinAppColumn}/ValueText`,
            //       },
            //     ],

            //     formatter: _isFieldVisible,
            //   },
            // }).addStyleClass("sapUiTinyMarginEnd"),
            // new ResultBoard({
            //   icon: "sap-icon://tools-opportunity",
            //   status: "Error",
            //   tooltip: "2. Yönetici Değerlendirmesi",
            //   bgColor: "#fff",
            //   value: `{formDetailsModel>/bodyCells/${oElement.RowIid}/${that._sFinOthColumn}/ValueText}`,
            //   visible: {
            //     parts: [
            //       {
            //         path: `formDetailsModel>/bodyCells/${oElement.RowIid}/${that._sFinOthColumn}/CellValueAvailability`,
            //       },
            //       {
            //         path: `formDetailsModel>/bodyCells/${oElement.RowIid}/${that._sFinOthColumn}/ValueText`,
            //       },
            //     ],

            //     formatter: _isFieldVisible,
            //   },
            // }).addStyleClass("sapUiTinyMarginEnd"),
          ],
        });
      },
      _buildObjectPageHeader: function (oElement) {
        var that = this;
        var sElementEditable =
          "{= ${formDetailsModel>/bodyElements/" +
          oElement.RowIid +
          "/Availability} === 'X' ? true : false }";

        var aElementButtons = that._getElementButtons(
          oElement,
          sElementEditable
        );

        var oTitleExpanded = this._buildObjectTitle(oElement);
        that._addUIElement(
          oElement.RowIid,
          "PageTitleExpanded",
          null,
          oTitleExpanded
        );

        var oTitleSnapped = this._buildObjectTitle(oElement);
        that._addUIElement(
          oElement.RowIid,
          "PageTitleSnapped",
          null,
          oTitleSnapped
        );

        var oPageHeader = new sap.uxap.ObjectPageDynamicHeaderTitle({
          expandedHeading: oTitleExpanded,
          snappedHeading: oTitleSnapped,
        });
        that._addUIElement(oElement.RowIid, "PageHeader", null, oPageHeader);

        $.each(aElementButtons, function (i, oButton) {
          oPageHeader.addAction(oButton.Button);
        });

        return oPageHeader;
      },

      _buildObjectPageLayoutContent: function (
        oPageLayout,
        sRowIid,
        oViewData
      ) {
        //var aChildren = _.filter(oViewData.formData.BodyElements, ["Parent": sRowIid]);
        var aChildren = _.filter(
          oViewData.formData.BodyElements,
          function (oElem) {
            return oElem.Parent === sRowIid && oElem.Availability !== "H";
          }
        );
        var that = this;
        // this._addNoContentInfo(oPageLayout, sRowIid);
        if (aChildren.length > 0) {
          $.each(aChildren, function (i, oChild) {
            that._addSection(oViewData, oPageLayout, oChild.RowIid);
          });
        }
      },
      /**
       * Add no content information
       * @function
       * @private
       */

      _addNoContentInfo: function (oPageLayout, sRowIid) {
        var that = this;
        var sElementPath = `formDetailsModel>/bodyElements/${sRowIid}`;
        var sElementNamePath = sElementPath + "/Name";

        var oSection = new sap.uxap.ObjectPageSection({
          showTitle: false,
          titleUppercase: false,
          visible: {
            path: sElementPath,
            formatter: function (oElem) {
              return oElem.Child === "0000";
            },
          },
        }).addStyleClass("sapUiNoContentPadding");

        oPageLayout.addSection(oSection);
        that._addUIElement(sRowIid, "NoContentSection", null, oSection);

        var oSubSection = new sap.uxap.ObjectPageSubSection().addStyleClass(
          "sapUiNoContentPadding"
        );

        oSection.addSubSection(oSubSection);

        this._addUIElement(sRowIid, "NoContentSubSection", null, oSubSection);

        var oMessagePage = new sap.m.MessagePage({
          showHeader: false,
          icon: "sap-icon://bell",
          text: {
            parts: [
              { path: sElementNamePath },
              { path: "i18n>childrenNotFound" },
            ],

            formatter: function (sElementName, sNotification) {
              return '"' + sElementName + '" ' + sNotification;
            },
          },
          description: { path: "i18n>pushToAddNotice" },
        }).addStyleClass("hapMessagePage");

        oSubSection.addBlock(oMessagePage);
      },
      _addSection: function (oViewData, oPageLayout, sRowIid) {
        var that = this;

        var sWeightingPath = `formDetailsModel>/bodyCells/${sRowIid}/${that._sWeightColumn}/ValueNum`;

        var oSection = new sap.uxap.ObjectPageSection({
          // title: "{formDetailsModel>/bodyElements/" + sRowIid + "/Name}",
          // title: {
          //   parts: [
          //     { path: `formDetailsModel>/bodyElements/${sRowIid}/Name` },
          //     { path: sWeightingPath, formatter: formatter.formatWeighting },
          //   ],
          // },
          title: { path: `formDetailsModel>/bodyElements/${sRowIid}/Name` },
          showTitle: true,
          titleUppercase: false,
        }).addStyleClass("sapUiNoContentPadding");

        that._addSubSections(oSection, oViewData, sRowIid);

        oPageLayout.addSection(oSection);

        that._addUIElement(sRowIid, "Section", null, oSection);
      },
      /**
       * Add root section in case of there ise no doc tab config
       * @function
       * @private
       */
      _addUIElement: function (sRowIid, sUIType, sColumnIid, oElem) {
        var oElemRow = {
          Id: _.uniqueId(`${sUIType}_`) + new Date().valueOf(),
          RowIid: sRowIid,
          UIType: sUIType,
          ColumnIid: sColumnIid,
          UIElementId: oElem.getId(),
        };

        this.formUIElements.push(oElemRow);
      },

      /**
       * Add subsections according to the body elements
       * @function
       * @private
       */
      _addSubSections: function (oSection, oViewData, sRowIid) {
        var oSubSection = new sap.uxap.ObjectPageSubSection({
          title: oSection.getTitle(),
          titleUppercase: false,
          //showTitle: false,
        }).addStyleClass("sapUiNoContentPadding");

        this._addUIElement(sRowIid, "SubSection", null, oSubSection);

        //Add vertical layout

        var oVL = new sap.ui.layout.VerticalLayout({
          width: "100%",
        }).addStyleClass("sapUiNoContentPadding");

        this._addUIElement(sRowIid, "SubSectionContainer", null, oVL);

        oSubSection.addBlock(oVL);

        this._addRow(oVL, oViewData, sRowIid, false, true);
        //Add subsection to section
        oSection.addSubSection(oSubSection);
      },

      /**
       * Find UI element from model
       * @function
       * @private
       */
      _findUIElement: function (sRowIid, sUIType, sColumnIid, bLog) {
        var oFormUIElement = _.find(this.formUIElements, {
          RowIid: sRowIid,
          UIType: sUIType,
          ColumnIid: sColumnIid,
        });
        var oUIElement;
        if (oFormUIElement && oFormUIElement.UIElementId) {
          oUIElement =
            this.byId(oFormUIElement.UIElementId) ||
            sap.ui.getCore().byId(oFormUIElement.UIElementId);
        }
        if (oUIElement) {
          return oUIElement;
        }
        if (bLog) {
          console.log(
            `Element ${sUIType} for row: ${sRowIid} and column ${sColumnIid} not found!`
          );
        }
        return null;
      },

      /**
       * Find UI element from model
       * @function
       * @private
       */
      _findAllUIElementByRow: function (sRowIid) {
        var that = this;
        var aFormUIElementFiltered =
          _.filter(this.formUIElements, {
            RowIid: sRowIid,
          }) || [];

        var aFormUIElementList = aFormUIElementFiltered.map(function (oRow, i) {
          return {
            Id: oRow.Id,
            UIElement:
              that.byId(oRow.UIElementId) ||
              sap.ui.getCore().byId(oRow.UIElementId),
          };
        });

        return aFormUIElementList;
      },

      _checkRowHasVisibleChildren: function(oViewData, sRowIid){

      },

      /**
       * Add rows - new design
       * @function
       * @private
       */
      _addRow: function (oParent, oViewData, sRowIid, bChild, bFirst) {
        let bExist = false;
        let that = this;
        let oRowPanel = null;
        let sFormType = oViewData.formParameters["UX_FORM_TYPE"];
        let iChild = 0;

        oRowPanel = that._findUIElement(sRowIid, "RowPanel", null, false);

        if (oRowPanel) {
          bExist = true;
        }

        let oElem = oViewData.bodyElements[sRowIid];

        if (
          oElem.ElementId !==
          oViewData.formParameters["UX_NO_PANEL_HTML_CONTENT"]
        ) {
          if (!bExist) {
            //Add element it self
            if (oElem === undefined || oElem.Availability === "H") {
              return;
            }

            const aExpandStatuses = oViewData.formParameters["EXPAND_PANEL_STATUSES"]?.split(";") || [];

            oRowPanel = new sap.m.Panel({
              width: "100%",
              expandable: true,
              expanded: {
                parts: [
                  "formDetailsModel>/bodyElements/" + sRowIid + "/ApLevel",
                  "formDetailsModel>/formData/HeaderStatus/ApStatus",
                  "formDetailsModel>/formData/HeaderStatus/ApStatusSub"
                ],
                formatter: (iApLevel, sApStatus, sApStatusSub)=>{
                  if(iApLevel && parseInt(iApLevel) < 4){
                    return true;
                  }

                  if(aExpandStatuses.length === 0){
                    return false;
                  }else{
                    let sStatus = sApStatusSub !== "" && sApStatusSub !== null ? sApStatus + "-" + sApStatusSub : sApStatus;
                    return aExpandStatuses.indexOf(sStatus) !== -1;
                  }
                }
                
              },
              expandAnimation: false,
              backgroundDesign: "Transparent",
            }).addStyleClass("hapRowPanel");

            oRowPanel.addStyleClass("hapRowPanelLevel" + oElem.ApLevel);

            if (bFirst) {
              oRowPanel.addStyleClass("hapRowPanelFirst");
            }

            this._addUIElement(sRowIid, "RowPanel", null, oRowPanel);

            //Generate Header
            this._addRowHeader(oRowPanel, oElem);

            var oDefaultLayout = new GridContainerSettings({
              rowSize: "5rem",
              columnSize: "15rem",
              gap: "1rem",
            });

            var oLayoutS = new GridContainerSettings({
              rowSize: "5rem",
              columnSize: "100%",
              gap: "1rem",
            });
            
            var oLayoutXS = new GridContainerSettings({
              rowSize: "5rem",
              columnSize: "100%",
              gap: "1rem",
            });

            var oPanelGrid = new GridContainer({
              containerQuery: true,
              inlineBlockLayout: true,
              layout: oDefaultLayout,
              layoutS: oLayoutS,
              layoutXS: oLayoutXS,
            })
              .addStyleClass("sapUiTinyMargin")
              .addStyleClass("hapGridContainer");

            if (
              oElem.Description &&
              oElem.Description !== oElem.Name &&
              oElem.ApLevel !== "01" &&
              oElem.ApLevel !== "02"
            ) {
              var oDesc = new MessageAlert({
                type: "Information",
                html:
                  "{formDetailsModel>/bodyElements/" +
                  sRowIid +
                  "/Description}",
                visible:
                  "{formDetailsModel>/bodyElements/" +
                  sRowIid +
                  "/DescriptionVisible}",
                showIcon: true,
                customIcon: "description",
              });

              oDesc.addStyleClass("hapElementDescriptionLevel" + oElem.ApLevel);
              this._addUIElement(sRowIid, "RowDescription", null, oDesc);
              oRowPanel.addContent(oDesc);
            }

            if (oElem.Availability !== "H") {
              iChild = this._addCells(oPanelGrid, sRowIid, oViewData);
            }

            oRowPanel.addContent(oPanelGrid);
            this._addUIElement(sRowIid, "RowPanelGrid", null, oPanelGrid);

            //Add grid to the parent
            oParent.addContent(oRowPanel);
          }
        } else {
          var oHTML = new sap.ui.core.HTML();
          oHTML.setContent(
            `<div style='padding:0.5rem;'>${oElem.Description}</div>`
          );
          oParent.addContent(oHTML);
        }
        // Add children and brothers
        if (oElem.Child !== "0000" && oElem.Child !== sRowIid) {
          if (oViewData.bodyElements[oElem.Child].Parent === sRowIid) {
            this._addRow(oRowPanel, oViewData, oElem.Child, true, false);
          }
        }else{
          if(iChild === 0 && oRowPanel ){
            oRowPanel.addStyleClass("hapRowPanelNoContent");
            oRowPanel.setExpandable(false);
            oRowPanel.setExpanded(false);
          }
        }

        if (
          bChild &&
          oElem.Brother !== "0000" &&
          oElem.Brother !== sRowIid &&
          oElem.Brother !== bChild
        ) {
          this._addRow(oParent, oViewData, oElem.Brother, true, false);
        }
      },

      /**
       * Get button list of an element
       * @function
       * @private
       */
      _getElementButtons: function (oElem, sElementEditable) {
        var that = this;
        var oViewModel = that.getModel("formDetailsModel");
        var oViewData = oViewModel.getData();
        var sParamVal;
        var sObjectiveRow;
        var aButtons = [];

        sParamVal = oViewData.formParameters["FORM_VB_ROW_INDIVIDUAL_GOALS"];
        sObjectiveRow = oViewData.formParameters["OBJECTIVE_ROW"];

        if (oElem.EnhancementVisible) {
          var aElementButtons = oViewData.formData?.BodyElementButtons;
          var oEnhanceButton = _.find(aElementButtons, {
            RowIid: oElem.RowIid,
            Id: "ENHANCE",
          });

          var sEnhanceButtonText = oEnhanceButton
            ? oEnhanceButton.Text
            : that.getText("labelAddElement");

          var oEnhanceAddName = new sap.ui.core.CustomData({
            key: "enhanceName",
            value: sEnhanceButtonText,
          });

          if (oElem.ElementId !== sParamVal) {
            var aCustomDataAdd =
              this._generateCustomDataForActionButtons(oElem);
            aCustomDataAdd.push(oEnhanceAddName);
            var oAddButton = new sap.m.Button({
              icon: "sap-icon://add",
              text: sEnhanceButtonText,
              type: "Accept",
              press:
                sObjectiveRow && sObjectiveRow === oElem.ElementId
                  ? that._handleAddObjectiveByWizard.bind(that)
                  : that._handleAddFormElement.bind(that),
              enabled: sElementEditable,
              customData: aCustomDataAdd,
            });

            that._addUIElement(
              oElem.RowIid,
              "ElementAddButton",
              null,
              oAddButton
            );

            aButtons.push({
              Button: oAddButton,
              Name: "RowAddButton",
            });
          } else {
            var aCustomDataObjAdd =
              this._generateCustomDataForActionButtons(oElem);
            aCustomDataObjAdd.push(oEnhanceAddName);
            var oObjectButton = new sap.m.Button({
              text: "Yeni Hedef Ekle",
              icon: "sap-icon://add",
              enabled: sElementEditable,
              type: "Accept",
              press: jQuery.proxy(that._handleAddFreeFormElement, that, {
                oElem: oElem,
                sObj: false,
              }),
              customData: aCustomDataObjAdd,
            });

            that._addUIElement(
              oElem.RowIid,
              "ElementAddButton",
              null,
              oObjectButton
            );

            aButtons.push({
              Button: oObjectButton,
              Name: "RowAddButton",
            });
          }
        }

        /*Survey button*/
        if (oElem.FormExist) {
          var sFormEnabled =
            "{= ${formDetailsModel>/bodyElements/" +
            oElem.RowIid +
            "/FormExist} && ${formDetailsModel>/bodyCells/" +
            oElem.RowIid +
            "/" +
            oElem.FormColumnIid +
            "/ValueTxt} === '1' }";

          var oFormId = new sap.ui.core.CustomData({
            key: "elementFormId",
            value: {
              path:
                "formDetailsModel>/bodyElements/" + oElem.RowIid + "/FormId",
            },
          });

          var aCustomDataSurvey =
            this._generateCustomDataForActionButtons(oElem);
          aCustomDataSurvey.push(oFormId);

          var oSurveyButton = new sap.m.Button({
            icon: "sap-icon://survey",
            type: "Accept",
            press: that._handleOpenSurvey.bind(that),
            enabled: sFormEnabled,
            customData: aCustomDataSurvey,
          });

          that._addUIElement(oElem.RowIid, "SurveyButton", null, oSurveyButton);

          aButtons.push({
            Button: oSurveyButton,
            Name: "RowSurveyButton",
          });
        }

        /*Attachment button */
        if (oElem.AttachmentVisible) {
          var sAttachVisible =
            "{formDetailsModel>/bodyElements/" +
            oElem.RowIid +
            "/AttachmentVisible}";

          var aCustomDataAtt = this._generateCustomDataForActionButtons(oElem);

          var oAttButton = new sap.m.Button({
            icon: "sap-icon://add-document",
            text: "{i18n>addAttachmentFile}",
            press: jQuery.proxy(that._handleAddAttachment, that, {
              rowIid: oElem.RowIid,
              elementName: oElem.Name,
            }),
            enabled: sElementEditable,
            visible: sAttachVisible,
            customData: aCustomDataAtt,
          });

          that._addUIElement(
            oElem.RowIid,
            "AttachmentButton",
            null,
            oAttButton
          );

          aButtons.push({
            Button: oAttButton,
            Name: "RowAttButton",
          });

          // var oRowIid3 = new sap.ui.core.CustomData({
          //   key: "elementRowIid",
          //   value: oElem.RowIid,
          // });
          // var oElementName3 = new sap.ui.core.CustomData({
          //   key: "elementName",
          //   value: {
          //     path: "formDetailsModel>/bodyElements/" + oElem.RowIid + "/Name",
          //   },
          // });
          var aCustomDataAttList =
            this._generateCustomDataForActionButtons(oElem);

          var oAttListButton = new sap.m.Button({
            icon: "sap-icon://attachment",
            type: "Reject",
            text: {
              parts: [
                {
                  path: "i18n>attachmentList",
                },
                {
                  path:
                    "formDetailsModel>/attachmentCollection/" +
                    oElem.RowIid +
                    "/attachmentList",
                },
              ],
              formatter: function (sText, aAttList) {
                try {
                  if (aAttList) {
                    if (aAttList.length > 0) {
                      return sText + " (" + aAttList.length + ")";
                    } else {
                      return sText;
                    }
                  } else {
                    return sText;
                  }
                } catch (oErr) {
                  return sText;
                }
              },
            },
            press: that._handleListAttachment.bind(that),
            visible: {
              path:
                "formDetailsModel>/attachmentCollection/" +
                oElem.RowIid +
                "/attachmentList",
              formatter: function (aAttList) {
                try {
                  if (aAttList) {
                    if (aAttList.length > 0) {
                      return true;
                    } else {
                      return false;
                    }
                  } else {
                    return false;
                  }
                } catch (oErr) {
                  return false;
                }
              },
            },
            customData: aCustomDataAttList,
          });

          that._addUIElement(
            oElem.RowIid,
            "AttachmentListButton",
            null,
            oAttListButton
          );

          aButtons.push({
            Button: oAttListButton,
            Name: "RowAttListButton",
          });
          /*Attachment button*/
        }

        if (oElem.DeletionVisible) {
          var aCustomDataDel = this._generateCustomDataForActionButtons(oElem);
          var oRemoveButton = new sap.m.Button({
            icon: "sap-icon://delete",
            type: "Reject",
            press: that._handleDeleteFormElement.bind(that),
            enabled: sElementEditable,
            layoutData: new sap.m.OverflowToolbarLayoutData({
              moveToOverflow: false,
            }),
            customData: aCustomDataDel,
          });

          that._addUIElement(oElem.RowIid, "RemoveButton", null, oRemoveButton);

          aButtons.push({
            Button: oRemoveButton,
            Name: "RowDeleteButton",
          });
        }

        return aButtons;
      },
      /**
       * Generate custom data for action buttons
       * To avoid custom data memory leak error!!!
       * @function
       * @private
       */
      _generateCustomDataForActionButtons: function (oElem) {
        var aCustomData = [];

        var oRowIid = new sap.ui.core.CustomData({
          key: "elementRowIid",
          value: {
            path: "formDetailsModel>/bodyElements/" + oElem.RowIid + "/RowIid",
          },
        });
        aCustomData.push(oRowIid);

        var oElementName = new sap.ui.core.CustomData({
          key: "elementName",
          value: {
            path: "formDetailsModel>/bodyElements/" + oElem.RowIid + "/Name",
          },
        });

        aCustomData.push(oElementName);

        var oElementLevel = new sap.ui.core.CustomData({
          key: "elementLevel",
          value: {
            path: "formDetailsModel>/bodyElements/" + oElem.RowIid + "/ApLevel",
          },
        });

        aCustomData.push(oElementLevel);

        return aCustomData;
      },

      /**
       * Add row toolbar
       * @function
       * @private
       */
      _addRowHeader: function (oParent, oElem) {
        var that = this;
        var sNameElement = "";
        var sElementEditable =
          "{= ${formDetailsModel>/bodyElements/" +
          oElem.RowIid +
          "/Availability} === 'X' ? true : false }";
        var oPanelToolbar = new sap.m.OverflowToolbar();

        var oPanelHeader = null;
        this._addUIElement(
          oElem.RowIid,
          "RowPanelToolbar",
          null,
          oPanelToolbar
        );

        if (!oElem.FreeInput) {
          sNameElement = "NameString";
          oPanelHeader = new sap.m.Text({
            text: {
              path: "formDetailsModel>/bodyElements/" + oElem.RowIid + "/NameString",
            },
          });
        } else {
          sNameElement = "Name";
          oPanelHeader = new sap.m.Input({
            value: {
              path: "formDetailsModel>/bodyElements/" + oElem.RowIid + "/Name",
            },
            width: "40%",
            maxLength: 80,
            editable: sElementEditable,
            layoutData: new sap.m.OverflowToolbarLayoutData({
              moveToOverflow: false,
            }),
          });
        }
        oPanelHeader.addStyleClass("hapElementNameLevel" + oElem.ApLevel);

        this._addUIElement(oElem.RowIid, "RowPanelHeader", null, oPanelHeader);

        oPanelToolbar.addContent(oPanelHeader);

        /* Add Weighting - Upper Objective */
        this._addWeightingColumnToRowHeader(oPanelToolbar, oElem);
        /* Add Weighting - Upper Objective */

        /* Add Object Description */
        // this._addObjectDescriptionToRowHeader(oPanelToolbar, oElem);
        /* Add Object Description */

        var oSpacer = new sap.m.ToolbarSpacer();
        oPanelToolbar.addContent(oSpacer);

        var aRowButtons = this._getElementButtons(oElem, sElementEditable);

        $.each(aRowButtons, function (i, oButton) {
          oPanelToolbar.addContent(oButton.Button);
          that._addUIElement(oElem.RowIid, oButton.Name, null, oButton.Button);
        });

        oParent.setHeaderToolbar(oPanelToolbar);
      },
      _addWeightingColumnToRowHeader: function (oPanelHeader, oElem) {
        var that = this;
        var oViewModel = this.getModel("formDetailsModel");
        var oViewData = oViewModel.getData();
        var oWeightingCell = _.find(oViewData.formData["BodyCells"], {
          RowIid: oElem.RowIid,
          ColumnIid: that._sWeightColumn,
        });

        if (
          oWeightingCell.CellValueAvailability !== "H" &&
          oWeightingCell.CellValueAvailability !== "K"
        ) {
          var oEl = new ResultBoard({
            status: "Error",
            value: {
              path: `formDetailsModel>/bodyCells/${oWeightingCell.RowIid}/${oWeightingCell.ColumnIid}/ValueNum`,
              type: "sap.ui.model.type.Float",
              formatter: (v)=>{
                return formatter.convertFloatToString(parseFloat(v))
              }
            },
            unit: " %",
            bgColor: "#fff",
            editable: {
              parts: [
                {
                  path: `formDetailsModel>/bodyCells/${oWeightingCell.RowIid}/${oWeightingCell.ColumnIid}/CellValueAvailability`,
                },
                {
                  path: `formDetailsModel>/bodyCells/${oWeightingCell.RowIid}/${oWeightingCell.ColumnIid}`,
                },
              ],
              formatter: that._getCellEditable.bind(that),
            },
          }).addStyleClass("sapUiTinyMarginEnd");

          oPanelHeader.addContent(oEl);
        }
      },

      _addObjectDescriptionToRowHeader: function (oPanelHeader, oElem) {
        var that = this;
        var oViewModel = this.getModel("formDetailsModel");
        var oViewData = oViewModel.getData();

        if (oElem.DescriptionVisible) {
          // var oElemDescription = new sap.ui.core.CustomData({
          //   key: "elementDescription",
          //   value: `{formDetailsModel>/bodyElements/${oElem.RowIid}/Description}`,
          // });
          var oDesToggler = new sap.m.Button({
            icon: "sap-icon://hint",
            tooltip: "Açıklama",
            press: function () {
              var oDesc = new MessageAlert({
                type: "Information",
                html: `{formDetailsModel>/bodyElements/${oElem.RowIid}/Description}`,
                showIcon: true,
                customIcon: "description",
              });

              var oDescPopover = new sap.m.Popover({
                content: oDesc,
                afterClose: function () {
                  oDescPopover.destroy();
                },
                showHeader: false,
              }).addStyleClass("sapUiNoContentPadding");

              that.getView().addDependent(oDescPopover);
              oDescPopover.openBy(oDesToggler);
            },
            type: "Emphasized",
            visible:
              "{= ${formDetailsModel>/bodyElements/" +
              oElem.RowIid +
              "/DescriptionVisible} && ${formDetailsModel>/formType} !== 'probation'}",
          });
          // oDepInfoButton.addCustomData(oCellValue);
          oPanelHeader.addContent(oDesToggler);
        }
      },
      /**
       * Add cells according to the doc tab
       * @function
       * @private
       */
      _addCells: function (oParent, sRowIid, oViewData) {
        const that = this;
        let iChild = 0;
        
        //bu satırda bölüm hedefi var mı?
        // var oObjTeam = _.find(oViewData.formData["BodyCells"], {
        //   RowIid: sRowIid,
        //   ColumnIid: that._sObjTeamColumn,
        // });

        $.each(oViewData.formData["BodyColumns"], function (sIndex, oColumn) {
          /* Do Not Add Weigting  */
          if (
            oColumn.ColumnIid === that._sWeightColumn
          ) {
            return true;
          }
          /* Do Not Add Weigting  */

          if (oViewData.bodyCells[sRowIid].hasOwnProperty(oColumn.ColumnIid)) {
            var oCell = oViewData.bodyCells[sRowIid][oColumn.ColumnIid];
            if (
              (oCell.CellValueAvailability !== "H" &&
                oCell.CellValueAvailability !== "K") ||
              oCell.CellNoteAvailability !== "H"
            ) {
              var oVB = new sap.m.VBox({
                width: "100%",
              });

              var oEL = null;

              if (
                oCell.CellValueAvailability !== "H" &&
                oCell.CellValueAvailability !== "K"
              ) {
                let sCaptionVisible =
                  "{= ${formDetailsModel>/bodyCells/" +
                  oCell.RowIid +
                  "/" +
                  oCell.ColumnIid +
                  "/Caption} === '' ? false : true }";
                oEL = new sap.m.Label({
                  visible: sCaptionVisible,
                  text:
                    "{path:'formDetailsModel>/bodyCells/" +
                    oCell.RowIid +
                    "/" +
                    oCell.ColumnIid +
                    "/Caption'}:",
                }).addStyleClass("hapCellCaption");
              } else if (oCell.CellNoteAvailability !== "H") {
                let sCaptionNoteVisible =
                  "{= ${formDetailsModel>/bodyCells/" +
                  oCell.RowIid +
                  "/" +
                  oCell.ColumnIid +
                  "/CaptionNote} === '' ? false : true }";

                oEL = new sap.m.Label({
                  visible: sCaptionNoteVisible,
                  text:
                    "{path:'formDetailsModel>/bodyCells/" +
                    oCell.RowIid +
                    "/" +
                    oCell.ColumnIid +
                    "/CaptionNote'}:",
                }).addStyleClass("hapCellCaption");
              }
              oVB.addItem(oEL);
              //oParent.addContent(oVB);
              oParent.addItem(oVB);

              //Add cell content
              let iSubChild =  that._addCell(oVB, oCell, oViewData) || 0;
              iChild = iChild + iSubChild;
             
            }
          }
        });
        return iChild;
      },

      _addCell: function (oParent, oCell, oViewData) {
        var that = this;
        var oEl = null;
        var oTg = null;
        var bSwitch = false;

        var aBodyElements = oViewData.bodyElements;
        var sLastRow = oViewData.formParameters["RESULT_LINE"];
        var sFormType = oViewData.formParameters["UX_FORM_TYPE"];
        var iCellCount = 0;

        var oCellRow = _.find(aBodyElements, {
          RowIid: oCell.RowIid,
        });

        var bIsLastRow = oCellRow.ElementId === sLastRow ? true : false;

        if (oCell.RowIid !== "0000" && oCell.ColumnIid !== "0000") {
          if (
            oCell.CellValueAvailability !== "H" &&
            oCell.CellValueAvailability !== "K"
          ) {
            switch (oCell.ValueType) {
              case "N":
                switch (oCell.LayoutType) {
                  case "M":
                    /*Multi input*/
                    oEl = this._addMultiInput(oCell);
                    break;
                  case "J":
                    /*Text area json*/
                    oEl = this._addTextAreaObjective(oCell);
                    break;
                  default:
                    if (oCell.CellValueClass === "ZQ") {
                      oEl = this._addResultBoard(oCell);
                    } else {
                      oEl = this._addInputField(oCell, "ValueNum");
                      bSwitch = true;
                    }
                }
                break;

              case "D":
                oEl = this._addDateField(oCell);
                break;

              case "S":
                /*String*/
                switch (oCell.LayoutType) {
                  case "S":
                    /*String*/
                    if (oCell.CellValueClass === "ZQ") {
                      oEl = this._addResultBoard(oCell);
                    } else {
                      oEl = this._addInputField(oCell, "ValueString");
                      bSwitch = true;
                    }
                    break;
                  case "R":
                    /*Radiobutton*/
                    oEl = this._addRadioButton(oCell);
                    break;
                  case "L":
                    //var oEl = this._addRadioButton(oCell);
                    //oEl = this._addListBox(oCell); /*sap.m.Select*/

                    oEl = this._addListBox(oCell); /*sap.m.Select*/
                    break;
                  case "C":
                    oEl = this._addCheckBox(oCell);
                    break;
                  case "T":
                    oEl = this._addCheckBox(oCell);
                    break;
                  case "M":
                    /*Multi input*/
                    oEl = this._addMultiInput(oCell);
                    break;
                  case "J":
                    /*Text area json*/
                    oEl = this._addTextAreaObjective(oCell);
                    break;
                }
                break;
            }
            that._addUIElement(oCell.RowIid, "CellValue", oCell.ColumnIid, oEl);
            //oEl.addStyleClass("hapCellElement");
            // if (oCell.LayoutType === "R") {
            //   oEl.setLayoutData(
            //     new sap.ui.layout.GridData({
            //       span: "XL12 L12 M12 S12",
            //     })
            //   );
            // }
            iCellCount++;
            oParent.addItem(oEl);
            if (oTg) {
              oParent.addItem(oTg);
            }

            if (
              (oCell.ColumnIid === that._sObjCvlColumn ||
                oCell.ColumnIid === that._sObjRvlColumn) &&
              bSwitch
            ) {
              oEl = this._addSwitch(oCell);
              oParent.addItem(oEl);
            }

            //oParent.addField(oEl);
          }

          if (
            oCell.CellNoteAvailability !== "H" &&
            oCell.LayoutType !== "M" &&
            oCell.LayoutType !== "J"
          ) {
            //Note label
            var sCellNoteEditablePath =
              "formDetailsModel>/bodyCells/" +
              oCell.RowIid +
              "/" +
              oCell.ColumnIid +
              "/CellNoteAvailability";

            var sCaptionNoteVisible =
              "{= ${formDetailsModel>/bodyCells/" +
              oCell.RowIid +
              "/" +
              oCell.ColumnIid +
              "/CaptionNote} === '' ? false : true }";

            var oCNL = new sap.m.Label({
              text: oCell.CaptionNote + ":",
              visible: sCaptionNoteVisible,
            });
            oCNL.addStyleClass("hapElementCaption");
            //that._addUIElement(oCell.RowIid, "CellNoteCaption", oCell.ColumnIid, oCNL);
            //oFBC.addItem(oCNL);
            var sCellNoteStringPath =
              "formDetailsModel>/bodyCells/" +
              oCell.RowIid +
              "/" +
              oCell.ColumnIid +
              "/NoteString";

            var oTA = new sap.m.TextArea({
              value: {
                path: sCellNoteStringPath,
              },
              rows: 3,
              width: "100%",
              valueLiveUpdate: true,
              editable: {
                path: sCellNoteEditablePath,
                formatter: function (sCellNoteAvailability) {
                  if (
                    sCellNoteAvailability === "X" ||
                    sCellNoteAvailability === "A"
                  ) {
                    return true;
                  } else {
                    return false;
                  }
                },
              },
              valueState: {
                parts: [
                  {
                    path: `formDetailsModel>/bodyCells/${oCell.RowIid}/${oCell.ColumnIid}/CellValueAvailability`,
                  },
                  {
                    path: `formDetailsModel>/bodyCells/${oCell.RowIid}/${oCell.ColumnIid}/CellNoteAvailability`,
                  },
                  {
                    path: `formDetailsModel>/bodyCells/${oCell.RowIid}/${oCell.ColumnIid}/ValueString`,
                  },
                  {
                    path: `formDetailsModel>/bodyCells/${oCell.RowIid}/${oCell.ColumnIid}/NoteString`,
                  },
                ],
                formatter: function (
                  sCellValueAvailability,
                  sCellNoteAvailability,
                  sCellValue,
                  sCellNoteValue
                ) {
                  if (
                    (sCellValueAvailability === "X" ||
                      sCellValueAvailability === "R") &&
                    (sCellNoteAvailability === "X" ||
                      sCellNoteAvailability === "A")
                  ) {
                    if (sCellValue === "0001" || sCellValue === "0005") {
                      if (sCellNoteValue.trim().length === 0) {
                        return "Error";
                      } else {
                        return "Success";
                      }
                    } else {
                      return "None";
                    }
                  }
                },
              },
              valueStateText: {
                parts: [
                  {
                    path: `formDetailsModel>/bodyCells/${oCell.RowIid}/${oCell.ColumnIid}/CellValueAvailability`,
                  },
                  {
                    path: `formDetailsModel>/bodyCells/${oCell.RowIid}/${oCell.ColumnIid}/CellNoteAvailability`,
                  },
                  {
                    path: `formDetailsModel>/bodyCells/${oCell.RowIid}/${oCell.ColumnIid}/ValueString`,
                  },
                  {
                    path: `formDetailsModel>/bodyCells/${oCell.RowIid}/${oCell.ColumnIid}/NoteString`,
                  },
                  {
                    path: `formDetailsModel>/bodyCells/${oCell.RowIid}/${oCell.ColumnIid}/ValueText`,
                  },
                ],
                formatter: function (
                  sCellValueAvailability,
                  sCellNoteAvailability,
                  sCellValue,
                  sCellNoteValue,
                  sCellValueText
                ) {
                  if (
                    (sCellValueAvailability === "X" ||
                      sCellValueAvailability === "R") &&
                    (sCellNoteAvailability === "X" ||
                      sCellNoteAvailability === "A")
                  ) {
                    if (sCellValue === "0001" || sCellValue === "0005") {
                      if (sCellNoteValue.trim().length === 0) {
                        return `Değerlendirme için açıklama girilmeli`;
                      }
                    }
                  }
                },
              },
            }); //addStyleClass("hapTextArea");
            that._addUIElement(oCell.RowIid, "CellNote", oCell.ColumnIid, oTA);
            //oTA.addStyleClass("hapCellElement");
            //oParent.addField(oTA);
            oParent.addItem(oTA);
          }
        }
        return iCellCount;
      }, //_addCell

      _addResultBoard: function (oCell) {
        var oEl = new ResultBoard({
          tooltip: {
            path: `formDetailsModel>/bodyColumns/${oCell.ColumnIid}/ColumnName`,
          },
          status: "Warning",
          bgColor: "#fff",
          value: {
            path: `formDetailsModel>/bodyCells/${oCell.RowIid}/${oCell.ColumnIid}/ValueText`,
          },
          visible: true,
        });
        return oEl;
      },

      _addSwitch: function (oCell) {
        var that = this;
        var sObjUniPath = `formDetailsModel>/bodyCells/${oCell.RowIid}/${this._sObjUniColumn}/ValueString`;
        var sCellPath = `/bodyCells/${oCell.RowIid}/${oCell.ColumnIid}`;
        var oViewModel = that.getModel("formDetailsModel");

        var oSwitch = new sap.m.Switch({
          type: "AcceptReject",
          state: {
            path: `formDetailsModel>/bodyCells/${oCell.RowIid}/${oCell.ColumnIid}/ValueString`,
            formatter: function (sVal) {
              if (sVal === "") {
                return false;
              } else {
                return true;
              }
            },
          },
          change: function (oEvent) {
            var oBodyCell = oViewModel.getProperty(sCellPath);
            var bState = oEvent.getParameter("state");
            var iVal = bState ? "1" : "0";
            var sVal = bState ? "1" : "";
            oBodyCell.ValueString = sVal;
            oBodyCell.ValueNnv = sVal;
            oBodyCell.ValueText = sVal;
            oBodyCell.ValueTxt = sVal;
            oBodyCell.ValueNum = parseFloat(iVal).toFixed(3);
            oViewModel.setProperty(sCellPath, oBodyCell);
            that._triggerValueDetermination();
          },
          enabled: {
            parts: [
              {
                path: `formDetailsModel>/bodyCells/${oCell.RowIid}/${oCell.ColumnIid}/CellValueAvailability`,
              },
              {
                path: `formDetailsModel>/bodyCells/${oCell.RowIid}/${oCell.ColumnIid}`,
              },
            ],
            formatter: that._getCellEditable.bind(that),
          },
          visible: "{= ${" + sObjUniPath + "} === '0005' }",
        });

        var oPopover = new sap.m.Popover({
          modal: false,
          showHeader: false,
          placement: "Auto",
          content: [
            new sap.m.VBox({
              width: "100%",
              height: "100%",
              alignItems: "Center",
              justifyContent: "Center",
              items: [
                new sap.m.Text({
                  text: {
                    path: `formDetailsModel>/bodyCells/${oCell.RowIid}/${oCell.ColumnIid}/ValueString`,
                    formatter: function (sVal) {
                      if (sVal === "") {
                        return "Gerçekleşmedi";
                      } else {
                        return "Gerçekleşti";
                      }
                    },
                  },
                }).addStyleClass("sapUiTinyMargin"),
              ],
            }).addStyleClass("sapUiNoContentPadding"),
          ],
        }).addStyleClass("sapUiNoContentPadding");
        this.getView().addDependent(oPopover, this);
        var oEl = new Switch({
          popover: oPopover,
          switch: oSwitch,
        });
        return oEl;
      },

      _addNewElementFreeFormCells: function (
        oParent,
        sAppraisalId,
        sNewRowIid,
        oEnhanceData
      ) {
        var that = this;
        var oViewModel = this.getModel("formDetailsModel");
        var oBodyElements = oViewModel.getProperty("/bodyElements");
        var oBodyCells = oViewModel.getProperty("/bodyCells");
        var aBodyElements = oEnhanceData.BodyElements.results;
        var aBodyCells = oEnhanceData.BodyCells.results;
        var aBodyColumns = oEnhanceData.BodyColumns.results;
        var oElem = _.find(aBodyElements, ["RowIid", sNewRowIid]);
        var oFiCell = _.find(aBodyCells, {
          RowIid: sNewRowIid,
          ColumnIid: that._getColumnIid("OBJ0"),
        });
        var aNewCells = _.filter(aBodyCells, ["RowIid", sNewRowIid]);

        //first free input with its label
        var oFC = new sap.ui.layout.form.FormContainer();
        var oFE = null;

        if (oElem.FreeInput) {
          var sPlaceHolder = _.clone(
            oViewModel.getProperty(
              "/bodyCells/" +
                sNewRowIid +
                "/" +
                that._getColumnIid("OBJ0") +
                "/Caption"
            )
          );

          oViewModel.setProperty("/bodyElements/" + sNewRowIid + "/Name", "");

          oFE = new sap.ui.layout.form.FormElement({
            label: oFiCell.Caption,
          });

          var oFI = new sap.m.Input({
            placeholder: '"' + sPlaceHolder + '" giriniz...',
            value: "{formDetailsModel>/bodyElements/" + sNewRowIid + "/Name}",
            maxLength: 80,
          });
          oFI.setLayoutData(
            new sap.ui.layout.GridData({
              span: "XL4 L4 M8 S12",
            })
          );
          oFE.addField(oFI);
          oFC.addFormElement(oFE);
          oParent.addFormContainer(oFC);
        }

        //now add cell
        $.each(aNewCells, function (sIndex, oCell) {
          var oColumn = _.find(aBodyColumns, ["ColumnIid", oCell.ColumnIid]);
          if (oColumn) {
            if (
              (oCell.CellValueAvailability !== "H" &&
                oCell.CellValueAvailability !== "K") ||
              oCell.CellNoteAvailability !== "H"
            ) {
              that._addNewElementFreeFormCell(oParent, sAppraisalId, oCell);
            }
          }
        });
      }, //_addNewElementFreeFormCells

      _addNewElementFreeFormCell: function (oParent, sAppraisalId, oCell) {
        var that = this;
        var sObjTeamColumnIid =
          this._getColumnIid("ZTTJ") || this._getColumnIid("ZT00");

        if (
          oCell.RowIid !== "0000" &&
          oCell.ColumnIid !== "0000" &&
          oCell.ColumnIid !== sObjTeamColumnIid
        ) {
          //Column label
          var oFC = new sap.ui.layout.form.FormContainer();
          var oFE = null;

          if (
            oCell.CellValueAvailability !== "H" &&
            oCell.CellValueAvailability !== "K"
          ) {
            oFE = new sap.ui.layout.form.FormElement({
              label: oCell.Caption,
            });
            oFC.addFormElement(oFE);
            oParent.addFormContainer(oFC);

            switch (oCell.ValueType) {
              case "N":
                switch (oCell.LayoutType) {
                  case "M":
                    /*Multi input*/
                    var oEl = this._addMultiInput(oCell);
                    break;
                  case "J":
                    /*Text area json*/
                    var oEl = this._addTextAreaObjective(oCell);
                    break;
                  default:
                    var oEl = this._addInputField(oCell, "ValueNum");
                }
                break;
              case "D":
                var oEl = this._addDateField(oCell);
                break;
              case "S":
                /*String*/
                switch (oCell.LayoutType) {
                  case "S":
                    /*String*/
                    var oEl = this._addInputField(oCell, "ValueString");
                    break;
                  case "R":
                    /*Radiobutton*/
                    var oEl = this._addRadioButton(oCell, false);
                    break;
                  case "L":
                    /*Listbox*/
                    var oEl = this._addListBox(oCell);
                    break;
                  case "C":
                    var oEl = this._addCheckBox(oCell);
                    break;
                  case "T":
                    var oEl = this._addInputField(oCell, "ValueNum");
                    break;
                  case "M":
                    /*Multi input*/
                    var oEl = this._addMultiInput(oCell);
                    break;
                  case "J":
                    /*Text area json*/
                    var oEl = this._addTextAreaObjective(oCell);
                    break;
                }
                break;
            }
            that._addUIElement(oCell, "CellValue", oCell.ColumnIid, oEl);
            //oEl.addStyleClass("hapCellElement");
            oEl.setLayoutData(
              new sap.ui.layout.GridData({
                span: "XL4 L4 M8 S12",
              })
            );
            //oParent.addContent(oEl);
            oFE.addField(oEl);
          }

          if (
            oCell.CellNoteAvailability !== "H" &&
            oCell.LayoutType !== "M" &&
            oCell.LayoutType !== "J"
          ) {
            var sCellNoteEditablePath =
              "formDetailsModel>/bodyCells/" +
              oCell.RowIid +
              "/" +
              oCell.ColumnIid +
              "/CellNoteAvailability";

            //Note label
            oFE = null;
            oFE = new sap.ui.layout.form.FormElement({
              label: oCell.CaptionNote,
            });
            oFC.addFormElement(oFE);
            oParent.addFormContainer(oFC);

            var oTA = new sap.m.TextArea({
              value:
                "{formDetailsModel>/bodyCells/" +
                oCell.RowIid +
                "/" +
                oCell.ColumnIid +
                "/NoteString}",
              cols: 50,
              rows: 5,
              editable: {
                path: sCellNoteEditablePath,
                formatter: function (sCellNoteAvailability) {
                  if (
                    sCellNoteAvailability === "X" ||
                    sCellNoteAvailability === "A"
                  ) {
                    return true;
                  } else {
                    return false;
                  }
                },
              },
            });
            oTA.setLayoutData(
              new sap.ui.layout.GridData({
                span: "XL4 L4 M8 S12",
              })
            );
            that._addUIElement(oCell, "CellNote", oCell.ColumnIid, oTA);
            //oParent.addContent(oTA);
            oFE.addField(oTA);
          }
        }
      }, //_addNewElementFreeFormCellNew

      _addInputField: function (oCell, sBindingField) {
        var sCell = "formDetailsModel>/bodyCells/" + oCell.RowIid + "/" + oCell.ColumnIid;
        var sCellPath = sCell + "/";
        var sEditablePath = sCell + "/CellValueAvailability";
        var sColumnIid = sCell + "/ColumnIid";
        var that = this;
        var oIF = new sap.m.Input({
          value: {
            path:
              "formDetailsModel>/bodyCells/" +
              oCell.RowIid +
              "/" +
              oCell.ColumnIid +
              "/" +
              sBindingField,
          },
          textAlign: "Left",
          //   submit: this._onInputFieldValueChange,
          editable: {
            parts: [
              {
                path: sEditablePath,
              },
              {
                path: sCellPath,
              },
            ],
            formatter: that._getCellEditable.bind(that),
          },
          width: {
            path: sColumnIid,
            formatter: function (sColIid) {
              if (sColIid === that._getColumnIid("FWGT")) {
                return "50px";
              } else {
                return "100%";
              }
            },
          },
          change: ()=>{
            this._triggerValueDetermination()
          }
        }); //.addStyleClass("hapInputField");

        return oIF;
      },
      _addDateField: function (oCell) {
        var sCell =
          "formDetailsModel>/bodyCells/" + oCell.RowIid + "/" + oCell.ColumnIid;
        var sCellPath = sCell + "/";
        var sEditablePath = sCell + "/CellValueAvailability";
        var that = this;

        var oDF = new sap.m.DatePicker({
          value: {
            path:
              "formDetailsModel>/bodyCells/" +
              oCell.RowIid +
              "/" +
              oCell.ColumnIid +
              "/ValueDate",
            type: "sap.ui.model.type.Date",
            formatOptions: {
              UTC: true,
              pattern: "dd.MM.yyyy",
            },
          },
          valueFormat: "yyyy-MM-dd",
          displayFormat: "dd.MM.yyyy",
          editable: {
            parts: [
              {
                path: sEditablePath,
              },
              {
                path: sCellPath,
              },
            ],
            formatter: that._getCellEditable.bind(that),
          },
          placeholder: "Tarih seçiniz",
        }); //.addStyleClass("hapDateField");
        return oDF;
      },

      _getCellEditable: function (sCellValueAvailability, oCell) {
        try {
          var oViewModel = this.getModel("formDetailsModel");
          var oBodyCells = oViewModel.getProperty("/bodyCells/" + oCell.RowIid);
          var sEduSel = true;
          var sEduColumnIid = this._getColumnIid("ZSEC");
          if (
            oCell.ColumnIid !== sEduColumnIid &&
            oBodyCells.hasOwnProperty(sEduColumnIid)
          ) {
            sEduSel = false;
            var oEduCell = oBodyCells[sEduColumnIid];
            if (
              oEduCell.ValueNum === "1" ||
              oEduCell.ValueNum == 1 ||
              oEduCell.ValueNum === "0001"
            ) {
              sEduSel = true;
            }
          }

          if (
            (sCellValueAvailability === "X" ||
              sCellValueAvailability === "R") &&
            sEduSel
          ) {
            return true;
          } else {
            return false;
          }
        } catch (oEx) {
          return false;
        }
      },

      _addCheckBox: function (oCell) {
        var that = this;
        var sCell =
          "formDetailsModel>/bodyCells/" + oCell.RowIid + "/" + oCell.ColumnIid;
        var sChkBox = sCell + "/ChkboxValueText";
        var sCellValue =
          "/bodyCells/" + oCell.RowIid + "/" + oCell.ColumnIid + "/";
        var sEditablePath = sCell + "/CellValueAvailability";
        var sCellPath = sCell + "/";
        var sStateBinding =
          "{= ${formDetailsModel>/bodyCells/" +
          oCell.RowIid +
          "/" +
          oCell.ColumnIid +
          "/ValueString} === '0001' ? true : false }";

        var oCB = new sap.m.Switch({
          state: sStateBinding,
          enabled: {
            parts: [
              {
                path: sEditablePath,
              },
              {
                path: sCellPath,
              },
            ],
            formatter: that._getCellEditable.bind(that),
          },
          type: "AcceptReject",
          change: function (oEvent) {},
        }).addStyleClass("hapCheckBox");

        //Binding reference for value set
        oCB.data("bindingReference", sCellValue);
        oCB.data("elementRowIid", oCell.RowIid);
        oCB.data("elementColumnIid", oCell.ColumnIid);

        return oCB;
      },

      _openValDescInfo: function (oSource) {
        var that = this;
        var oViewModel = this.getModel("formDetailsModel");
        var sRowIid = oSource.data("elementRowIid");
        var sColumnIid = oSource.data("elementColumnIid");
        var sAppraisalId = oSource.data("appraisalId");
        var aCellValues = oViewModel.getProperty("/formData/BodyCellValues");
        var aValueDesc = [];

        if (
          sRowIid === this._currentRowIid &&
          sColumnIid === this._currentColumnIid
        ) {
          return;
        }

        this._currentRowIid = sRowIid;
        this._currentColumnIid = sColumnIid;

        $.each(aCellValues, function (sKey, oCellValue) {
          if (
            oCellValue.RowIid === sRowIid &&
            oCellValue.ColumnIid === sColumnIid
          ) {
            aValueDesc.push(oCellValue);
          }
        });

        oViewModel.setProperty("/currentCellValueDescription", aValueDesc);

        if (aValueDesc.length > 0) {
          if (!that._oValDescPopover) {
            that._oValDescPopover = sap.ui.xmlfragment(
              "hcm.ux.hapv5.fragment.ValueDescription",
              this
            );
            // connect dialog to view (models, lifecycle)
            that.getView().addDependent(that._oValDescPopover);
          } else {
            that._oValDescPopover.close();
          }
          that._oValDescPopover.openBy(oSource);
        }
      },

      _closeValDescInfo: function (oSource) {
        if (this._oValDescPopover) {
          this._currentRowIid = "0000";
          this._currentColumnIid = "0000";
          this._oValDescPopover.close();
        }
      },
      _addRadioButton: function (oCell) {
        var that = this;
        var sCell =
          "formDetailsModel>/bodyCells/" + oCell.RowIid + "/" + oCell.ColumnIid;
        var sCellValue =
          "/bodyCells/" + oCell.RowIid + "/" + oCell.ColumnIid + "/ValueString";
        var sEditablePath = sCell + "/CellValueAvailability";
        var sCellValueString = sCell + "/ValueString";
        /*First create the radio button group*/
        var oRBG = new sap.m.RadioButtonGroup({
          // selectedKey: null,
          editable: {
            path: sEditablePath,
            formatter: function (sCellValueAvailability) {
              if (
                sCellValueAvailability === "X" ||
                sCellValueAvailability === "R"
              ) {
                return true;
              } else {
                return false;
              }
            },
          },
          valueState: {
            path: sCellValueString,
            formatter: function (sCellValue) {
              if (
                sCellValue !== "0000" &&
                sCellValue !== null &&
                sCellValue !== undefined &&
                sCellValue !== ""
              ) {
                return sap.ui.core.ValueState.None;
              } else {
                return sap.ui.core.ValueState.Error;
              }
            },
          },
        }).addStyleClass("hapRadioButtonGroup");

        var sCellValuePath = "formDetailsModel>" + sCellValue;

        var sSelectedClause =
          "{= ${formDetailsModel>ValueIid} === ${" +
          sCellValuePath +
          "} ? true : false }";

        /*Template radio button*/
        var oRB = new sap.m.RadioButton({
          selected: sSelectedClause,
          text: "{formDetailsModel>Description}",
          select: that._onRadioButtonValueSelected.bind(that),
        }).addStyleClass("hapRadioButtonText");

        /*Add custom data 1 for binding*/
        oRB.data("bindingReference", sCellValue);

        /*Add custom data 2 for binding*/
        var oBindingValue = new sap.ui.core.CustomData({
          key: "bindingValue",
          value: "{formDetailsModel>ValueIid}",
        });
        oRB.addCustomData(oBindingValue);

        /*Attach template to RBG*/
        oRBG.bindAggregation("buttons", {
          path:
            "formDetailsModel>/bodyCellValues/" +
            oCell.RowIid +
            "/" +
            oCell.ColumnIid +
            "/CellValues",
          templateShareable: false,
          template: oRB,
        });
        return oRBG;
      },
      _onMultiInputSelected: function (oEvent) {
        var oSource = oEvent.getSource();
        var oViewModel = this.getModel("formDetailsModel");
        var sCellValuePath = oSource.data("bindingReference");
        var sRowIid = oSource.data("elementRowIid");
        var sColumnIid = oSource.data("elementColumnIid");
        var aValue = [];
        var sCellValue = "";

        var oSelectedItems = oSource.getSelectedItems();

        $.each(oSelectedItems, function (i, oItem) {
          aValue.push({
            Objid: oItem.getKey(),
            Stext: oItem.getText(),
          });
        });
        if (aValue.length > 0) {
          sCellValue = JSON.stringify(aValue);
        }

        oViewModel.setProperty(sCellValuePath, sCellValue);
      },
      _addMultiInput: function (oCell) {
        var sEditablePath =
          "formDetailsModel>/bodyCells/" +
          oCell.RowIid +
          "/" +
          oCell.ColumnIid +
          "/CellValueAvailability";
        var sCellValuePath =
          "/bodyCells/" + oCell.RowIid + "/" + oCell.ColumnIid + "/NoteString";
        var oViewModel = this.getModel("formDetailsModel");
        var sCellValue = oViewModel.getProperty(sCellValuePath);
        var aSel = [];
        var that = this;

        if (
          sCellValue !== "" &&
          sCellValue !== null &&
          sCellValue !== undefined
        ) {
          try {
            var oToken = JSON.parse(sCellValue);
            $.each(oToken, function (i, oComp) {
              aSel.push(oComp.Objid);
            });
          } catch (oErr) {
            jQuery.sap.log.error(oErr);
          }
        }

        var oMC = new sap.m.MultiComboBox({
          selectionChange: that._onMultiInputSelected.bind(that),
          enabled: {
            path: sEditablePath,
            formatter: function (sCellValueAvailability) {
              if (
                sCellValueAvailability === "X" ||
                sCellValueAvailability === "R"
              ) {
                return true;
              } else {
                return false;
              }
            },
          },
        }).addStyleClass("hapMultiComboBox");

        var oItem = new sap.ui.core.Item({
          key: "{formDetailsModel>Objid}",
          text: "{formDetailsModel>Stext}",
        });

        /*Attach template to RBG*/
        oMC.bindAggregation("items", {
          path: "formDetailsModel>/formData/Competencies",
          template: oItem,
        });

        oMC.data("bindingReference", sCellValuePath);
        oMC.data("elementRowIid", oCell.RowIid);
        oMC.data("elementColumnIid", oCell.ColumnIid);
        oMC.data("appraisalId", oCell.AppraisalId);

        if (aSel.length > 0) {
          oMC.setSelectedKeys(aSel);
        }
        return oMC;
      },

      _addTextAreaObjective: function (oCell) {
        var sCellValuePath =
          "formDetailsModel>/bodyCells/" +
          oCell.RowIid +
          "/" +
          oCell.ColumnIid +
          "/NoteString";
        var oViewModel = this.getModel("formDetailsModel");

        var oTAObj = new sap.m.TextArea({
          value: {
            path: sCellValuePath,
            formatter: function (sValue) {
              var sObjectiveText;
              var oObjectives = oViewModel.getProperty("/formData/Objectives");
              $.each(oObjectives, function (i, oObjective) {
                if (oObjective.Objid === sValue) {
                  sObjectiveText = oObjective.Description;
                  return false;
                }
              });
              return sObjectiveText;
            },
          },
          width: "100%",
          rows: 3,
          editable: false,
        }); //.addStyleClass("hapTextArea");

        return oTAObj;
      },

      _addListBox: function (oCell) {
        var oViewModel = this.getModel("formDetailsModel");
        var oViewData = oViewModel.getData();
        var sEditablePath =
          "formDetailsModel>/bodyCells/" +
          oCell.RowIid +
          "/" +
          oCell.ColumnIid +
          "/CellValueAvailability";
        var sColumnIid =
          "formDetailsModel>/bodyCells/" +
          oCell.RowIid +
          "/" +
          oCell.ColumnIid +
          "/ColumnIid";

        var sListKeyPath = `{formDetailsModel>/bodyCells/${oCell.RowIid}/${oCell.ColumnIid}/ValueString}`;

        var sItemKeyPath = `{formDetailsModel>ValueIid}`;

        var oLB = new sap.m.Select({
          selectedKey: sListKeyPath,
          autoAdjustWidth: true,
          enabled: {
            path: sEditablePath,
            formatter: function (sCellValueAvailability) {
              if (
                sCellValueAvailability === "X" ||
                sCellValueAvailability === "R"
              ) {
                return true;
              } else {
                return false;
              }
            },
          },

          change: (oEvent)=>{
            var oSelItem = oEvent.getParameter("selectedItem");

            if (oSelItem) {
              var sValueIid = oSelItem.data("ValueIid");
              var sValueEid = oSelItem.data("ValueEid");
              var sValueText = oSelItem.data("ValueText");
              var oSource = oEvent.getSource();
              var sRowIid = oSource.data("RowIid");
              var sColumnIid = oSource.data("ColumnIid");
              var sCellPath = `/bodyCells/${sRowIid}/${sColumnIid}`;
              var oBodyCell = oViewModel.getProperty(sCellPath);
              var aBodyCells = oViewData.formData["BodyCells"];
              var iInd = _.findIndex(aBodyCells, {
                RowIid: sRowIid,
                ColumnIid: sColumnIid,
              });

              if (iInd !== null && iInd !== undefined && iInd !== -1) {
                oBodyCell.ValueString = aBodyCells[iInd].ValueString =
                  sValueIid;
                oBodyCell.ValueNnv = aBodyCells[iInd].ValueNnv = sValueEid;
                oBodyCell.ValueText = aBodyCells[iInd].ValueText = sValueText;
                oBodyCell.ValueTxt = aBodyCells[iInd].ValueTxt = sValueEid;
              }

              oViewModel.setProperty(sCellPath, oBodyCell);

              oViewModel.setProperty("/formData/BodyCells", aBodyCells);
              this._triggerValueDetermination()
            }
          },
        }); //.addStyleClass("hapListBox");

        //Listbox change event ile formData->BodyCells içinde value_num, value_text gibi alanları temizlemek için
        // row ve column id leri custom data da tut
        var oRowIid = new sap.ui.core.CustomData({
          key: "RowIid",
          value: oCell.RowIid,
          writeToDom: true,
        });
        oLB.addCustomData(oRowIid);

        var oColumnIid = new sap.ui.core.CustomData({
          key: "ColumnIid",
          value: oCell.ColumnIid,
          writeToDom: true,
        });
        oLB.addCustomData(oColumnIid);

        var oItem = new sap.ui.core.Item({
          key: sItemKeyPath,
          text: "{formDetailsModel>ValueText}",
        });

        var oValueIid = new sap.ui.core.CustomData({
          key: "ValueIid",
          value: "{formDetailsModel>ValueIid}",
        });
        oItem.addCustomData(oValueIid);
        var oValueEid = new sap.ui.core.CustomData({
          key: "ValueEid",
          value: "{formDetailsModel>ValueEid}",
        });
        oItem.addCustomData(oValueEid);
        var oValueText = new sap.ui.core.CustomData({
          key: "ValueText",
          value: "{formDetailsModel>ValueText}",
        });
        oItem.addCustomData(oValueText);
        /*Attach template to RBG*/
        oLB.bindAggregation("items", {
          path:
            "formDetailsModel>/bodyCellValues/" +
            oCell.RowIid +
            "/" +
            oCell.ColumnIid +
            "/CellValues",
          template: oItem,
        });
        return oLB;
      },

      _adjustButtons: function () {
        var oViewModel = this.getModel("formDetailsModel");
        var sAppraisalId = oViewModel.getProperty("/appraisalId");
        var aHapButtons = oViewModel.getProperty("/formData/Buttons");
        var aFooterButtons = [];
        var aSaveButtons = [];
        var aFooterButtons = [];
        var aIntros = oViewModel.getProperty("/formData/Intros");
        var that = this;

        var aProcessActions = _.clone(aHapButtons);
        var aSaveActions = [];
        // var aProcessActions = _.filter(aHapButtons, function (oButton) {
        //   return !oButton.Id.startsWith("SAVE");
        // });
        // var aSaveActions = [];
        // var aSaveActions = _.filter(aHapButtons, function (oButton) {
        //   return (
        //     oButton.Id.startsWith("SAVE") &&
        //     (oButton.Availability === "" || oButton.Availability === "B")
        //   );
        // });

        if (aIntros && aIntros.length > 0) {
          aFooterButtons.push({
            Id: "SHOW_INTRO",
            Text: "Yardım",
            Availability: "",
            StatusRelevant: false,
          });
        }

        $.each(aProcessActions, function (i, oHapButton) {
          var oHapButtonLocal = that._cloneObject(oHapButton);
          oHapButtonLocal.TargetSection = null;
          aFooterButtons.push(oHapButtonLocal);
        });

        $.each(aSaveActions, function (i, oHapButton) {
          var oHapButtonLocal = that._cloneObject(oHapButton);
          oHapButtonLocal.TargetSection = null;
          aSaveButtons.push(oHapButtonLocal);
        });

        oViewModel.setProperty("/footerButtons", aFooterButtons);
        oViewModel.setProperty("/saveButtons", aSaveButtons);
      },

      _checkTrainingSelection: function (
        sAppraisalId,
        sRowIid,
        sBindingReference
      ) {
        var oViewModel = this.getModel("formDetailsModel");
        var aBodyCells = oViewModel.getProperty("/formData/BodyCells");
        var sCount = 0;
        var sEduColumnIid = this._getColumnIid("ZSEC");

        $.each(aBodyCells, function (sIndex, oCell) {
          if (oCell.RowIid !== sRowIid && oCell.ColumnIid === sEduColumnIid) {
            if (
              oCell.ValueNum === "1" ||
              oCell.ValueNum == 1 ||
              oCell.ValueNum === "0001"
            ) {
              sCount++;
            }
          }
        });

        if (sCount >= 1) {
          MessageBox.warning(
            this.getResourceBundle().getText("maxSelectionsReached", [1])
          );
          oViewModel.setProperty(sBindingReference + "ValueString", "0000");
          oViewModel.setProperty(sBindingReference + "ValueNum", "0");
          oViewModel.setProperty(sBindingReference + "ValueTxt", "0");
          var oUIElement = this._findUIElement(
            sRowIid,
            "CellValue",
            sEduColumnIid,
            false
          );
          if (typeof oUIElement.setState === "function") {
            oUIElement.setState(false);
          }
          return false;
        } else {
          return true;
        }
      },
      _handleResetSurvey: function (sRowIid, sFormId, sBindingReference) {
        var oViewModel = this.getModel("formDetailsModel");
        var sSurveyPath = "/elementSurveys/" + sRowIid + "/" + sFormId;
        var oElementSurvey = oViewModel.getProperty(sSurveyPath);
        var sSurveyName = oViewModel.getProperty(
          "/bodyElements/" + sRowIid + "/FormName"
        );

        var oVL = new sap.ui.layout.VerticalLayout();
        oVL.addStyleClass("hapSurveyLayout");
        var that = this;

        var _doResetSurvey = function (oEvent) {
          $.each(oElementSurvey, function (i, oSurvey) {
            oSurvey.Question.Anstx = "";
            oSurvey.Question.Ansid = "0000";
          });

          oViewModel.setProperty(sSurveyPath, oElementSurvey);
          that.confirmDialog.close();
          MessageToast.show(that.getResourceBundle().getText("surveyIsReset"));
        };

        var _cancelResetSurvey = function (oEvent) {
          oViewModel.setProperty(sBindingReference + "ValueString", "0001");
          oViewModel.setProperty(sBindingReference + "ValueNum", "1");
          oViewModel.setProperty(sBindingReference + "ValueTxt", "1");
          MessageToast.show(
            that.getResourceBundle().getText("surveyResetCancelled")
          );
          that.confirmDialog.close();
        };

        this._generateConfirmDialog(
          "surveyResetConfirm",
          "surveyResetQuestion",
          [sSurveyName],
          "surveyDoReset",
          "Accept",
          "sap-icon://open-command-field",
          _doResetSurvey,
          "Warning",
          "surveyCancelReset",
          "Reject",
          "sap-icon://reset",
          _cancelResetSurvey
        );
      },
      _handleCallSurvey: function (
        sAppraisalId,
        sRowIid,
        sFormId,
        sCloseButtonVisible
      ) {
        var oViewModel = this.getModel("formDetailsModel");
        oViewModel.setProperty(
          "/surveyCloseButtonVisible",
          sCloseButtonVisible
        );
        // create dialog lazily
        if (!this._oSurveyDialog) {
          // create dialog via fragment factory
          this._oSurveyDialog = sap.ui.xmlfragment(
            "hcm.ux.hapv5.fragment.ElementSurvey",
            this
          );
          this._oSurveyDialog.setEscapeHandler(this.onEscapeDialog);
          // connect dialog to view (models, lifecycle)
          this.getView().addDependent(this._oSurveyDialog);
        }

        this._generateSurvey(sAppraisalId, sRowIid, sFormId);
        this._oSurveyDialog.data("appraisalId", sAppraisalId);
        this._oSurveyDialog.data("elementRowIid", sRowIid);
        this._oSurveyDialog.data("elementFormId", sFormId);

        this._oSurveyDialog.open();
      },

      _generateSurvey: function (sAppraisalId, sRowIid, sFormId) {
        var oViewModel = this.getModel("formDetailsModel");
        var oElem = oViewModel.getProperty("/bodyElements/" + sRowIid);
        var oElementSurvey = oViewModel.getProperty(
          "/elementSurveys/" + sRowIid + "/" + sFormId
        );
        var sSurveyPath = "/elementSurveys/" + sRowIid + "/" + sFormId;
        var oVL = new sap.ui.layout.VerticalLayout().addStyleClass(
          "hapSurveyLayout"
        );
        var aUIElements = [];
        var sValueAvailability =
          "${formDetailsModel>/bodyCells/" +
          oElem.RowIid +
          "/" +
          oElem.FormColumnIid +
          "/CellValueAvailability}";
        var sElementsEnabled =
          "{formDetailsModel>/bodyElements/" + oElem.RowIid + "/FormEditable}";

        oViewModel.setProperty("/surveyUIElements", []);

        var _radioButtonSelected = function (oEvent) {
          var oSource = oEvent.getSource();
          var sQpath = oSource.data("Qpath");
          var sAnsid = oSource.data("Ansid");
          var sAnstx = oSource.data("Anstx");
          oViewModel.setProperty(sQpath + "/Ansid", sAnsid);
          oViewModel.setProperty(sQpath + "/Anstx", sAnstx);
          var oQuestion = oViewModel.getProperty(
            sSurveyPath + "/" + oSource.data("Queid")
          );

          for (var i = 0; i < oQuestion.Answers.length; i++) {
            if (
              oQuestion.Answers[i].Ansid !== sAnsid &&
              oQuestion.Answers[i].Qusid !== "000"
            ) {
              var sAnstxPath =
                sSurveyPath +
                "/" +
                oQuestion.Answers[i].Qusid +
                "/Question/Anstx";
              oViewModel.setProperty(sAnstxPath, "");
            }
          }
        };

        /*Objects are not sorted*/
        var aQuepr = [];
        $.each(oElementSurvey, function (sIndex, oSurveyLine) {
          //If primary question
          if (oSurveyLine.Question.Quepr) {
            aQuepr.push(oSurveyLine.Question.Queid);
          }
        });

        /*Questions are sorted*/
        aQuepr.sort();

        /*Generate survey using primary questions*/
        var sQuein = 0;
        $.each(aQuepr, function (sIndex, sQueid) {
          var oSurveyLine = oElementSurvey[sQueid];
          sQuein++;

          var sQuePath =
            sSurveyPath + "/" + oSurveyLine.Question.Queid + "/Question";
          var oQueMainVL = new sap.ui.layout.VerticalLayout({
            width: "100%",
          }).addStyleClass("hapSurveyQuestionMainLayout");

          oVL.addContent(oQueMainVL);

          var oQueVL = new sap.ui.layout.VerticalLayout().addStyleClass(
            "hapSurveyQuestionLayout"
          );
          oQueMainVL.addContent(oQueVL);

          var oQueText = new sap.m.Text({
            text: sQuein + " - " + oSurveyLine.Question.Quetx,
          }).addStyleClass("hapSurveyQuestionText");
          oQueVL.addContent(oQueText);

          var oAnsVL = new sap.ui.layout.VerticalLayout().addStyleClass(
            "hapSurveyAnswerLayout"
          );
          if (oSurveyLine.Answers.length > 0) {
            $.each(oSurveyLine.Answers, function (sIndex, oAnswer) {
              var oAnsRBVL = new sap.ui.layout.VerticalLayout();
              var oAnsRB = new sap.m.RadioButton({
                groupName:
                  "group_" + sRowIid + "_" + oSurveyLine.Question.Queid,
                text: oAnswer.Anstx,
                select: _radioButtonSelected,
                selected:
                  "{= ${formDetailsModel>" +
                  sQuePath +
                  "/Ansid} === '" +
                  oAnswer.Ansid +
                  "' ? true : false}",
                enabled: sElementsEnabled,
              });

              aUIElements.push({
                Queid: sQueid,
                ElementType: "RadioButtonAnsid",
                UIElement: oAnsRB,
              });

              /*Set custom data*/
              oAnsRB.data("AppraisalId", sAppraisalId);
              oAnsRB.data("Rowid", sRowIid);
              oAnsRB.data("Queid", oSurveyLine.Question.Queid);
              oAnsRB.data("Ansid", oAnswer.Ansid);
              oAnsRB.data("Anstx", oAnswer.Anstx);
              oAnsRB.data("Qusid", null);
              oAnsRB.data("Qpath", sQuePath);
              oAnsRB.data("Qusvl", null);

              oAnsRBVL.addContent(oAnsRB);
              oAnsVL.addContent(oAnsRBVL);
              if (oElementSurvey.hasOwnProperty(oAnswer.Qusid)) {
                oAnsRB.data("Qusid", oAnswer.Qusid);
                var o2ndQue = oElementSurvey[oAnswer.Qusid];
                var sVLId = "id2ndQueMainVL_" + sRowIid + "_" + oAnswer.Queid;
                var o2ndQueMainVL = new sap.ui.layout.VerticalLayout(sVLId, {
                  visible:
                    "{= ${formDetailsModel>" +
                    sQuePath +
                    "/Ansid} === '" +
                    oAnswer.Ansid +
                    "' ? true : false}",
                }).addStyleClass("hapSurvey2ndQuestionMainLayout");
                if (oSurveyLine.Question.Ansid !== oAnswer.Ansid) {
                  o2ndQueMainVL.setVisible(false);
                }
                var o2ndQueVL = new sap.ui.layout.VerticalLayout();
                var o2ndQueText = new sap.m.Text({
                  text: o2ndQue.Question.Quetx,
                }).addStyleClass("hapSurveyQuestionText");
                o2ndQueVL.addContent(o2ndQueText);
                o2ndQueMainVL.addContent(o2ndQueVL);

                var o2ndAnsVL = new sap.ui.layout.VerticalLayout({
                  width: "100%",
                });

                var oAnsTA = new sap.m.TextArea({
                  value:
                    "{formDetailsModel>" +
                    sSurveyPath +
                    "/" +
                    oAnswer.Qusid +
                    "/Question/Anstx}",
                  width: "95%",
                  editable: sElementsEnabled,
                });

                aUIElements.push({
                  Queid: oAnswer.Qusid,
                  ElementType: "TextAreaAnstx",
                  UIElement: oAnsTA,
                });

                o2ndAnsVL.addContent(oAnsTA);
                o2ndQueMainVL.addContent(o2ndAnsVL);
                oAnsVL.addContent(o2ndQueMainVL);
              }
            });
          } else {
            var oAnsTA = new sap.m.TextArea({
              value:
                "{formDetailsModel>" +
                sSurveyPath +
                "/" +
                oSurveyLine.Question.Queid +
                "/Question/Anstx}",
              width: "100%",
              editable: sElementsEnabled,
            });
            aUIElements.push({
              Queid: oSurveyLine.Question.Queid,
              ElementType: "TextAreaAnstx",
              UIElement: oAnsTA,
            });
            oAnsVL.addContent(oAnsTA);
          }
          oQueMainVL.addContent(oAnsVL);
        });

        oViewModel.setProperty("/surveyUIElements", aUIElements);

        this._oSurveyDialog.setTitle(
          oViewModel.getProperty("/bodyElements/" + sRowIid + "/Name") +
            " - " +
            oViewModel.getProperty("/bodyElements/" + sRowIid + "/FormName")
        );

        this._oSurveyDialog.addContent(oVL);
      },

      _checkSurveyHasFinished: function (sAppraisalId, sRowIid, sFormId) {
        var oViewModel = this.getModel("formDetailsModel");
        var sSurveyPath = "/elementSurveys/" + sRowIid + "/" + sFormId;
        var oElementSurvey = oViewModel.getProperty(sSurveyPath);
        var sSurveyIncompleted = false;
        var aSurveyUIElements = oViewModel.getProperty("/surveyUIElements");
        var sEditable = oViewModel.getProperty(
          "/bodyElements/" + sRowIid + "/FormEditable"
        );
        var that = this;

        if (!sEditable) {
          /*If survey is not editable DO NOT CHECK completeness*/
          return false;
        }

        var _setMessageState = function (sQueid, sElementType, sError) {
          var sMessageType = sError ? "Error" : "Success";
          var sMessageText = sError
            ? that.getResourceBundle().getText("fillSurveyFields")
            : "";
          for (var i = 0; i < aSurveyUIElements.length; i++) {
            var oLine = aSurveyUIElements[i];
            if (oLine.Queid === sQueid && oLine.ElementType === sElementType) {
              oLine.UIElement.setValueState(sMessageType);
              if (typeof oLine.UIElement.setValueStateText === "function") {
                oLine.UIElement.setValueStateText(sMessageText);
              }
            }
          }
        };

        $.each(oElementSurvey, function (sIndex, oSurveyLine) {
          if (oSurveyLine.Question.Quepr) {
            var sQuePath =
              sSurveyPath + "/" + oSurveyLine.Question.Queid + "/Question";
            if (oSurveyLine.Answers.length > 0) {
              if (
                oSurveyLine.Question.Ansid === "" ||
                oSurveyLine.Question.Ansid === "0000"
              ) {
                sSurveyIncompleted = true;
                _setMessageState(
                  oSurveyLine.Question.Queid,
                  "RadioButtonAnsid",
                  true
                );
              } else {
                _setMessageState(
                  oSurveyLine.Question.Queid,
                  "RadioButtonAnsid",
                  false
                );
                $.each(oSurveyLine.Answers, function (i, oAnswer) {
                  if (
                    oSurveyLine.Question.Ansid === oAnswer.Ansid &&
                    oAnswer.Qusid !== "000"
                  ) {
                    if (oElementSurvey[oAnswer.Qusid].Question.Anstx === "") {
                      sSurveyIncompleted = true;
                      _setMessageState(oAnswer.Qusid, "TextAreaAnstx", true);
                    } else {
                      _setMessageState(oAnswer.Qusid, "TextAreaAnstx", false);
                    }
                    return false;
                  }
                });
              }
            } else {
              if (oSurveyLine.Question.Anstx === "") {
                sSurveyIncompleted = true;
                _setMessageState(
                  oSurveyLine.Question.Queid,
                  "TextAreaAnstx",
                  true
                );
              } else {
                _setMessageState(
                  oSurveyLine.Question.Queid,
                  "TextAreaAnstx",
                  false
                );
              }
            }
          }
        });

        return sSurveyIncompleted;
      },
      _onRadioButtonValueSelected: function (oEvent) {
        var oSource = oEvent.getSource();
        var oViewModel = this.getModel("formDetailsModel");
        oViewModel.setProperty(
          oSource.data("bindingReference"),
          oSource.data("bindingValue")
        );
        this._triggerValueDetermination();
      },
      _getValueUsingAttribute: function (
        oViewData,
        sArray,
        sQueAttNam,
        sQueAttVal,
        sAttNam
      ) {
        var sAttVal;
        $.each(oViewData.formData[sArray], function (sIndex, oElement) {
          if (oElement[sQueAttNam] === sQueAttVal) {
            sAttVal = oElement[sAttNam];
            return false;
          }
        });
        return sAttVal;
      },
      _formBodyElementsObject: function () {
        var oViewModel = this.getModel("formDetailsModel");
        var aBodyElements = oViewModel.getProperty("/formData/BodyElements");
        var oBodyElements = {};

        $.each(aBodyElements, function (i, oElement) {
          var oBodyElement = {};

          oBodyElement[oElement.RowIid] = oElement;
          if (typeof Object.assign === "function") {
            Object.assign(oBodyElements, oBodyElement);
          } else {
            $.extend(oBodyElements, oBodyElement);
          }
        });

        oViewModel.setProperty("/bodyElements", oBodyElements);
      },
      _getColumnIid: function (sColumnId) {
        var oViewModel = this.getModel("formDetailsModel");
        var sPath = "/formData/BodyColumns";
        var aBodyColumns = oViewModel.getProperty(sPath);

        var oBodyColumn = _.find(aBodyColumns, ["ColumnId", sColumnId]);

        if (oBodyColumn) {
          return oBodyColumn.ColumnIid;
        } else {
          return null;
        }
      },

      _formBodyColumnsObject: function () {
        var oViewModel = this.getModel("formDetailsModel");
        var aBodyColumns = oViewModel.getProperty("/formData/BodyColumns");
        var oBodyColumns = {};
        var that = this;

        this._sObjColumn =
          this._sWeightColumn =
          this._sFinAppColumn =
          this._sFinOthColumn =
          this._sEmpAppColumn =
            null;

        $.each(aBodyColumns, function (i, oColumn) {
          if (oColumn.ColumnId === "OBJ0") {
            that._sObjColumn = oColumn.ColumnIid;
            /*Hedef Belirleme*/
          }

          if (oColumn.ColumnId === "FWGT") {
            that._sWeightColumn = oColumn.ColumnIid;
            /*Ağırlık*/
          }

          if (oColumn.ColumnId === "FAPP") {
            that._sFinAppColumn = oColumn.ColumnIid;
            /*Son Değerlendirme*/
          }

          if (oColumn.ColumnId === "ZAPO") {
            that._sFinOthColumn = oColumn.ColumnIid;
            /*2. Yönetici Değerlendirme*/
          }

          if (oColumn.ColumnId === "ZAPP") {
            that._sEmpAppColumn = oColumn.ColumnIid;
            /*Son Değerlendirme - Çalışan*/
          }

          var oBodyColumn = {};

          oBodyColumn[oColumn.ColumnIid] = oColumn;
          if (typeof Object.assign === "function") {
            Object.assign(oBodyColumns, oBodyColumn);
          } else {
            $.extend(oBodyColumns, oBodyColumn);
          }
        });
        oViewModel.setProperty("/bodyColumns", oBodyColumns);
      },

      _formBodyCellsObject: function () {
        var oViewModel = this.getModel("formDetailsModel");
        var aBodyElements = oViewModel.getProperty("/formData/BodyElements");
        var aBodyCells = oViewModel.getProperty("/formData/BodyCells");
        var aBodyCellValues = oViewModel.getProperty(
          "/formData/BodyCellValues"
        );
        var oBodyCells = {};
        var oBodyCellValues = {};

        $.each(aBodyElements, function (i, oElement) {
          oBodyCells[oElement.RowIid] = {};
          oBodyCellValues[oElement.RowIid] = {};
        });

        $.each(aBodyCells, function (i, oCell) {
          oBodyCells[oCell.RowIid][oCell.ColumnIid] = oCell;
          oBodyCellValues[oCell.RowIid][oCell.ColumnIid] = {};
          oBodyCellValues[oCell.RowIid][oCell.ColumnIid].CellValues = [];
          $.each(aBodyCellValues, function (i, oCellValue) {
            if (
              oCellValue.RowIid === oCell.RowIid &&
              oCellValue.ColumnIid === oCell.ColumnIid
            ) {
              oBodyCellValues[oCell.RowIid][oCell.ColumnIid].CellValues.push(
                oCellValue
              );
            }
          });
        });

        oViewModel.setProperty("/bodyCells", oBodyCells);
        oViewModel.setProperty("/bodyCellValues", oBodyCellValues);
      },

      _cloneComparisonObjects: function () {
        var oViewModel = this.getModel("formDetailsModel");
        var oBodyCells = oViewModel.getProperty("/bodyCells");
        var oBodyCellsCopy = {};
        var oBodyElements = oViewModel.getProperty("/bodyElements");
        var oBodyElementsCopy = {};

        oBodyCellsCopy = this._cloneObject(oBodyCells);
        oBodyElementsCopy = this._cloneObject(oBodyElements);

        oViewModel.setProperty("/bodyCellsCopy", oBodyCellsCopy);
        oViewModel.setProperty("/bodyElementsCopy", oBodyElementsCopy);
      },
      _compareClonedObjects: function (sAppraisalId) {
        var oViewModel = this.getModel("formDetailsModel");
        var oBodyCells = oViewModel.getProperty("/bodyCells");
        var oBodyCellsCopy = oViewModel.getProperty("/bodyCellsCopy");
        var oBodyElements = oViewModel.getProperty("/bodyElements");
        var oBodyElementsCopy = oViewModel.getProperty("/bodyElementsCopy");

        return (
          this._compareObjects(oBodyCells, oBodyCellsCopy) &&
          this._compareObjects(oBodyElements, oBodyElementsCopy)
        );
      },
      _cloneObject: function (oSource) {
        var oTarget = $.extend(true, {}, oSource);
        return oTarget;
      },
      _compareObjects: function (o1, o2) {
        if (o1 && o2) {
          for (var p in o1) {
            if (o1.hasOwnProperty(p) && o2.hasOwnProperty(p)) {
              if (JSON.stringify(o1[p]) !== JSON.stringify(o2[p])) {
                return false;
              }
            } else {
              return false;
            }
          }
        }

        return true;
      },
      _formElementSurveysObject: function (sAppraisalId) {
        var oViewModel = this.getModel("formDetailsModel");
        var aFormQuestions = oViewModel.getProperty("/formData/FormQuestions");
        var aFormAnswers = oViewModel.getProperty("/formData/FormAnswers");
        var oElementSurveys = {};

        $.each(aFormQuestions, function (sIndex, oFormQuestion) {
          if (!oElementSurveys.hasOwnProperty(oFormQuestion.RowIid)) {
            oElementSurveys[oFormQuestion.RowIid] = {};
          }

          if (
            !oElementSurveys[oFormQuestion.RowIid].hasOwnProperty(
              oFormQuestion.Frmid
            )
          ) {
            oElementSurveys[oFormQuestion.RowIid][oFormQuestion.Frmid] = {};
          }

          oElementSurveys[oFormQuestion.RowIid][oFormQuestion.Frmid][
            oFormQuestion.Queid
          ] = {
            Question: oFormQuestion,
            Answers: [],
          };
          var sAnswersCollected = false;
          for (var i = 0; i < aFormAnswers.length; i++) {
            var oAnswer = aFormAnswers[i];

            if (
              !(
                oAnswer.RowIid === oFormQuestion.RowIid &&
                oAnswer.Queid === oFormQuestion.Queid &&
                oAnswer.Frmid === oFormQuestion.Frmid
              ) &&
              sAnswersCollected
            ) {
              break;
            }

            if (
              oAnswer.RowIid === oFormQuestion.RowIid &&
              oAnswer.Queid === oFormQuestion.Queid &&
              oAnswer.Frmid === oFormQuestion.Frmid
            ) {
              oElementSurveys[oFormQuestion.RowIid][oFormQuestion.Frmid][
                oFormQuestion.Queid
              ].Answers.push(oAnswer);
              sAnswersCollected = true;
            }
          }
        });

        oViewModel.setProperty("/elementSurveys", oElementSurveys);
      },

      _formParametersObject: function () {
        var oViewModel = this.getModel("formDetailsModel");
        var aParams = oViewModel.getProperty("/formData/FormParameters");
        var oParams = {};

        $.each(aParams, function (sIndex, oParam) {
          oParams[oParam.Param] = oParam.Value;
        });
        oViewModel.setProperty("/formParameters", oParams);

        oViewModel.setProperty("/formType", oParams["UX_FORM_TYPE"]);
      },

      _convertUIData: function () {
        var oViewModel = this.getModel("formDetailsModel");
        var oBodyCellsTarget = oViewModel.getProperty("/formData/BodyCells");
        var oBodyElementsTarget = oViewModel.getProperty(
          "/formData/BodyElements"
        );
        var oBodyCellsSource = oViewModel.getProperty("/bodyCells");
        var oBodyElementsSource = oViewModel.getProperty("/bodyElements");

        /*Update cell content*/
        for (var i = 0; i < oBodyCellsTarget.length; i++) {
          if (oBodyCellsSource.hasOwnProperty(oBodyCellsTarget[i].RowIid)) {
            if (
              oBodyCellsSource[oBodyCellsTarget[i].RowIid].hasOwnProperty(
                oBodyCellsTarget[i].ColumnIid
              )
            ) {
              oBodyCellsTarget[i] =
                oBodyCellsSource[oBodyCellsTarget[i].RowIid][
                  oBodyCellsTarget[i].ColumnIid
                ];
            } else {
              jQuery.sap.log.error("Hata 2" + oBodyCellsTarget[i]);
            }
          } else {
            jQuery.sap.log.error("Hata 1" + oBodyCellsTarget[i]);
          }
        }

        /*Update elements content*/
        for (var j = 0; j < oBodyElementsTarget.length; j++) {
          if (
            oBodyElementsSource.hasOwnProperty(oBodyElementsTarget[j].RowIid)
          ) {
            if (oBodyElementsSource[oBodyElementsTarget[j].RowIid].FreeInput) {
              oBodyElementsSource[oBodyElementsTarget[j].RowIid].NameString =
                oBodyElementsSource[oBodyElementsTarget[j].RowIid].Name;
            }
            oBodyElementsTarget[j] =
              oBodyElementsSource[oBodyElementsTarget[j].RowIid];
          }
        }

        oViewModel.setProperty("/formData/BodyCells", oBodyCellsTarget);
        oViewModel.setProperty("/formData/BodyElements", oBodyElementsTarget);
      },
      _synchronizeUIAfterUpdate: function (
        oData,
        bUpdateButton,
        bResetAutoSave = false
      ) {
        var oBodyCellsSource = oData.BodyCells.results;
        var oBodyCellValuesSource = oData.BodyCellValues.results;
        var oBodyElementsSource = oData.BodyElements.results;
        var oDocProgress = oData.DocProgress.results;
        var oHeaderStatus = oData.HeaderStatus;
        var oViewModel = this.getModel("formDetailsModel");
        var oSidebarData = oViewModel.getProperty("/sidebarData");

        oViewModel.setProperty("/formData/BodyCells", oBodyCellsSource);
        oViewModel.setProperty(
          "/formData/BodyCellValues",
          oBodyCellValuesSource
        );
        oViewModel.setProperty("/formData/BodyElements", oBodyElementsSource);
        oViewModel.setProperty("/formData/HeaderStatus", oHeaderStatus);
        if (!_.isEmpty(oData.ResultTable)) {
          oViewModel.setProperty(
            "/formData/ResultTable",
            oData.ResultTable.results
          );

          oSidebarData.footerData = this._refreshSidebarFooterData();

          oViewModel.setProperty("/sidebarData", oSidebarData);
        }

        if (bUpdateButton) {
          var oBodyButtons = oData.Buttons.results;
          oViewModel.setProperty("/formData/Buttons", oBodyButtons);
        }

        /*Adjust buttons again*/
        this._adjustButtons();

        //--Doc progress
        oViewModel.setProperty("/formData/DocProgress", oDocProgress);


        var oBodyCellsTarget = oViewModel.getProperty("/bodyCells");
        var oBodyCellValuesTarget = oViewModel.getProperty("/bodyCellValues");

        /*Update cell content*/
        for (var i = 0; i < oBodyCellsSource.length; i++) {
          oBodyCellsTarget[oBodyCellsSource[i].RowIid][
            oBodyCellsSource[i].ColumnIid
          ] = oBodyCellsSource[i];
        }

        oViewModel.setProperty("/bodyCells", oBodyCellsTarget);
        oViewModel.setProperty("/bodyCellValues", oBodyCellValuesTarget);

        var oBodyElementsTarget = oViewModel.getProperty("/bodyElements");

        /*Update elements content*/
        for (var j = 0; j < oBodyElementsSource.length; j++) {
          oBodyElementsTarget[oBodyElementsSource[j].RowIid] =
            oBodyElementsSource[j];
        }

        oViewModel.setProperty("/bodyElements", oBodyElementsTarget);

        // if (bResetAutoSave) {
        //   this.byId("idTriggerAutoSave").setTriggerInterval();
        // }

        this.hasChanges = false;
      },

      _resetSections: function () {
        if (this._oPageLayout) {
          $.each(this._oPageLayout.getSections(), function (i, oCurSection) {
            oCurSection.destroySubSections();
          });

          this._oPageLayout.destroySections();
        }
      },

      _handleActionButtonPressed: function (oEvent) {
        var oButton = oEvent.getSource();
        var sAppraisalId = oButton.data("AppraisalId");
        switch (oButton.data("ButtonId")) {
          case "SAVE":
            this._handleSaveDocument(false);
            break;
          case "SAVE&EXIT":
            this._handleSaveDocument(true);
            break;
          case "CANCEL":
            this._handleCancelDocument();
            break;
          case "PRINT":
            this._handlePrintDocument();
            break;
          case "SHOW_INTRO":
            this._showShepherdIntro(oEvent);
            break;
          case "NEXT":
            this._navigateToSection(oButton.data("TargetSection"));
            break;
          case "PREV":
            this._navigateToSection(oButton.data("TargetSection"));
            break;
          case "SAVE&KEEP":
            this._handleSaveAndContinue();
            break;
          case "NEXT&KEEP":
            this._navigateToNextTab();
            break;
          case "CHECK":
            this._handleCheckDocument();
            break;
          default:
            this._handleButtonAction(oButton);
        }
        //MessageToast.show("Button pressed! Button:" + oEvent.getSource().data("ButtonId") + oEvent.getSource().data("StatusRelevant"));
      },
      _handleCancelDocument: function () {
        this._doNavBack(false);
      },
      _navigateToNextTab: function () {
        var oViewModel = this.getModel("formDetailsModel");
        var aNavigationData = oViewModel.getProperty("/navigationData");
        var iOffset = 1;

        var iIndex = aNavigationData
          .map(function (e) {
            return e.ElementId;
          })
          .indexOf(oViewModel.getProperty("/navigationElementId"));
        iIndex++;

        var oViewModel = this.getModel("formDetailsModel");
        var oElemRow =
          _.find(this.formUIElements, {
            RowIid: "0999",
            UIType: "Page",
          }) || null;

        if (oElemRow) {
          iOffset = 2;
        }

        if (aNavigationData.length - iOffset === iIndex) {
          oViewModel.setProperty("/saveAndNextButtonVisibility", false);
        }

        var sPageId = aNavigationData[iIndex].Page.getId();

        this._oNavContainer.to(sPageId);
        this._oNavContainer.setAutoFocus(true);
        oViewModel.setProperty(
          "/navigationElementId",
          aNavigationData[iIndex].ElementId
        );

        var $items = $(".bd-side-nav-item-link");

        $items.each(function () {
          if (
            $(this).attr("data-element-row-id") ===
            aNavigationData[iIndex].RowIid
          ) {
            $(this).addClass("bd-side-nav-item-link-active");
          } else {
            $(this).removeClass("bd-side-nav-item-link-active");
          }
        });
      },
      _findActiveTab: function () {
        var oViewModel = this.getModel("formDetailsModel");
        var aNavigationData = oViewModel.getProperty("/navigationData");
        var sActiveElementId = oViewModel.getProperty("/navigationElementId");
        var oActiveElement;
        try {
          oActiveElement = _.find(aNavigationData, [
            "ElementId",
            sActiveElementId,
          ]);
        } catch (e) {
          oActiveElement = null;
        }
        return oActiveElement;
      },

      _handleReturnError: function (oError) {
        try {
          var M = JSON.parse(oError.responseText).error.message.value;
          MessageBox.error(M);
        } catch (e) {
          MessageBox.error(oError.responseText);
        }
      },
      _handleSaveAndContinue: function () {
        var oViewModel = this.getModel("formDetailsModel");
        var oModel = this.getModel();
        var aFormProp = oViewModel.getProperty("/aFormProp");
        var that = this;
        var bHasErrors = false;

        this._convertUIData();

        this._cloneComparisonObjects();

        var oOperation = {
          AppraisalId: oViewModel.getProperty("/appraisalId"),
          PartApId: "0000",
          Operation: "SAVE&KEEP",
          RowIid: null,
          ButtonId: null,
          RowElemId: oViewModel.getProperty("/navigationElementId"),
          BodyElements: oViewModel.getProperty("/formData/BodyElements"),
          BodyCells: oViewModel.getProperty("/formData/BodyCells"),
          BodyCellValues: oViewModel.getProperty("/formData/BodyCellValues"),
          HeaderStatus: oViewModel.getProperty("/formData/HeaderStatus"),
          FormQuestions: oViewModel.getProperty("/formData/FormQuestions"),
          ResultTable: oViewModel.getProperty("/formData/ResultTable"),
          Return: oViewModel.getProperty("/formData/Return"),
        };

        this._removeAllMessages();
        this._openBusyFragment("formBeingSaved", []);
        oModel.create("/DocumentOperationsSet", oOperation, {
          success: function (oData, oResponse) {
            bHasErrors = that._processReturnMessages(
              oData.Return.results,
              true,
              "SAVE"
            );
            /* Synchronize UI */
            that._synchronizeUIAfterUpdate(oData, false, true);

            that._closeBusyFragment();

            /* Close busy indicator*/

            if (bHasErrors === false) {
              that._setChangeListeners(false);
              that._navigateToNextTab();
            }
          },
          error: function (oError) {
            that._closeBusyFragment();
            that._handleReturnError(oError);
          },
          async: true,
        });
      },
      _handleCheckDocument: function () {
        var oViewModel = this.getModel("formDetailsModel");
        var oModel = this.getModel();
        var aFormProp = oViewModel.getProperty("/aFormProp");
        var that = this;
        var bHasErrors = false;

        this._convertUIData();

        var oOperation = {
          AppraisalId: oViewModel.getProperty("/appraisalId"),
          PartApId: "0000",
          Operation: "CHECK",
          BodyElements: oViewModel.getProperty("/formData/BodyElements"),
          BodyCells: oViewModel.getProperty("/formData/BodyCells"),
          BodyCellValues: oViewModel.getProperty("/formData/BodyCellValues"),
          HeaderStatus: oViewModel.getProperty("/formData/HeaderStatus"),
          Return: [],
        };

        this._removeAllMessages();

        this._openBusyFragment("formCheckInProgress", []);
        oModel.create("/DocumentOperationsSet", oOperation, {
          success: function (oData, oResponse) {
            /* Return messages */
            bHasErrors = that._processReturnMessages(
              oData.Return.results,
              true,
              "CHECK"
            );

            /* Close busy indicator*/
            that._closeBusyFragment();

            if (bHasErrors === false) {
              MessageToast.show(that.getText("formCheckSuccess"));
            }
          },
          error: function (oError) {
            that._closeBusyFragment();
            that._handleReturnError(oError);
          },
          async: true,
        });
      },
      _triggerValueDetermination: function () {
        const oViewModel = this.getModel("formDetailsModel");
        const oFormParameters = oViewModel.getProperty("/formParameters");
        const oModel = this.getModel();
        const that = this;
        var sHasErrors = false;

        if(oFormParameters["FORM_TRIGGER_CALC"] !== "X" ){
          return;
        }

        this._convertUIData();
        this._cloneComparisonObjects();

        var oOperation = {
          AppraisalId: oViewModel.getProperty("/appraisalId"),
          PartApId: "0000",
          Operation: "VAL_DET",
          BodyElements: oViewModel.getProperty("/formData/BodyElements"),
          BodyColumns: oViewModel.getProperty("/formData/BodyColumns"),
          BodyCells: oViewModel.getProperty("/formData/BodyCells"),
          BodyCellValues: oViewModel.getProperty("/formData/BodyCellValues"),
          HeaderStatus: oViewModel.getProperty("/formData/HeaderStatus"),
          ResultTable: oViewModel.getProperty("/formData/ResultTable"),
          DocProgress: oViewModel.getProperty("/formData/DocProgress"),
          FormQuestions: oViewModel.getProperty("/formData/FormQuestions"),
          Return: oViewModel.getProperty("/formData/Return"),
        };
        this._setViewState(true);
        oModel.create("/DocumentOperationsSet", oOperation, {
          success: function (oData, oResponse) {
            that._setViewState(false);
            /* Return messages */
            sHasErrors = that._processReturnMessages(
              oData.Return.results,
              true,
              null
            );

            /* Synchronize UI */
            if (!sHasErrors) {
              that._synchronizeUIAfterUpdate(oData, false, false);
            }
          },
          error: function (oError) {
            that._setViewState(false);
          },
          async: true,
        });
      },
      _handleSaveDocument: function (bExit) {
        var oViewModel = this.getModel("formDetailsModel");
        var oModel = this.getModel();
        var aFormProp = oViewModel.getProperty("/aFormProp");
        var that = this;
        var bHasErrors = false;

        this._convertUIData();

        this._cloneComparisonObjects();

        var oOperation = {
          AppraisalId: oViewModel.getProperty("/appraisalId"),
          PartApId: "0000",
          Operation: "SAVE",
          RowIid: null,
          ButtonId: null,
          BodyElements: oViewModel.getProperty("/formData/BodyElements"),
          BodyCells: oViewModel.getProperty("/formData/BodyCells"),
          BodyCellValues: oViewModel.getProperty("/formData/BodyCellValues"),
          HeaderStatus: oViewModel.getProperty("/formData/HeaderStatus"),
          FormQuestions: oViewModel.getProperty("/formData/FormQuestions"),
          ResultTable: oViewModel.getProperty("/formData/ResultTable"),
          DocProgress: oViewModel.getProperty("/formData/DocProgress"),
          Return: oViewModel.getProperty("/formData/Return"),
        };

        this._removeAllMessages();

        this._openBusyFragment("formBeingSaved");

        oModel.create("/DocumentOperationsSet", oOperation, {
          success: function (oData, oResponse) {
            /* Return messages */
            bHasErrors = that._processReturnMessages(
              oData.Return.results,
              true,
              "SAVE"
            );

            /* Synchronize UI */
            that._synchronizeUIAfterUpdate(oData, false, true);

            /* Close busy indicator*/
            that._closeBusyFragment();

            if (bHasErrors === false) {
              MessageToast.show(that.getText("formSaveSuccess")) ;
              that._setChangeListeners(false);
              if (bExit) {
                that._doNavToMain();
              }
            }
          },
          error: function (oError) {
            that._closeBusyFragment();
            that._handleReturnError(oError);
          },
          async: true,
        });
      },
      _handleShowStatNotes: function () {
        var that = this;
        var oViewModel = this.getModel("formDetailsModel");

        var aStatNotes = oViewModel.getProperty("/formData/StatusNotes", "");
        var sNotes = "";

        $.each(aStatNotes, function (i, oNote) {
          sNotes = sNotes + oNote.Tdline + "\n";
        });

        var oStatusNoteDialog = new sap.m.Dialog({
          title: "{i18n>STATUS_CHANGE_NOTES_TITLE}",
          contentWidth: "500px",
          type: "Message",
          state: "Warning",
          content: [
            new sap.m.FlexBox({
              direction: "Row",
              width: "100%",
              justifyContent: "Center",
              items: [
                new sap.m.TextArea({
                  value: sNotes,
                  width: "100%",
                  rows: 5,
                  editable: false,
                  layoutData: new sap.m.FlexItemData({
                    growFactor: 1,
                    alignSelf: sap.m.FlexAlignSelf.Center,
                  }),
                }),
              ],
            }),
          ],
          endButton: new sap.m.Button({
            text: "{i18n>labelClose}",
            press: function () {
              oStatusNoteDialog.close();
            },
          }),
          afterClose: function () {
            oStatusNoteDialog.destroy();
          },
        });

        this.getView().addDependent(oStatusNoteDialog);

        oStatusNoteDialog.open();
      },

      _handleDeleteFormElement: function (oEvent) {
        var that = this;
        var sRowIid = oEvent.getSource().data("elementRowIid");
        var sElementName = oEvent.getSource().data("elementName");

        var _callRowDelete = function () {
          that.confirmDialog.close();
          that._doDeleteFormElement(sRowIid, false);
        };
        this._generateConfirmDialog(
          "elementDeletionConfirm",
          "elementDeletionQuestion",
          [sElementName],
          "elementDelete",
          "Reject",
          "sap-icon://delete",
          _callRowDelete,
          "Warning"
        );
      },

      _deleteRowUI: function (sRowIid) {
        var oViewModel = this.getModel("formDetailsModel");
        var aBodyElements = oViewModel.getProperty("/formData/BodyElements");
        var oBodyElements = oViewModel.getProperty("/bodyElements");
        var aBodyCells = oViewModel.getProperty("/formData/BodyCells");
        var oBodyCells = oViewModel.getProperty("/bodyCells");

        if (oBodyElements.hasOwnProperty(sRowIid)) {
          delete oBodyElements[sRowIid];
        }
        if (oBodyCells.hasOwnProperty(sRowIid)) {
          delete oBodyCells[sRowIid];
        }

        var aUIElementListOfRow = this._findAllUIElementByRow(sRowIid);

        $.each(aUIElementListOfRow, function (i, oUIElement) {
          try {
            if (typeof oUIElement?.UIElement?.destroyContent === "function") {
              oUIElement.UIElement.destroyContent();
            }

            if (typeof oUIElement?.UIElement?.destroy === "function") {
              oUIElement.UIElement.destroy();
            }

            _.remove(that.formUIElements, function (oElement) {
              return oElement.Id === oUIElement.Id;
            });
          } catch (err) {
            console.error(sRowIid + " satırının içeriği silinirken hata");
          }
        });
        oViewModel.setProperty("/formData/BodyElements", aBodyElements);
        oViewModel.setProperty("/bodyElements", oBodyElements);
        oViewModel.setProperty("/formData/BodyCells", aBodyCells);
        oViewModel.setProperty("/bodyCells", oBodyCells);
      },

      _removeAllMessages: function () {
        var oViewModel = this.getModel("formDetailsModel");
        oViewModel.setProperty("/formMessages", []);
      },

      _processReturnMessages: function (aReturn, bShowMessages, sButtonId) {
        var that = this;
        var bHasErrors = false;
        var aFormMessages = [];
        var oViewModel = this.getModel("formDetailsModel");

        this._removeAllMessages();

        $.each(aReturn, function (sIndex, oReturn) {
          var isError = false;
          if (
            oReturn.Type === "E" ||
            oReturn.Type === "A" ||
            oReturn.Type === "X"
          ) {
            bHasErrors = true;
            isError = true;
          }
          if (bShowMessages && isError) {
            aFormMessages.push(_.clone(oReturn));
          }
        });

        oViewModel.setProperty("/formMessages", aFormMessages);

        if (aFormMessages.length > 0 && bShowMessages) {
          MessageToast.show(that.getText("formCheckError"));
          that.onOpenFormMessagePopover(null);
        }

        return bHasErrors;
      },

      _getFormMessagePopover: function () {
        if (!this._oFormMessagePopover) {
          this._oFormMessagePopover = sap.ui.xmlfragment(
            this.getView().getId(),
            "hcm.ux.hapv5.fragment.FormMessages",
            this
          );
          this.getView().addDependent(this._oFormMessagePopover);
        }
        return this._oFormMessagePopover;
      },

      _doDeleteFormElement: function (sRowIid, sNoMsg) {
        var oViewModel = this.getModel("formDetailsModel");
        var oModel = this.getModel();
        var aFormProp = oViewModel.getProperty("/aFormProp");
        var that = this;
        var bHasErrors = false;

        this._convertUIData();

        var oOperation = {
          AppraisalId: oViewModel.getProperty("/appraisalId"),
          PartApId: "0000",
          Operation: "DELETE",
          RowIid: sRowIid,
          ButtonId: null,
          BodyElements: oViewModel.getProperty("/formData/BodyElements"),
          BodyCells: oViewModel.getProperty("/formData/BodyCells"),
          BodyCellValues: oViewModel.getProperty("/formData/BodyCellValues"),
          ResultTable: oViewModel.getProperty("/formData/ResultTable"),
          Return: oViewModel.getProperty("/formData/Return"),
        };

        this._removeAllMessages();

        this._openBusyFragment();
        oModel.create("/DocumentOperationsSet", oOperation, {
          success: function (oData, oResponse) {
            /* Return messages */
            bHasErrors = that._processReturnMessages(
              oData.Return.results,
              false
            );

            if (!bHasErrors && !sNoMsg) {
              MessageToast.show(that.getText("elementDeleteSuccessful"));
            }

            that._deleteRowUI(sRowIid);

            // /* Synchronize UI */
            that._synchronizeUIAfterUpdate(oData, false, false);

            /* Close busy indicator*/
            that._closeBusyFragment();
          },
          error: function (oError) {
            that._closeBusyFragment();
            jQuery.sap.log.error(oError);
          },
          async: true,
        });
      },

      _handleListAttachment: function (oEvent) {
        var oButton = oEvent.getSource();
        var sAppraisalId = oButton.data("appraisalId");
        var oModel = this.getModel();
        var oViewModel = this.getModel("formDetailsModel");
        var that = this;
        var sDelVisible =
          "{=  ( ${formDetailsModel>LastUser} === ${formDetailsModel>Uname}) && ( ${formDetailsModel>/bodyElements/" +
          oButton.data("elementRowIid") +
          "/AttachmentVisible} === true ) ? true : false }";

        var oColumnListItem = new sap.m.ColumnListItem();
        var oUrlPath =
          oModel.sServiceUrl +
          "/AttachmentSet(AppraisalId=guid'" +
          sAppraisalId +
          "',RowIid='" +
          oButton.data("elementRowIid") +
          "',Id='" +
          "{formDetailsModel>Id}" +
          "')/$value";
        var oLink = new sap.m.Link({
          target: "_blank",
          text: "{formDetailsModel>Name}" + "." + "{formDetailsModel>Type}",
          href: oUrlPath,
          tooltip: oUrlPath,
        });
        var oDelButton = new sap.m.Button({
          icon: "sap-icon://delete",
          type: "Reject",
          press: that._handleDeleteAttachment.bind(that),
          enabled: sDelVisible,
        });

        var oRowId = new sap.ui.core.CustomData({
          key: "elementRowIid",
        });
        oRowId.bindProperty("value", "formDetailsModel>RowIid");
        var oAppraisalId = new sap.ui.core.CustomData({
          key: "appraisalId",
        });
        oAppraisalId.bindProperty("value", "formDetailsModel>AppraisalId");
        var oAttachmentId = new sap.ui.core.CustomData({
          key: "attachmentId",
        });
        oAttachmentId.bindProperty("value", "formDetailsModel>Id");

        var oAttachmentName = new sap.ui.core.CustomData({
          key: "attachmentName",
        });
        oAttachmentName.bindProperty("value", "formDetailsModel>Name");

        var oAttachmentType = new sap.ui.core.CustomData({
          key: "attachmentType",
        });
        oAttachmentType.bindProperty("value", "formDetailsModel>Type");

        oDelButton.addCustomData(oRowId);
        oDelButton.addCustomData(oAppraisalId);
        oDelButton.addCustomData(oAttachmentId);
        oDelButton.addCustomData(oAttachmentName);
        oDelButton.addCustomData(oAttachmentType);

        oColumnListItem.addCell(oLink);
        oColumnListItem.addCell(oDelButton);

        // create dialog lazily
        if (!this._oListAttachmentDialog) {
          // create dialog via fragment factory
          this._oListAttachmentDialog = sap.ui.xmlfragment(
            "hcm.ux.hapv5.fragment.AttachmentList",
            this
          );
          // connect dialog to view (models, lifecycle)
          this.getView().addDependent(this._oListAttachmentDialog);
        }

        sap.ui
          .getCore()
          .byId("idAttachmentList")
          .bindItems({
            path:
              "formDetailsModel>/attachmentCollection/" +
              oButton.data("appraisalId") +
              "/" +
              oButton.data("elementRowIid") +
              "/attachmentList",
            template: oColumnListItem,
          });
        this._oListAttachmentDialog.openBy(oButton);
      },

      _handleAddAttachment: function (oEvent) {
        var oViewModel = this.getModel("formDetailsModel");
        oViewModel.setProperty(
          "/currentAppraisalId",
          oEvent.appraisalId.getValue()
        );
        oViewModel.setProperty("/currentRowIid", oEvent.rowIid.getValue());

        this._openUploadAttachmentDialog();
      },
      _handleDeleteAttachment: function (oEvent) {
        var that = this;
        var oButton = oEvent.getSource();
        var sRowIid = oButton.data("elementRowIid");
        var sAppraisalId = oButton.data("appraisalId");
        var sAttachmentId = oButton.data("attachmentId");
        var sAttachmentName =
          oButton.data("attachmentName") + "." + oButton.data("attachmentType");
        var oViewModel = this.getModel("formDetailsModel");
        var oModel = this.getModel();
        var sPath =
          "/AttachmentSet(" +
          "AppraisalId=guid'" +
          sAppraisalId +
          "'," +
          "RowIid='" +
          sRowIid +
          "'," +
          "Id='" +
          sAttachmentId +
          "')";

        this._oListAttachmentDialog?.close();

        var _callAttachmentDelete = function () {
          that.confirmDialog.close();
          that._openBusyFragment("attachmentBeingDeleted");
          oModel.remove(sPath, {
            success: function (oData, oResponse) {
              that._refreshAttachmentList(sAppraisalId);
              that._closeBusyFragment();
              MessageToast.show(
                that.getResourceBundle().getText("attachmentDeleteSuccess")
              );
            },
            error: function (oError) {
              that._closeBusyFragment();
              MessageToast.show(
                that.getResourceBundle().getText("attachmentDeleteError")
              );
            },
          });
        };
        this._generateConfirmDialog(
          "attachmentDeletionConfirm",
          "attachmentDeletionQuestion",
          [sAttachmentName],
          "elementDelete",
          "Reject",
          "sap-icon://delete",
          _callAttachmentDelete,
          "Warning"
        );
      },
      _handleOpenSurvey: function (oEvent) {
        var sAppraisalId = oEvent.getSource().data("appraisalId");
        var sRowIid = oEvent.getSource().data("elementRowIid");
        var sFormId = oEvent.getSource().data("elementFormId");
        var oCurrentForm =
          this.getModel("formDetailsModel").getProperty("/currentForm");
        if (oCurrentForm.RoleId === "MA") {
          this._handleCallSurvey(sAppraisalId, sRowIid, sFormId, true);
        } else {
          this._handleCallSurvey(sAppraisalId, sRowIid, sFormId, false);
        }
      },

      _checkMaxChildren: function (sAppraisalId, sRowIid) {
        var oCheck = this._getChildrenCount(sAppraisalId, sRowIid);
        if (oCheck.Max > 0) {
          return oCheck.Cur < oCheck.Max ? 0 : oCheck.Max;
        } else {
          return 0;
        }
      },

      _getChildrenCount: function (sAppraisalId, sRowIid) {
        var oViewModel = this.getModel("formDetailsModel");
        var aBodyElements = oViewModel.getProperty("/bodyElements");
        var sMaxChildren = oViewModel.getProperty(
          "/bodyElements/" + sRowIid + "/MaxChildCount"
        );
        var sChildrenCount = 0;

        $.each(aBodyElements, function (sIndex, oBodyElement) {
          if (oBodyElement.Parent === sRowIid) {
            sChildrenCount++;
          }
        });

        return {
          Max: sMaxChildren,
          Cur: sChildrenCount,
        };
      },

      _handleAddObjectiveByWizard: function (oEvent) {
        var that = this;
        var oViewModel = this.getModel("formDetailsModel");
        var oModel = this.getModel();
        var that = this;
        var bHasErrors = false;
        var sRowIid = oEvent.getSource().data("elementRowIid");
        var sElementName = oEvent.getSource().data("elementName");
        var sEnhanceName = oEvent.getSource().data("enhanceName");
        var sElementLevel = oEvent.getSource().data("elementLevel");
        var sMaxChildren = this._checkMaxChildren(sRowIid);
        var sParentName = sEnhanceName
          ? sElementName + " - " + sEnhanceName
          : sElementName;

        if (sMaxChildren > 0) {
          MessageBox.warning(
            this.getText("newElementMaxChildrenReached", [
              sMaxChildren,
              sElementName,
            ]),
            {
              title: this.getText("newElementAdditionError"),
            }
          );
          return;
        }

        this._convertUIData();

        var oOperation = {
          AppraisalId: oViewModel.getProperty("/appraisalId"),
          PartApId: "0000",
          Operation: "ENHANCEDOB",
          RowIid: sRowIid,
          ButtonId: null,
          BodyElements: oViewModel.getProperty("/formData/BodyElements"),
          BodyElementButtons: oViewModel.getProperty(
            "/formData/BodyElementButtons"
          ),
          BodyCells: oViewModel.getProperty("/formData/BodyCells"),
          BodyCellValues: oViewModel.getProperty("/formData/BodyCellValues"),
          BodyColumns: oViewModel.getProperty("/formData/BodyColumns"),
          ResultTable: oViewModel.getProperty("/formData/ResultTable"),
          Return: oViewModel.getProperty("/formData/Return"),
          ReturnOp: oViewModel.getProperty("/formData/ReturnOp"),
          DependentObjectives: [],
        };

        this._removeAllMessages();
        that._openBusyFragment();
        oModel.create("/DocumentOperationsSet", oOperation, {
          success: function (oData, oResponse) {
            /* Close busy indicator*/
            that._closeBusyFragment();

            /* Return messages */
            if (oData.Return !== null) {
              if (oData.Return.hasOwnProperty("results")) {
                bHasErrors = that._processReturnMessages(
                  oData.Return.results,
                  false
                );
              }
            }

            if (!bHasErrors) {
              /* Build objective catalog for selection and adjust form accordingly */
              that._buildDependentObjectiveCatalog(
                oData,
                sRowIid,
                sParentName,
                sElementLevel
              );
            }
          },
          error: function (oError) {
            that._closeBusyFragment();
            jQuery.sap.log.error(oError);
          },
          async: true,
        });
      },

      _getObjectiveUnitText: function (sObjUni) {
        var oViewModel = this.getModel("formDetailsModel");
        var sNewRowIid = oViewModel.getProperty(
          "/objectiveWizardSettings/newRowIid"
        );
        var aCellValues = oViewModel.getProperty(
          `/bodyCellValues/${sNewRowIid}/${this._sObjUniColumn}/CellValues`
        );

        try {
          if (
            sObjUni &&
            aCellValues &&
            aCellValues?.length &&
            aCellValues?.length > 0
          ) {
            return _.find(aCellValues, ["ValueEid", sObjUni])["ValueText"];
          } else {
            return "";
          }
        } catch (e) {
          return "N/A";
        }
      },

      _handleAddFormElement: function (oEvent) {
        var oViewModel = this.getModel("formDetailsModel");
        var oModel = this.getModel();
        var that = this;
        var bHasErrors = false;
        var sRowIid = oEvent.getSource().data("elementRowIid");
        var sElementName = oEvent.getSource().data("elementName");
        var sEnhanceName = oEvent.getSource().data("enhanceName");
        var sElementLevel = oEvent.getSource().data("elementLevel");
        var sMaxChildren = this._checkMaxChildren(sRowIid);

        if (sMaxChildren > 0) {
          MessageBox.warning(
            this.getText("newElementMaxChildrenReached", [
              sMaxChildren,
              sElementName,
            ]),
            {
              title: this.getText("newElementAdditionError"),
            }
          );
          return;
        }

        this._convertUIData();

        var oOperation = {
          AppraisalId: oViewModel.getProperty("/appraisalId"),
          PartApId: "0000",
          Operation: "ENHANCE",
          RowIid: sRowIid,
          ButtonId: null,
          BodyElements: oViewModel.getProperty("/formData/BodyElements"),
          BodyCells: oViewModel.getProperty("/formData/BodyCells"),
          BodyCellValues: oViewModel.getProperty("/formData/BodyCellValues"),
          BodyColumns: oViewModel.getProperty("/formData/BodyColumns"),
          ResultTable: oViewModel.getProperty("/formData/ResultTable"),
          Return: oViewModel.getProperty("/formData/Return"),
          ReturnOp: oViewModel.getProperty("/formData/ReturnOp"),
          FeBodyElementsAdd: oViewModel.getProperty(
            "/formData/FeBodyElementsAdd"
          ),
          FeAlreadyChosen: oViewModel.getProperty("/formData/FeAlreadyChosen"),
          FeFlatAvailable: oViewModel.getProperty("/formData/FeFlatAvailable"),
          FeSelectableOtype: oViewModel.getProperty(
            "/formData/FeSelectableOtype"
          ),
          FeStrucAvailable: oViewModel.getProperty(
            "/formData/FeStrucAvailable"
          ),
          FormAnswers: oViewModel.getProperty("/formData/FormAnswers"),
          FormQuestions: oViewModel.getProperty("/formData/FormQuestions"),
        };

        this._removeAllMessages();

        this._openBusyFragment("newElementInformation", [sElementName]);
        oModel.create("/DocumentOperationsSet", oOperation, {
          success: function (oData, oResponse) {
            /* Close busy indicator*/
            that._closeBusyFragment();

            /* Return messages */
            if (oData.Return !== null) {
              if (oData.Return.hasOwnProperty("results")) {
                bHasErrors = that._processReturnMessages(
                  oData.Return.results,
                  false
                );
              }
            }

            if (!bHasErrors) {
              if (oData.ReturnOp.UiDeferred === "X") {
                /*Add from tree or list*/
                that._buildCatalogForSelection(oData, sRowIid);
              } else {
                /*Free enhancement*/
                that._enhanceDocument(
                  oData,
                  sRowIid,
                  false,
                  sEnhanceName
                    ? sElementName + " - " + sEnhanceName
                    : sElementName,
                  false,
                  sElementLevel
                );
              }
            }
          },
          error: function (oError) {
            that._closeBusyFragment();
            jQuery.sap.log.error(oError);
          },
          async: true,
        });
      },

      _handleAddFreeFormElement: function (oParam) {
        var oViewModel = this.getModel("formDetailsModel");
        var oModel = this.getModel();
        var that = this;
        var oElem = oParam.oElem;
        var sObj = oParam.sObj;
        var sRowIid = oElem.RowIid;
        var sElementName = oElem.Name;
        var sElementLevel = oElem.ApLevel;

        var bHasErrors = false;
        var sMaxChildren = this._checkMaxChildren(sRowIid);

        if (sMaxChildren > 0) {
          MessageBox.warning(
            this.getText("newElementMaxChildrenReached", [
              sMaxChildren,
              sElementName,
            ]),
            {
              title: this.getText("newElementAdditionError"),
            }
          );
          return;
        }

        this._convertUIData();

        var oOperation = {
          AppraisalId: oViewModel.getProperty("/appraisalId"),
          PartApId: "0000",
          Operation: "ENHANCE",
          RowIid: sRowIid,
          ButtonId: null,
          BodyElements: oViewModel.getProperty("/formData/BodyElements"),
          BodyCells: oViewModel.getProperty("/formData/BodyCells"),
          BodyColumns: oViewModel.getProperty("/formData/BodyColumns"),
          BodyCellValues: oViewModel.getProperty("/formData/BodyCellValues"),
          ResultTable: oViewModel.getProperty("/formData/ResultTable"),
          Return: oViewModel.getProperty("/formData/Return"),
          ReturnOp: oViewModel.getProperty("/formData/ReturnOp"),
          FeBodyElementsAdd: oViewModel.getProperty(
            "/formData/FeBodyElementsAdd"
          ),
          FeAlreadyChosen: oViewModel.getProperty("/formData/FeAlreadyChosen"),
          FeFlatAvailable: oViewModel.getProperty("/formData/FeFlatAvailable"),
          FeSelectableOtype: oViewModel.getProperty(
            "/formData/FeSelectableOtype"
          ),
          FeStrucAvailable: oViewModel.getProperty(
            "/formData/FeStrucAvailable"
          ),
          FormAnswers: oViewModel.getProperty("/formData/FormAnswers"),
          FormQuestions: oViewModel.getProperty("/formData/FormQuestions"),
        };

        this._removeAllMessages();

        this._openBusyFragment("newElementInformation", [sElementName]);
        oModel.create("/DocumentOperationsSet", oOperation, {
          success: function (oData, oResponse) {
            /* Close busy indicator*/
            that._closeBusyFragment();

            /* Return messages */
            if (oData.Return !== null) {
              if (oData.Return.hasOwnProperty("results")) {
                bHasErrors = that._processReturnMessages(
                  oData.Return.results,
                  false
                );
              }
            }

            if (!bHasErrors) {
              if (oData.ReturnOp.UiDeferred === "X") {
                /*Add from tree or list*/
                that._buildCatalogForSelection(oData, sRowIid);
              } else {
                /*Free enhancement*/
                that._enhanceDocument(
                  oData,
                  sRowIid,
                  false,
                  sElementName,
                  sObj,
                  sElementLevel
                );
              }
            }
          },
          error: function (oError) {
            that._closeBusyFragment();
            jQuery.sap.log.error(oError);
          },
          async: true,
        });
      },

      _handleAddFreeFormElement: function (oParam) {
        var oViewModel = this.getModel("formDetailsModel");
        var oModel = this.getModel();
        var that = this;
        var oElem = oParam.oElem;
        var sObj = oParam.sObj;
        var sRowIid = oElem.RowIid;
        var sElementName = oElem.Name;
        var sElementLevel = oElem.ApLevel;

        var bHasErrors = false;
        var sMaxChildren = this._checkMaxChildren(sRowIid);

        if (sMaxChildren > 0) {
          MessageBox.warning(
            this.getText("newElementMaxChildrenReached", [
              sMaxChildren,
              sElementName,
            ]),
            {
              title: this.getText("newElementAdditionError"),
            }
          );
          return;
        }

        this._convertUIData();

        var oOperation = {
          AppraisalId: oViewModel.getProperty("/appraisalId"),
          PartApId: "0000",
          Operation: "ENHANCE",
          RowIid: sRowIid,
          ButtonId: null,
          BodyElements: oViewModel.getProperty("/formData/BodyElements"),
          BodyCells: oViewModel.getProperty("/formData/BodyCells"),
          BodyColumns: oViewModel.getProperty("/formData/BodyColumns"),
          BodyCellValues: oViewModel.getProperty("/formData/BodyCellValues"),
          ResultTable: oViewModel.getProperty("/formData/ResultTable"),
          Return: oViewModel.getProperty("/formData/Return"),
          ReturnOp: oViewModel.getProperty("/formData/ReturnOp"),
          FeBodyElementsAdd: oViewModel.getProperty(
            "/formData/FeBodyElementsAdd"
          ),
          FeAlreadyChosen: oViewModel.getProperty("/formData/FeAlreadyChosen"),
          FeFlatAvailable: oViewModel.getProperty("/formData/FeFlatAvailable"),
          FeSelectableOtype: oViewModel.getProperty(
            "/formData/FeSelectableOtype"
          ),
          FeStrucAvailable: oViewModel.getProperty(
            "/formData/FeStrucAvailable"
          ),
          FormAnswers: oViewModel.getProperty("/formData/FormAnswers"),
          FormQuestions: oViewModel.getProperty("/formData/FormQuestions"),
        };

        this._removeAllMessages();

        this._openBusyFragment("newElementInformation", [sElementName]);
        oModel.create("/DocumentOperationsSet", oOperation, {
          success: function (oData, oResponse) {
            /* Close busy indicator*/
            that._closeBusyFragment();

            /* Return messages */
            if (oData.Return !== null) {
              if (oData.Return.hasOwnProperty("results")) {
                bHasErrors = that._processReturnMessages(
                  oData.Return.results,
                  false
                );
              }
            }

            if (!bHasErrors) {
              if (oData.ReturnOp.UiDeferred === "X") {
                /*Add from tree or list*/
                that._buildCatalogForSelection(oData, sRowIid);
              } else {
                /*Free enhancement*/
                that._enhanceDocument(
                  oData,
                  sRowIid,
                  false,
                  sElementName,
                  sObj,
                  sElementLevel
                );
              }
            }
          },
          error: function (oError) {
            that._closeBusyFragment();
            jQuery.sap.log.error(oError);
          },
          async: true,
        });
      },
      _enhanceDocumentFromCatalog: function (aSelectedObjects) {
        var oViewModel = this.getModel("formDetailsModel");
        var oEnhanceModel = this.getModel("enhanceModel");
        var oModel = this.getModel();
        var aFormProp = oViewModel.getProperty("/aFormProp");
        var that = this;
        var bHasErrors = false;
        var sRowIid = oEnhanceModel.getProperty("/RowIid");
        var oCheck = this._getChildrenCount(sRowIid);
        var aElementsAdd = [];
        var sSpace = null;

        if (oCheck.Max > 0) {
          sSpace = oCheck.Max - oCheck.Cur;
        }

        if (aSelectedObjects.length > 0 && sSpace !== null) {
          if (aSelectedObjects.length > sSpace) {
            MessageBox.warning(
              this.getText("maxChildSelectionReached", [
                sSpace,
                aSelectedObjects.length,
              ])
            );
            return;
          }
        }

        this._oAddNewElementCatalogDialog.close();

        $.each(aSelectedObjects, function (sIndex, oSelectedObject) {
          aElementsAdd.push({
            AppraisalId: oViewModel.getProperty("/appraisalId"),
            NewElementType: oSelectedObject.Otype,
            NewElementId: oSelectedObject.Objid,
          });
        });

        this._convertUIData();

        var oOperation = {
          AppraisalId: oViewModel.getProperty("/appraisalId"),
          PartApId: "0000",
          Operation: "ENHANCEADD",
          RowIid: sRowIid,
          ButtonId: null,
          BodyElements: oViewModel.getProperty("/formData/BodyElements"),
          BodyCells: oViewModel.getProperty("/formData/BodyCells"),
          BodyCellValues: oViewModel.getProperty("/formData/BodyCellValues"),
          ResultTable: oViewModel.getProperty("/formData/ResultTable"),
          Return: oViewModel.getProperty("/formData/Return"),
          ReturnOp: oViewModel.getProperty("/formData/ReturnOp"),
          FeBodyElementsAdd: aElementsAdd,
          FeAlreadyChosen: oViewModel.getProperty("/formData/FeAlreadyChosen"),
          FeFlatAvailable: oViewModel.getProperty("/formData/FeFlatAvailable"),
          FeSelectableOtype: oViewModel.getProperty(
            "/formData/FeSelectableOtype"
          ),
          FeStrucAvailable: oViewModel.getProperty(
            "/formData/FeStrucAvailable"
          ),
          FormAnswers: oViewModel.getProperty("/formData/FormAnswers"),
          FormQuestions: oViewModel.getProperty("/formData/FormQuestions"),
        };

        this._removeAllMessages();

        this._openBusyFragment("newElementIsAdded");
        oModel.create("/DocumentOperationsSet", oOperation, {
          success: function (oData, oResponse) {
            /* Close busy indicator*/
            that._closeBusyFragment();

            /* Return messages */
            if (oData.Return !== null) {
              if (oData.Return.hasOwnProperty("results")) {
                bHasErrors = that._processReturnMessages(
                  oData.Return.results,
                  false
                );
              }
            }

            if (!bHasErrors) {
              that._enhanceDocument(oData, sRowIid, true, null, false);
            }
          },
          error: function (oError) {
            that._closeBusyFragment();
            jQuery.sap.log.error(oError);
          },
          async: true,
        });
      },
      _doEnhanceDocument: function (sRowIid, sNewRowIid, sElementLevel) {
        var that = this;
        var oVM = that.getModel("formDetailsModel");
        var oVD = oVM.getData();

        if (sElementLevel === "02") {
          var oCurrentPageLayout = that._findUIElement(
            sRowIid,
            "PageLayout",
            null,
            true
          );
          if (
            oCurrentPageLayout !== null &&
            sNewRowIid !== null &&
            sNewRowIid !== "0000"
          ) {
            that._addSection(oVD, oCurrentPageLayout, sNewRowIid);
          }
        } else {
          that._doEnhanceSingle(sRowIid, sNewRowIid, true);
        }
      },

      _buildCatalogForSelection: function (oData, sRowIid) {
        var oEnhanceModel = this.getModel("enhanceModel");
        var aStruc = [];
        var aChosen = [];
        if (!oEnhanceModel) {
          oEnhanceModel = new JSONModel();
          this.setModel(oEnhanceModel, "enhanceModel");
        }
        try {
          aChosen = oData.FeAlreadyChosen.results;
        } catch (oErr) {
          aChosen = [];
        }
        var _returnChildren = function (sOtype, sObjid) {
          var aChildren = [];

          for (var i = 0; i < aStruc.length; i++) {
            if (
              aStruc[i].PupOtype === sOtype &&
              aStruc[i].PupObjid === sObjid
            ) {
              var oChild = {};
              oChild.Stext = aStruc[i].Stext;
              oChild.Description1 = aStruc[i].P10020001;
              oChild.Description2 = aStruc[i].P10020003;
              oChild.Otype = aStruc[i].Otype;
              oChild.Objid = aStruc[i].Objid;
              oChild.PupOtype = sOtype;
              oChild.PupObjid = sObjid;
              oChild.Selectable = false;
              oChild.Selected = false;
              oChild.AlreadySelected = false;
              if (aStruc[i].Vcount === 0) {
                oChild.Selectable = true;
              }
              var sChildFound = false;
              sChildFound = aChosen.some(function (oChosen) {
                return (
                  oChosen.Otype === oChild.Otype &&
                  oChosen.Sobid === oChild.Objid
                );
              });
              if (sChildFound) {
                oChild.AlreadySelected = true;
              }
              oChild.Children = _returnChildren(oChild.Otype, oChild.Objid);
              aChildren.push(oChild);
            } // if (aStruc[i].PupOtype ...
          } //	for (var i = 0; ...
          return aChildren;
        };

        var _returnRoots = function () {
          var oHierarchy = {
            Hierarchy: {
              Children: [],
            },
          };
          for (var i = 0; i < aStruc.length; i++) {
            if (aStruc[i].Level === 1 && aStruc[i].PupObjid === "00000000") {
              var oRoot = {};
              oRoot.Stext = aStruc[i].Stext;
              oRoot.Description1 = null;
              oRoot.Description2 = null;
              oRoot.Otype = aStruc[i].Otype;
              oRoot.Objid = aStruc[i].Objid;
              oRoot.Selectable = false;
              oRoot.AlreadySelected = false;
              oRoot.Children = _returnChildren(oRoot.Otype, oRoot.Objid);
              oHierarchy.Hierarchy.Children.push(oRoot);
            }
          }
          return oHierarchy;
        };

        /*Initiate tree data*/
        oEnhanceModel.setData({});
        if (oData.FeStrucAvailable !== null) {
          try {
            aStruc = oData.FeStrucAvailable.results;
            oEnhanceModel.setData(_returnRoots());
            oEnhanceModel.setProperty("/RowIid", sRowIid);
            this._openAddNewElementCatalogDialog();
          } catch (oErr) {
            jQuery.sap.log.error(oErr);
          }
        }
      },

      _doEnhanceSingle: function (p, c, s) {
        var oVM = this.getModel("formDetailsModel");
        var oVD = oVM.getData();

        var oCurrentRowPanel = null;

        oCurrentRowPanel = this._findUIElement(p, "RowPanel", null, true);

        if (oCurrentRowPanel !== null && c !== null && c !== "0000") {
          this._addRow(oCurrentRowPanel, oVD, c, true, false);

          if (s) {
            var oNewInput = this._findUIElement(
              p,
              "RowPanelHeader",
              null,
              true
            );

            if (oNewInput.UIElement) {
              oNewInput.UIElement.addEventDelegate({
                onAfterRendering: function () {
                  oNewInput.UIElement.focus();
                },
              });
            }
          }
        }
      },
      _doEnhanceDocumentFromCatalog: function (aNewElements, sRowIid) {
        var that = this;
        $.each(aNewElements, function (n, e) {
          that._doEnhanceSingle(sRowIid, e.RowIid, false);
        });
        if (aNewElements.length === 1) {
          MessageToast.show(
            this.getText("newElementAdded", [aNewElements[0].Name])
          );
        } else if (aNewElements.length > 1) {
          MessageToast.show(
            this.getText("newElementsAdded", [aNewElements.length])
          );
        }
      },
      _enhanceDocument: function (
        oData,
        sRowIid,
        sFromCatalog,
        sParentName,
        sObj,
        sElementLevel
      ) {
        var that = this;
        // Backup current form state in case of a cancel -- BEGIN
        this._backUpOldFormState();
        // Backup current form state in case of a cancel -- END

        // Set new form state -- BEGIN
        this._setNewFormState(oData, sRowIid, sParentName)
          .then(function (aResult) {
            var sNewRowIid = aResult[0];
            var aNewElements = aResult[1];
            var sChildRowIid = aResult[2];

            /*Re-produce surveys*/
            that._formElementSurveysObject();
            that._addElementCallBack = null;

            if (!sObj) {
              if (!sFromCatalog) {
                that._addElementCallBack = jQuery.proxy(
                  that._doEnhanceDocument,
                  that,
                  sRowIid,
                  sNewRowIid,
                  sElementLevel
                );
                that._openAddNewElementFreeFormDialog(sNewRowIid, oData);
              } else {
                that._doEnhanceDocumentFromCatalog(aNewElements, sRowIid);
              }
            } else {
              // this._addElementCallBack = _doEnhance;
              that._addElementCallBack = jQuery.proxy(
                that._doEnhanceDocument,
                that,
                sRowIid,
                sNewRowIid,
                sElementLevel
              );
              that._openAddNewElementObjectiveDialog();
            }
          })
          .catch(function (e) {
            console.log(e);
            that._restoreOldFormState();
          });
        // Set new form state -- END
      }, //_enhanceDocument

      _backUpOldFormState: function () {
        var oViewModel = this.getModel("formDetailsModel");
        var oBodyElements = oViewModel.getProperty("/bodyElements");
        var oBodyCells = oViewModel.getProperty("/bodyCells");
        var oBodyCellValues = oViewModel.getProperty("/bodyCellValues");
        // Backup current form state in case of a cancel -- BEGIN
        var aBodyCellsClone = _.clone(
          oViewModel.getProperty("/formData/BodyCells")
        );
        var aBodyCellValuesClone = _.clone(
          oViewModel.getProperty("/formData/BodyCellValues")
        );
        var aBodyElementsClone = _.clone(
          oViewModel.getProperty("/formData/BodyElements")
        );
        var aBodyElementButtonsClone = _.clone(
          oViewModel.getProperty("/formData/BodyElementButtons")
        );
        oViewModel.setProperty(
          "/beforeAddFreeFormData/aBodyCells",
          aBodyCellsClone
        );
        oViewModel.setProperty(
          "/beforeAddFreeFormData/aBodyCellValues",
          aBodyCellValuesClone
        );
        oViewModel.setProperty(
          "/beforeAddFreeFormData/aBodyElements",
          aBodyElementsClone
        );
        oViewModel.setProperty(
          "/beforeAddFreeFormData/aBodyElementButtons",
          aBodyElementButtonsClone
        );

        var oBodyCellsClone = _.clone(oBodyCells);
        var oBodyCellValuesClone = _.clone(oBodyCellValues);
        var oBodyElementsClone = _.clone(oBodyElements);
        oViewModel.setProperty(
          "/beforeAddFreeFormData/oBodyCells",
          oBodyCellsClone
        );
        oViewModel.setProperty(
          "/beforeAddFreeFormData/oBodyCellValues",
          oBodyCellValuesClone
        );
        oViewModel.setProperty(
          "/beforeAddFreeFormData/oBodyElements",
          oBodyElementsClone
        );
        // Backup current form state in case of a cancel -- END
      },

      _setNewFormState: function (oData, sRowIid, sParentName) {
        var that = this;

        var stateChangePromise = new Promise(function (resolve, reject) {
          try {
            var oViewModel = that.getModel("formDetailsModel");
            var aBodyElements = oData.BodyElements.hasOwnProperty("results")
              ? oData.BodyElements.results
              : [];
            var aBodyElementButtons = oData.BodyElementButtons.hasOwnProperty(
              "results"
            )
              ? oData.BodyElementButtons.results
              : [];
            var aBodyCells = oData.BodyCells.hasOwnProperty("results")
              ? oData.BodyCells.results
              : [];
            var aBodyCellValues = oData.BodyCellValues.hasOwnProperty("results")
              ? oData.BodyCellValues.results
              : [];
            var aFormQuestions = [];
            var aFormAnswers = [];
            var oBodyElements = oViewModel.getProperty("/bodyElements");
            var oBodyCells = oViewModel.getProperty("/bodyCells");
            var oBodyCellValues = oViewModel.getProperty("/bodyCellValues");
            var oElementSurveys = oViewModel.getProperty("/elementSurveys");
            var oFormQuestions = oViewModel.getProperty(
              "/formData/FormQuestions"
            );
            var oFormAnswers = oViewModel.getProperty("/formData/FormAnswers");
            var sChildRowIid = null;
            var sNewRowIid = null;
            var aNewElements = [];

            if (oData?.FormQuestions !== null) {
              aFormQuestions = oData.FormQuestions.hasOwnProperty("results")
                ? oData.FormQuestions.results
                : [];
              aFormAnswers = oData.FormAnswers.hasOwnProperty("results")
                ? oData.FormAnswers.results
                : [];
            }
            oViewModel.setProperty("/newElement", {
              Value: null,
              RowIid: null,
              PlaceHolder: null,
              ParentName: null,
            });
            //Set new element
            $.each(aBodyElements, function (sIndex, oElement) {
              if (oElement.RowIid === sRowIid) {
                sChildRowIid = oElement.Child;
              }
              if (!oBodyElements.hasOwnProperty(oElement.RowIid)) {
                /*Set New Elements Row Id */
                sNewRowIid = oElement.RowIid;
                oViewModel.setProperty("/newElement/RowIid", oElement.RowIid);
                oViewModel.setProperty(
                  "/newElement/PlaceHolder",
                  oElement.Name
                );
                oViewModel.setProperty("/newElement/ParentName", sParentName);

                var oNewElement = {};
                oNewElement[oElement.RowIid] = oElement;
                if (typeof Object.assign === "function") {
                  Object.assign(oBodyElements, oNewElement);
                } else {
                  $.extend(oBodyElements, oNewElement);
                }

                aNewElements.push(oElement);

                oBodyCells[oElement.RowIid] = {};
                oBodyCellValues[oElement.RowIid] = {};
              } else {
                oBodyElements[oElement.RowIid] = oElement;
              }
            });

            $.each(aBodyCells, function (sIndex, oCell) {
              if (!oBodyCells[oCell.RowIid].hasOwnProperty([oCell.ColumnIid])) {
                oBodyCells[oCell.RowIid][oCell.ColumnIid] = oCell;
                oBodyCellValues[oCell.RowIid][oCell.ColumnIid] = {};
                oBodyCellValues[oCell.RowIid][oCell.ColumnIid].CellValues = [];
                $.each(
                  oData.BodyCellValues.results,
                  function (sValin, oCellValue) {
                    if (
                      oCellValue.RowIid === oCell.RowIid &&
                      oCellValue.ColumnIid === oCell.ColumnIid
                    ) {
                      oBodyCellValues[oCell.RowIid][
                        oCell.ColumnIid
                      ].CellValues.push(oCellValue);
                    }
                  }
                );
              } else {
                oBodyCells[oCell.RowIid][oCell.ColumnIid] = oCell;
              }
            });

            $.each(aFormQuestions, function (sIndex, oQuestion) {
              if (!oElementSurveys.hasOwnProperty(oQuestion.RowIid)) {
                oFormQuestions.push(oQuestion);
              }
            });

            $.each(aFormAnswers, function (sIndex, oAnswer) {
              if (!oElementSurveys.hasOwnProperty(oAnswer.RowIid)) {
                oFormAnswers.push(oAnswer);
              }
            });

            oViewModel.setProperty("/formData/BodyElements", aBodyElements);
            oViewModel.setProperty(
              "/formData/BodyElementButtons",
              aBodyElementButtons
            );
            oViewModel.setProperty("/formData/BodyCells", aBodyCells);
            oViewModel.setProperty("/formData/BodyCellValues", aBodyCellValues);
            oViewModel.setProperty("/formData/FormQuestions", oFormQuestions);
            oViewModel.setProperty("/formData/FormAnswers", oFormAnswers);
            oViewModel.setProperty("/bodyElements", oBodyElements);
            oViewModel.setProperty("/bodyCells", oBodyCells);
            oViewModel.setProperty("/bodyCellValues", oBodyCellValues);

            resolve([sNewRowIid, aNewElements, sChildRowIid]);
          } catch (e) {
            reject(e);
          }
        });

        return stateChangePromise;
      },

      _checkMandatoryStatusNote: function (sButtonId) {
        var oViewModel = this.getModel("formDetailsModel");
        var oModel = this.getModel();
        var that = this;
        var bHasErrors = false;
        that._convertUIData();

        var oOperation = {
          AppraisalId: oViewModel.getProperty("/appraisalId"),
          PartApId: "0000",
          Operation: "CHECK_MNOTE",
          RowIid: null,
          ButtonId: sButtonId,
          BodyElements: oViewModel.getProperty("/formData/BodyElements"),
          BodyCells: oViewModel.getProperty("/formData/BodyCells"),
          ResultTable: oViewModel.getProperty("/formData/ResultTable"),
          Return: oViewModel.getProperty("/formData/Return"),
          ReturnOp: oViewModel.getProperty("/formData/ReturnOp"),
          Buttons: oViewModel.getProperty("/formData/Buttons"),
          FormQuestions: oViewModel.getProperty("/formData/FormQuestions"),
        };

        oModel.create("/DocumentOperationsSet", oOperation, {
          success: function (oData, oResponse) {
            /* Close busy indicator*/
            that._closeBusyFragment();

            /* Return messages */
            if (oData.Return !== null) {
              if (oData.Return.hasOwnProperty("results")) {
                bHasErrors = that._processReturnMessages(
                  oData.Return.results,
                  true
                );
              }
            }

            if (!bHasErrors) {
              return oData.ReturnOp.StatusNote;
            } else {
              return "";
            }
          },
          error: function (oError) {
            that._closeBusyFragment();
            MessageBox.error(that.getText("formStatusChangeError"));
          },
          async: true,
        });
      },

      _doChangeFormStatus: function (sButtonId) {
        var oViewModel = this.getModel("formDetailsModel");
        var oModel = this.getModel();
        var aFormProp = oViewModel.getProperty("/aFormProp");
        var that = this;
        var bHasErrors = false;

        that._convertUIData();

        var oOperation = {
          AppraisalId: oViewModel.getProperty("/appraisalId"),
          PartApId: "0000",
          Operation: "STAT_CHNG",
          RowIid: null,
          StatusNote: oViewModel.getProperty("/statusChangeNote"),
          ButtonId: sButtonId,
          BodyElements: oViewModel.getProperty("/formData/BodyElements"),
          ResultTable: oViewModel.getProperty("/formData/ResultTable"),
          BodyCells: oViewModel.getProperty("/formData/BodyCells"),
          BodyCellValues: oViewModel.getProperty("/formData/BodyCellValues"),
          HeaderStatus: oViewModel.getProperty("/formData/HeaderStatus"),
          Return: oViewModel.getProperty("/formData/Return"),
          ReturnOp: oViewModel.getProperty("/formData/ReturnOp"),
          Buttons: oViewModel.getProperty("/formData/Buttons"),
          FormQuestions: oViewModel.getProperty("/formData/FormQuestions"),
        };

        this._removeAllMessages();

        this._openBusyFragment("formStatusChange");
        oModel.create("/DocumentOperationsSet", oOperation, {
          success: function (oData, oResponse) {
            /* Close busy indicator*/
            that._closeBusyFragment();

            /* Return messages */
            if (oData.Return !== null) {
              if (oData.Return.hasOwnProperty("results")) {
                bHasErrors = that._processReturnMessages(
                  oData.Return.results,
                  true
                );
              }
            }

            if (!bHasErrors) {
              /* Synchronize UI */
              that._synchronizeUIAfterUpdate(oData, true, true);
              that.getUIHelper().setFormListUpdated(false);
              MessageToast.show(that.getText("formStatusChangeSuccessful"));
              if (oData.ReturnOp.DocumentLeave === "X") {
                that.onNavBack();
              } else if (oData.ReturnOp.DocumentLeave === "1") {
                /*Do nothing*/
              }
            }
          },
          error: function (oError) {
            that._closeBusyFragment();
            MessageBox.error(that.getText("formStatusChangeError"));
          },
          async: true,
        });
      },
      _handleButtonAction: function (oButton) {
        var that = this;
        var oViewModel = this.getModel("formDetailsModel");
        var aButton = oViewModel.getProperty("/formData/Buttons");
        var sButtonId = oButton.data("ButtonId");
        var sStatusNoteAvailability = oButton.data("StatusNoteAvailability");
        var oButtonData = null;

        $.each(aButton, function (sIndex, oData) {
          if (oData.Id === sButtonId) {
            oButtonData = oData;
            return false;
          }
        });
        var sFormId = oButtonData.FormId;
        var sRowIid = oButtonData.FormRowIid;

        var _doCallSurvey = function () {
          that._handleCallSurvey(sRowIid, sFormId, true);
        };

        var _doChangeStatus = function () {
          that._handleChangeStatus(sButtonId);
        };

        /* Check if survey has to be filled */
        if (sFormId !== "" && sFormId !== null) {
          var sSurveyIncompleted = this._checkSurveyHasFinished(
            sRowIid,
            sFormId
          );
          if (sSurveyIncompleted) {
            this._generateConfirmDialog(
              "surveyNotice",
              "surveyShouldBeFilled",
              [],
              "fillSurvey",
              "Accept",
              "sap-icon://survey",
              _doCallSurvey,
              "Warning",
              "continueWithoutFilling",
              "Reject",
              "sap-icon://process",
              _doChangeStatus
            );

            return false;
          } else {
            this._handleChangeStatus(sButtonId);
          }
        } else if (
          oButtonData.FbColumnIid !== "0000" &&
          oButtonData.FbRowIid !== "0000"
        ) {
          that._getFeedBack(
            oButtonData.FbColumnIid,
            oButtonData.FbRowIid,
            oButtonData.FbQuestionText,
            sButtonId
          );
          return false;
        } else {
          /* Check if feedback should be taken*/
          if (sStatusNoteAvailability === "") {
            this._handleChangeStatus(sButtonId);
          } else {
            this._handleChangeStatusWithNote(oButton);
          }
        }
      },
      _handleChangeStatusWithNote: function (oButton) {
        var that = this;
        var sButtonId = oButton.data("ButtonId");
        var sStatusNoteAvailability = oButton.data("StatusNoteAvailability");
        var sButtonText = oButton.getText();

        var oViewModel = this.getModel("formDetailsModel");

        oViewModel.setProperty("/statusChangeNote", "");

        var oStatusChangeNoteDialog = new sap.m.Dialog({
          title: "{i18n>STATUS_CHANGE_NOTE_TITLE}",
          contentWidth: "500px",
          type: "Message",
          state: "Warning",
          content: [
            new sap.m.FlexBox({
              width: "100%",
              justifyContent: "Center",
              items: [
                new sap.m.TextArea({
                  value: "{formDetailsModel>/statusChangeNote}",
                  placeholder: "{i18n>STATUS_CHANGE_NOTE_PLACEHOLDER}",
                  width: "100%",
                  rows: 5,
                  layoutData: new sap.m.FlexItemData({
                    growFactor: 1,
                    alignSelf: sap.m.FlexAlignSelf.Center,
                  }),
                }),
              ],
            }),
          ],
          beginButton: new sap.m.Button({
            text: sButtonText,
            type: "Accept",
            press: function () {
              var sNote = "";
              try {
                sNote = oViewModel.getProperty("/statusChangeNote").trim();
              } catch (oEx) {
                sNote = "";
              }
              if (sStatusNoteAvailability === "M" && sNote === "") {
                MessageToast.show(that.getText("STATUS_CHANGE_NOTE_MANDATORY"));
                return;
              }
              oStatusChangeNoteDialog.close();
              that._doChangeFormStatus(sButtonId);
            },
          }),
          endButton: new sap.m.Button({
            text: "{i18n>labelCancel}",
            press: function () {
              oStatusChangeNoteDialog.close();
            },
          }),
          afterClose: function () {
            oStatusChangeNoteDialog.destroy();
          },
        });

        this.getView().addDependent(oStatusChangeNoteDialog);

        oStatusChangeNoteDialog.open();
      },
      _handleChangeStatus: function (sButtonId) {
        var that = this;

        var _doChangeStatus = function () {
          that.confirmDialog.close();
          that._doChangeFormStatus(sButtonId);
        };

        this._generateConfirmDialog(
          "formStatusChangeConfirm",
          "formStatusChangeQuestion",
          [],
          "doFormStatusChange",
          "Accept",
          "sap-icon://accept",
          _doChangeStatus,
          "Warning"
        );
      },
      _getFeedBack: function (sColumnIid, sRowIid, sQuestionText, sButtonId) {
        var sSelectedClause =
          "{= ${formDetailsModel>/bodyCells/" +
          sRowIid +
          "/" +
          sColumnIid +
          "/ValueString} === '0000' ? -1 : ${formDetailsModel>/bodyCells/" +
          sRowIid +
          "/" +
          sColumnIid +
          "/ValueString} === '0001' ? 0 : ${formDetailsModel>/bodyCells/" +
          sRowIid +
          "/" +
          sColumnIid +
          "/ValueString} === '0000' ? 1 : -1 }";
        var sNoClause =
          "{= ${formDetailsModel>/bodyCells/" +
          sRowIid +
          "/" +
          sColumnIid +
          "/ValueNum} !== '1' ? true : false }";

        var sCellValueNum =
          "/bodyCells/" + sRowIid + "/" + sColumnIid + "/ValueNum";
        var sCellValueString =
          "/bodyCells/" + sRowIid + "/" + sColumnIid + "/ValueString";

        var that = this;

        var oFeedBackDialog = new sap.m.Dialog({
          title: sQuestionText,
          contentWidth: "550px",
          type: "Message",
          state: "Warning",
          content: [
            new sap.m.FlexBox({
              alignItems: "Stretch",
              justifyContent: "Center",
              items: [
                new sap.m.RadioButtonGroup({
                  selectedIndex: -1,
                  columns: 2,
                  buttons: [
                    new sap.m.RadioButton({
                      width: "150px",
                      text: "Evet",
                      select: that._onRadioButtonValueSelected.bind(that),
                    })
                      .data("bindingReference", sCellValueString)
                      .data("bindingValue", "0001"),
                    new sap.m.RadioButton({
                      width: "150px",
                      text: "Hayır",
                      select: that._onRadioButtonValueSelected.bind(that),
                    })
                      .data("bindingReference", sCellValueString)
                      .data("bindingValue", "0002"),
                  ],
                }),
              ],
            }),
          ],
          beginButton: new sap.m.Button({
            text: "Onayla",
            type: "Accept",
            press: function () {
              oFeedBackDialog.close();
              that._handleChangeStatus(sButtonId);
            },
          }),
          endButton: new sap.m.Button({
            text: "İptal",
            press: function () {
              oFeedBackDialog.close();
            },
          }),
          afterClose: function () {
            oFeedBackDialog.destroy();
          },
        });

        oFeedBackDialog.open();
      },

      _handlePrintDocument: function (oButton) {
        /*To be coded later on*/
        var oModel = this.getModel();
        var oViewModel = this.getModel("formDetailsModel");
        var sAppraisalId = oViewModel.getProperty("/appraisalId");

        if (!sAppraisalId) {
          return;
        }

        oButton.setBusy(true);

        var oEntity = oModel.createKey("/DocumentSet", {
          AppraisalId: sAppraisalId,
          PartApId: "0000",
        });

        var sUrl = "/sap/opu/odata/sap/ZHCM_UX_HAP_SRV" + oEntity + "/$value";

        MessageToast.show(this.getText("lastSavedPrintOutNotification"), {
          duration: 2000, // default
          width: "20em", // default
          my: "center center", // default
          at: "center center", // default
          onClose: function () {
            oButton.setBusy(false);
            sap.m.URLHelper.redirect(sUrl, true);
          },
        });
      },

      _openAddNewElementFreeDialog: function () {
        var oViewModel = this.getModel("formDetailsModel");
        oViewModel.setProperty("/newElement/Value", "");

        // create dialog lazily
        if (!this._oAddNewElementFreeDialog) {
          // create dialog via fragment factory
          this._oAddNewElementFreeDialog = sap.ui.xmlfragment(
            "hcm.ux.hapv5.fragment.AddNewElementFree",
            this
          );
          // connect dialog to view (models, lifecycle)
          this.getView().addDependent(this._oAddNewElementFreeDialog);
        }

        this._oAddNewElementFreeDialog.open();
      },

      _openAddNewElementFreeFormDialog: function (sNewRowIid, oEnhanceData) {
        var that = this;
        var oViewModel = this.getModel("formDetailsModel");
        oViewModel.setProperty("/newElement/Value", "");

        // create dialog lazily
        if (!this._oAddNewElementFreeFormDialog) {
          // create dialog via fragment factory
          this._oAddNewElementFreeFormDialog = sap.ui.xmlfragment(
            "hcm.ux.hapv5.fragment.AddNewElementFreeForm",
            this
          );
          //escape handler
          this._oAddNewElementFreeFormDialog.setEscapeHandler(function (o) {
            o.reject();
            that.onCloseAddElementFree();
          });
          // connect dialog to view (models, lifecycle)
          this.getView().addDependent(this._oAddNewElementFreeFormDialog);
        }

        //var oForm = sap.ui.getCore().byId("idNewElementFreeForm");
        var oGrid = sap.ui.getCore().byId("idNewElementFreeGrid");
        try {
          //oForm.destroyFormContainers();
          oGrid.destroyContent();
          this._addNewElementFreeFormCells(
            oGrid,
            sNewRowIid,
            oEnhanceData,
            false
          );
          // this._setPauseAutoSave(true);
          this._oAddNewElementFreeFormDialog.open();
        } catch (oErr) {
          console.log(oErr);
        }
      },
      _openAddNewElementObjectiveDialog: function () {
        var that = this;
        var oViewModel = this.getModel("formDetailsModel");
        oViewModel.setProperty("/newElement/Value", "");

        // create dialog lazily
        if (!this._oAddNewElementObjectiveDialog) {
          // create dialog via fragment factory
          this._oAddNewElementObjectiveDialog = sap.ui.xmlfragment(
            "hcm.ux.hapv5.fragment.AddNewElementObjective",
            this
          );
          //escape handler
          this._oAddNewElementObjectiveDialog.setEscapeHandler(function (o) {
            o.reject();
            that.onCloseAddElementObjective();
          });
          // connect dialog to view (models, lifecycle)
          this.getView().addDependent(this._oAddNewElementObjectiveDialog);
        }
        this._oAddNewElementObjectiveDialog.open();
      },
      _openAddNewElementCatalogDialog: function () {
        // create dialog lazily
        if (!this._oAddNewElementCatalogDialog) {
          // create dialog via fragment factory
          this._oAddNewElementCatalogDialog = sap.ui.xmlfragment(
            "hcm.ux.hapv5.fragment.AddNewElementCatalog",
            this
          );
          // connect dialog to view (models, lifecycle)
          this.getView().addDependent(this._oAddNewElementCatalogDialog);
        }

        this._oAddNewElementCatalogDialog.open();
      },

      _restoreOldFormState: function () {
        var oViewModel = this.getModel("formDetailsModel");

        // Clone before deletion
        var aBodyCellsClone = _.clone(
          oViewModel.getProperty("/beforeAddFreeFormData/aBodyCells")
        );
        var aBodyCellValuesClone = _.clone(
          oViewModel.getProperty("/beforeAddFreeFormData/aBodyCellValues")
        );
        var aBodyElementsClone = _.clone(
          oViewModel.getProperty("/beforeAddFreeFormData/aBodyElements")
        );
        var aBodyElementButtonsClone = _.clone(
          oViewModel.getProperty("/beforeAddFreeFormData/aBodyElementButtons")
        );

        var oBodyCellsClone = _.clone(
          oViewModel.getProperty("/beforeAddFreeFormData/oBodyCells")
        );
        var oBodyCellValuesClone = _.clone(
          oViewModel.getProperty("/beforeAddFreeFormData/oBodyCellValues")
        );
        var oBodyElementsClone = _.clone(
          oViewModel.getProperty("/beforeAddFreeFormData/oBodyElements")
        );

        oViewModel.setProperty("/formData/BodyElements", aBodyElementsClone);
        oViewModel.setProperty(
          "/formData/BodyElementButtons",
          aBodyElementButtonsClone
        );
        oViewModel.setProperty("/formData/BodyCells", aBodyCellsClone);
        oViewModel.setProperty(
          "/formData/BodyCellValues",
          aBodyCellValuesClone
        );

        oViewModel.setProperty("/bodyElements", oBodyElementsClone);
        oViewModel.setProperty("/bodyCells", oBodyCellsClone);
        oViewModel.setProperty("/bodyCellValues", oBodyCellValuesClone);
        oViewModel.setProperty("/newElement", {
          Value: null,
          RowIid: null,
          PlaceHolder: null,
          ParentName: null,
        });
        // this._setPauseAutoSave(false);
      },

      _openUploadAttachmentDialog: function () {
        // create dialog lazily
        if (!this._oUploadAttachmentDialog) {
          // create dialog via fragment factory
          this._oUploadAttachmentDialog = sap.ui.xmlfragment(
            "hcm.ux.hapv5.fragment.UploadAttachments",
            this
          );
          // connect dialog to view (models, lifecycle)
          this.getView().addDependent(this._oUploadAttachmentDialog);
        }

        var oFileUploader = sap.ui.getCore().byId("idAttachmentFileUploader");
        try {
          if (oFileUploader) {
            oFileUploader.clear();
          }
        } catch (oErr) {
          jQuery.sap.log.error("File uploader not loaded yet...");
        }

        this._oUploadAttachmentDialog.open();
      },

      _showDevTrainings: function (oEvent) {
        if (!this._oDevTrainingsDialog) {
          // create dialog via fragment factory
          this._oDevTrainingsDialog = sap.ui.xmlfragment(
            "hcm.ux.hapv5.fragment.DevelopmentTrainings",
            this
          );
          // connect dialog to view (models, lifecycle)
          this.getView().addDependent(this._oDevTrainingsDialog);
        }

        var oList = sap.ui.getCore().byId("idDevTrainingsList");
        var oViewModel = this.getModel("formDetailsModel");
        var aFilter = [];

        aFilter.push(
          new Filter(
            "Pernr",
            FilterOperator.EQ,
            oViewModel.getProperty("/formData/HeaderAppraisee/0/Id")
          )
        );

        // filter binding
        var oBinding = oList.getBinding("items");
        oBinding.filter(aFilter);

        this._oDevTrainingsDialog.open();
      },

      _openTrainingCatalogLink: function () {
        window.open(
          "https://webapps01.thy.com/intranets/kurumsal-operasyonel-cozumler/web10/TTASDocuments/Egitim_Katalogu.pdf",
          "_blank"
        );
      },
    });
  }
);
