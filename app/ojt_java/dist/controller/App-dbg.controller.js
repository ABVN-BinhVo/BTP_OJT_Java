// sap.ui.define([
//   "sap/ui/core/mvc/Controller"
// ], (BaseController) => {
//   "use strict";

//   return BaseController.extend("ojtjava.controller.App", {
//       onInit() {
//       }
//   });
// });


sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], function (Controller, MessageToast) {
    "use strict";

    return Controller.extend("ojtjava.controller.App", {
        onInit: function () {
            // Safe component access
            const oComponent = this.getOwnerComponent();
            console.log("Component:", oComponent);
            
            if (oComponent) {
                console.log("Router from component:", oComponent.getRouter());
            }
        },
        
        onNavToInputForm: function () {
            // Reliable router access
            const oComponent = this.getOwnerComponent();
            
            if (oComponent && oComponent.getRouter) {
                const oRouter = oComponent.getRouter();
                oRouter.navTo("EmployeeInfo");
                MessageToast.show("Navigating to Employee Info", {
                    duration: 3000,
                    at: "center bottom"
                });
            } else {
                console.error("Component or router not found!");
                MessageToast.show("Component or router not found!");
            }
        },
        
        onNavToEmployeeList: function () {
            // Consistent access pattern
            const oComponent = this.getOwnerComponent();
            
            if (oComponent && oComponent.getRouter) {
                const oRouter = oComponent.getRouter();
                oRouter.navTo("EmployeeList");
                MessageToast.show("Navigating to Employee List");
            } else {
                console.error("Component or router not found!");
                MessageToast.show("Component or router not found!");
            }
        }
    });
});