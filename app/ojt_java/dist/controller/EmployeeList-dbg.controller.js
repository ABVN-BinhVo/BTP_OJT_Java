sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
     "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/odata/OperationMode"
], (Controller, UIComponent, Filter, FilterOperator, MessageToast, JSONModel, OperationMode) => {
    "use strict";

    return Controller.extend("ojtjava.controller.EmployeeList", {

    onInit: async function () {
    // Try to get the default model from the view
    // let oModel = this.getOwnerComponent().getModel();
    let oModel = this.getView().getModel();
    // this.getView().getModel();

    var oRouter = UIComponent.getRouterFor(this);
    oRouter.getRoute("EmployeeList").attachPatternMatched(this._onRouteMatched, this);

    // If model isn't available, try to create it manually
    if (!oModel) {
        console.log("Model not found, creating manually");
        oModel = new sap.ui.model.odata.v4.ODataModel({
            serviceUrl: "/odata/v4/employee/",
            // serviceUrl: "/odata/v4/EmployeeService/",
            synchronizationMode: "None",
            operationMode: sap.ui.model.odata.OperationMode.Server
        });
        this.getView().setModel(oModel);
    }
    
    // Check if model is now available
    if (oModel) {
        console.log("OData model available");
        
        // For OData V4 model, create a binding for testing
        try {
            const oListBinding = oModel.bindList("/Employees");
            
            // Request data and log it
            oListBinding.requestContexts(0, 100).then((aContexts) => {
                console.log("Data loaded:", aContexts.length, "employees");
                MessageToast.show(`Loaded ${aContexts.length} employees`);
            }).catch((error) => {
                console.error("Error loading data:", error);
            });
        } catch (e) {
            console.error("Error creating binding:", e);
        }
    } else {
        console.error("Model not available - check manifest.json and service URL");
    }

     // Fetch departments and roles for filters
    try {
        const [deptRes, roleRes] = await Promise.all([
            fetch("/odata/v4/employee/Departments"),
            fetch("/odata/v4/employee/Roles")
            // fetch("/odata/v4/employee/Departments"),
            // fetch("/odata/v4/employee/Roles")
        ]);
        const departments = await deptRes.json();
        const roles = await roleRes.json();

        // Add "All Departments" and "All Roles" at the beginning
        departments.value.unshift({ ID: "", name: "All Departments" });
        roles.value.unshift({ ID: "", name: "All Roles" });

        this.getView().setModel(new JSONModel(departments.value), "departments");
        this.getView().setModel(new JSONModel(roles.value), "roles");
    } catch (e) {
        MessageToast.show("Error loading filter data");
    }
},

        _onRouteMatched: function() {
            var oTable = this.byId("employeeTable");
            if (oTable) {
                var oBinding = oTable.getBinding("items");
                if (oBinding) {
                    oBinding.refresh(); // This will re-read from backend
                }
            }
        },
        // Handle department filter change
        onDepartmentFilterChange: function() {
            this._applyFilters();
        },

        onRoleFilterChange: function() {
            this._applyFilters();
        },

        _applyFilters: function() {
            var oDepartmentFilter = this.byId("departmentFilter");
            var oRoleFilter = this.byId("roleFilter");
            var oTable = this.byId("employeeTable");
            var oBinding = oTable.getBinding("items");
            var aFilters = [];

            var sDepartmentId = oDepartmentFilter.getSelectedKey();
            var sRoleId = oRoleFilter.getSelectedKey();

            if (sDepartmentId) {
                aFilters.push(new Filter("department/ID", FilterOperator.EQ, sDepartmentId));
                console.log("Filtering for department:", sDepartmentId, "role:", sRoleId);
                oBinding.filter(aFilters);
                oBinding.refresh();
            }
            if (sRoleId) {
                aFilters.push(new Filter("role/ID", FilterOperator.EQ, sRoleId));
                console.log("Filtering for department:", sDepartmentId, "role:", sRoleId);
                oBinding.filter(aFilters);
                oBinding.refresh();
            }

            oBinding.filter(aFilters);
        },
        
        onEmployeePress: function(oEvent) {
        // Get the employeeId from the button's custom data
        var oButton = oEvent.getSource();
        var sEmployeeId = oButton.data("id");

        // Optionally: Store the selected employee in a global model or pass as route parameter
        // Navigate to EmployeeInfo, passing the employeeId
        UIComponent.getRouterFor(this).navTo("EmployeeInfo", {
            id : sEmployeeId
         });
        },

        onNavToInputForm: function () {
            // Navigate to create new employee form
            UIComponent.getRouterFor(this).navTo("EmployeeInfo", {
                id: "new"
            });
        },

        onNavToEmployeeList: function () {
            UIComponent.getRouterFor(this).navTo("EmployeeList");
        },
    });
});


