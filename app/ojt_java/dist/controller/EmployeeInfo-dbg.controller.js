sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/ui/core/ValueState"
], (Controller, UIComponent, JSONModel, MessageToast, MessageBox, Fragment, ValueState) => {
    "use strict";

    return Controller.extend("ojtjava.controller.EmployeeInfo", {
        onInit: function () {
            // Router
            var oRouter = UIComponent.getRouterFor(this);
            oRouter.getRoute("EmployeeInfo").attachPatternMatched(this._onRouteMatched, this);

            // Validation model
            this.oValidationModel = new JSONModel({
                firstNameState: ValueState.None,
                firstNameStateText: "",
                lastNameState: ValueState.None,
                lastNameStateText: "",
                emailState: ValueState.None,
                emailStateText: "",
                hireDateState: ValueState.None,
                hireDateStateText: "",
                roleState: ValueState.None,
                roleStateText: "",
                departmentState: ValueState.None,
                departmentStateText: ""
            });
            this.getView().setModel(this.oValidationModel, "validation");
        },

        _onRouteMatched: async function(oEvent) {
            var sId = oEvent.getParameter("arguments").id;
            this._resetValidationStates();

            // Fetch roles and departments
            try {
                const [rolesRes, departmentsRes] = await Promise.all([
                    fetch("/odata/v4/employee/Roles"),
                    fetch("/odata/v4/employee/Departments")
                ]);
                const rolesData = await rolesRes.json();
                const departmentsData = await departmentsRes.json();

                this.getView().setModel(new JSONModel(rolesData.value), "roles");
                this.getView().setModel(new JSONModel(departmentsData.value), "departments");
            } catch (e) {
                MessageToast.show("Error loading roles or departments");
            }

            if (sId === "new") {
                this._setupNewEmployee();
                return;
            }

            // Load employee for edit
            try {
                // const response = await fetch(`/odata/v4/employee/Employees(${encodeURIComponent("'" + sId + "'")})?$expand=role,department`);
                const response = await fetch(`/odata/v4/employee/Employees(${encodeURIComponent(sId)})?$expand=role,department`);

                // ...existing code...
                // const response = await fetch(`/odata/v4/employee/Employees(ID=guid'${sId}')?$expand=role,department`);
                // ...existing code...
                if (!response.ok) throw new Error("Employee not found");
                const oEmployee = await response.json();
                this.getView().setModel(new JSONModel(oEmployee), "employee");
            } catch (e) {
                MessageToast.show("Error loading employee");
            }
        },

        _setupNewEmployee: function() {
            var oNewEmployee = {
                ID: "",
                firstName: "",
                lastName: "",
                email: "",
                hireDate: "",
                salary: "",
                role: { ID: "", name: "" },
                department: { ID: "", name: "" }
            };
            this.getView().setModel(new JSONModel(oNewEmployee), "employee");
        },

        _resetValidationStates: function() {
            this.oValidationModel.setData({
                firstNameState: ValueState.None,
                firstNameStateText: "",
                lastNameState: ValueState.None,
                lastNameStateText: "",
                emailState: ValueState.None,
                emailStateText: "",
                hireDateState: ValueState.None,
                hireDateStateText: "",
                roleState: ValueState.None,
                roleStateText: "",
                departmentState: ValueState.None,
                departmentStateText: ""
            });
        },

        validateForm: function() {
            var oEmployee = this.getView().getModel("employee").getData();
            var oValidation = this.oValidationModel.getData();
            var bValid = true;

            // First Name
            if (!oEmployee.firstName || oEmployee.firstName.trim() === "") {
                oValidation.firstNameState = ValueState.Error;
                oValidation.firstNameStateText = "First name is required";
                bValid = false;
            } else {
                oValidation.firstNameState = ValueState.None;
                oValidation.firstNameStateText = "";
            }

            // Last Name
            if (!oEmployee.lastName || oEmployee.lastName.trim() === "") {
                oValidation.lastNameState = ValueState.Error;
                oValidation.lastNameStateText = "Last name is required";
                bValid = false;
            } else {
                oValidation.lastNameState = ValueState.None;
                oValidation.lastNameStateText = "";
            }

            // Email
            if (!oEmployee.email || oEmployee.email.trim() === "") {
                oValidation.emailState = ValueState.Error;
                oValidation.emailStateText = "Email is required";
                bValid = false;
            } else if (!oEmployee.email.includes("@")) {
                oValidation.emailState = ValueState.Error;
                oValidation.emailStateText = "Email must contain @";
                bValid = false;
            } else {
                oValidation.emailState = ValueState.None;
                oValidation.emailStateText = "";
            }

            // Hire Date
            if (!oEmployee.hireDate) {
                oValidation.hireDateState = ValueState.Error;
                oValidation.hireDateStateText = "Hire date is required";
                bValid = false;
            } else {
                oValidation.hireDateState = ValueState.None;
                oValidation.hireDateStateText = "";
            }

            // Role
            if (!oEmployee.role || !oEmployee.role.ID) {
                oValidation.roleState = ValueState.Error;
                oValidation.roleStateText = "Role is required";
                bValid = false;
            } else {
                oValidation.roleState = ValueState.None;
                oValidation.roleStateText = "";
            }

            // Department
            if (!oEmployee.department || !oEmployee.department.ID) {
                oValidation.departmentState = ValueState.Error;
                oValidation.departmentStateText = "Department is required";
                bValid = false;
            } else {
                oValidation.departmentState = ValueState.None;
                oValidation.departmentStateText = "";
            }

            this.oValidationModel.setData(oValidation);
            this.oValidationModel.refresh(true);
            return bValid;
        },

        onSubmit: function() {
            if (!this.validateForm()) {
                MessageBox.error("Please fill in all required fields correctly before submitting.");
                return;
            }
            if (!this._oConfirmDialog) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: "ojtjava.view.fragment.ConfirmationDialog",
                    controller: this
                }).then(function(oDialog) {
                    this._oConfirmDialog = oDialog;
                    this.getView().addDependent(oDialog);
                    oDialog.open();
                }.bind(this));
            } else {
                this._oConfirmDialog.open();
            }
        },

        onConfirmSubmit: async function() {
            this._oConfirmDialog.close();
            var oEmployee = this.getView().getModel("employee").getData();
            var isNew = !oEmployee.ID;
            var payload = {
                firstName: oEmployee.firstName,
                lastName: oEmployee.lastName,
                email: oEmployee.email,
                hireDate: oEmployee.hireDate,
                role_ID: oEmployee.role && oEmployee.role.ID ? oEmployee.role.ID : null,
                department_ID: oEmployee.department && oEmployee.department.ID ? oEmployee.department.ID : null
            };
            if (!isNew) payload.ID = oEmployee.ID;
            Object.keys(payload).forEach(key => {
                if (payload[key] === null || payload[key] === "") delete payload[key];
            });

            var url = isNew
                ? "/odata/v4/employee/Employees"
                : `/odata/v4/employee/Employees(${oEmployee.ID})`;
            var method = isNew ? "POST" : "PATCH";

            try {
                var response = await fetch(url, {
                    method: method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                if (!response.ok) {
                    let errMsg = "Failed to save employee";
                    try { errMsg = (await response.json()).error.message; } catch(e){}
                    throw new Error(errMsg);
                }
                MessageToast.show("Employee saved successfully");
                UIComponent.getRouterFor(this).navTo("EmployeeList");
            } catch (e) {
                MessageBox.error("Error saving employee: " + e.message);
            }
        },

        onCancelSubmit: function() {
            this._oConfirmDialog.close();
        },

        onNavToInputForm: function () {
            UIComponent.getRouterFor(this).navTo("EmployeeInfo", { id: "new" });
        },

        onNavToEmployeeList: function () {
            UIComponent.getRouterFor(this).navTo("EmployeeList");
        }
    });
});