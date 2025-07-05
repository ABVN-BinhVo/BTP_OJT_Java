using app.employees as db from '../db/model';

// Define the EmployeeService with projections and annotations
@requires: 'authenticated-user'
service EmployeeService @(path: '/employee') {
  entity Roles as projection on db.Roles;
  entity Departments as projection on db.Departments;
  @restrict: [
    { grant: '*', to: 'Admin' },
    { grant: ['READ'], to: 'Viewer' }
  ]
  entity Employees as projection on db.Employees {
    *,
    role: redirected to Roles,
    department: redirected to Departments
  };
}

// Add annotations for field validation
annotate EmployeeService.Employees with {
  firstName   @mandatory;
  lastName    @mandatory;
  email       @mandatory @assert.format: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$';
  hireDate    @mandatory;
  role        @mandatory;
  department  @mandatory;
}

// Format annotations for UI
annotate EmployeeService.Employees with @(UI: {
  HeaderInfo: {
    TypeName: 'Employee',
    TypeNamePlural: 'Employees',
    Title: { Value: firstName },
    Description: { Value: lastName }
  },
  SelectionFields: [ firstName, lastName, email, role_ID, department_ID ],
  LineItem: [
    { Value: firstName },
    { Value: lastName },
    { Value: email },
    { Value: hireDate },
    { Value: role.name },
    { Value: department.name },
    { Value: salary }
  ],
  Facets: [
    {
      $Type: 'UI.ReferenceFacet',
      Label: 'Employee Details',
      Target: '@UI.FieldGroup#Details'
    }
  ],
  FieldGroup#Details: {
    Data: [
      { Value: firstName },
      { Value: lastName },
      { Value: email },
      { Value: hireDate },
      { Value: role_ID },
      { Value: department_ID },
      { Value: salary }
    ]
  }
});