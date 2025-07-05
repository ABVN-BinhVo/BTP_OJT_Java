namespace app.employees;

entity Roles {
  key ID       : UUID;
      name     : String(100) @title: 'Role Name';
      baseSalary : Decimal(10,2) @title: 'Base Salary';
      employees : Association to many Employees on employees.role = $self;
}

entity Departments {
  key ID   : UUID;
      name : String(100) @title: 'Department Name';
      employees : Association to many Employees on employees.department = $self;
}

entity Employees {
  key ID          : UUID;
      firstName   : String(100) @title: 'First Name';
      lastName    : String(100) @title: 'Last Name';
      email       : String(255) @title: 'Email Address';
      hireDate    : Date @title: 'Hire Date';
      salary      : Decimal(10,2) @title: 'Salary' @readonly;
      role        : Association to Roles;
      department  : Association to Departments;
}
