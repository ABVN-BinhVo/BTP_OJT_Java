package customer.ojt_java.handlers;

import com.sap.cds.services.handler.EventHandler;
import com.sap.cds.services.handler.annotations.Before;
import com.sap.cds.services.handler.annotations.After;
import com.sap.cds.services.handler.annotations.ServiceName;
import com.sap.cds.services.persistence.PersistenceService;
import com.sap.cds.services.EventContext;
import com.sap.cds.services.cds.CqnService;
import com.sap.cds.Result;
import com.sap.cds.Row;
import com.sap.cds.ql.Select;
import com.sap.cds.ql.Update;
import com.sap.cds.ql.cqn.CqnSelect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
@ServiceName("EmployeeService")
public class EmployeeServiceHandler implements EventHandler {

    private static final Logger logger = LoggerFactory.getLogger(EmployeeServiceHandler.class);
    private static final int BONUS_PER_YEAR = 1000;

    private final PersistenceService db;

    public EmployeeServiceHandler(PersistenceService db) {
        this.db = db;
    }

    @Before(event = {CqnService.EVENT_CREATE, CqnService.EVENT_UPDATE}, entity = "EmployeeService.Employees")
    public void beforeCreateOrUpdateEmployees(EventContext context) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> entities = (List<Map<String, Object>>) context.getMessages().stream()
                .map(message -> message.getTarget())
                .findFirst()
                .orElse(null);
        if (entities != null) {
            for (Map<String, Object> employee : entities) {
                updateSalaryWithBonus(employee);
            }
        }
    }

    @After(event = CqnService.EVENT_READ, entity = "EmployeeService.Employees")
    public void afterReadEmployees(Result result, EventContext context) {
        result.forEach(employee -> {
            String roleId = (String) employee.get("role_ID");
            Object hireDateObj = employee.get("hireDate");
            if (roleId == null || hireDateObj == null) {
                logger.warn("Missing role_ID or hireDate for employee: {}", employee.get("ID"));
                return;
            }

            // Check if role is expanded
            @SuppressWarnings("unchecked")
            Map<String, Object> role = (Map<String, Object>) employee.get("role");
            BigDecimal baseSalary = null;
            if (role != null && role.containsKey("baseSalary")) {
                baseSalary = new BigDecimal(role.get("baseSalary").toString());
            } else {
                baseSalary = getBaseSalaryFromRole(roleId);
            }

            if (baseSalary != null) {
                LocalDate hireDate = parseLocalDate(hireDateObj);
                LocalDate currentDate = LocalDate.now();
                long yearsOfService = ChronoUnit.YEARS.between(hireDate, currentDate);
                yearsOfService = Math.max(0, yearsOfService); // Ensure non-negative
                BigDecimal bonus = BigDecimal.valueOf(yearsOfService * BONUS_PER_YEAR);
                BigDecimal totalSalary = baseSalary.add(bonus);
                employee.put("salary", totalSalary.intValue());
                logger.info("Calculated salary for employee {}: {}", employee.get("ID"), totalSalary.intValue());
            } else {
                logger.warn("Could not find base salary for role ID: {}", roleId);
            }
        });
    }

    @Before(event = "calculateSalary")
    public void calculateSalary(EventContext context) {
        CqnSelect employeeQuery = Select.from("EmployeeService.Employees");
        Result employees = db.run(employeeQuery);
        employees.forEach(employee -> {
            String roleId = (String) employee.get("role_ID");
            Object hireDateObj = employee.get("hireDate");
            if (roleId == null || hireDateObj == null) {
                logger.warn("Missing role_ID or hireDate for employee: {}", employee.get("ID"));
                return;
            }

            BigDecimal baseSalary = getBaseSalaryFromRole(roleId);
            if (baseSalary != null) {
                LocalDate hireDate = parseLocalDate(hireDateObj);
                LocalDate currentDate = LocalDate.now();
                long yearsOfService = ChronoUnit.YEARS.between(hireDate, currentDate);
                yearsOfService = Math.max(0, yearsOfService);
                BigDecimal bonus = BigDecimal.valueOf(yearsOfService * BONUS_PER_YEAR);
                BigDecimal totalSalary = baseSalary.add(bonus);

                db.run(Update.entity("EmployeeService.Employees")
                        .where(e -> e.get("ID").eq(employee.get("ID")))
                        .data("salary", totalSalary.intValue()));
                logger.info("Updated salary in database for employee {}: {}", employee.get("ID"), totalSalary.intValue());
            } else {
                logger.warn("Could not find base salary for role ID: {}", roleId);
            }
        });
    }

    private void updateSalaryWithBonus(Map<String, Object> employee) {
        Object hireDateObj = employee.get("hireDate");
        String roleId = (String) employee.get("role_ID");
        if (hireDateObj == null || roleId == null) {
            logger.warn("Missing hireDate or role_ID for employee: {}", employee.get("ID"));
            return;
        }

        BigDecimal baseSalary = getBaseSalaryFromRole(roleId);
        if (baseSalary != null) {
            LocalDate hireDate = parseLocalDate(hireDateObj);
            LocalDate currentDate = LocalDate.now();
            long yearsOfService = ChronoUnit.YEARS.between(hireDate, currentDate);
            yearsOfService = Math.max(0, yearsOfService);
            BigDecimal bonus = BigDecimal.valueOf(yearsOfService * BONUS_PER_YEAR);
            BigDecimal totalSalary = baseSalary.add(bonus);
            employee.put("salary", totalSalary.intValue());
            logger.info("Updated salary for employee {}: {}", employee.get("ID"), totalSalary.intValue());
        } else {
            logger.warn("Could not find base salary for role ID: {}", roleId);
        }
    }

    private LocalDate parseLocalDate(Object dateObj) {
        if (dateObj instanceof LocalDate) {
            return (LocalDate) dateObj;
        } else {
            return LocalDate.parse(dateObj.toString());
        }
    }

    private BigDecimal getBaseSalaryFromRole(String roleId) {
        try {
            CqnSelect roleQuery = Select.from("EmployeeService.Roles")
                    .columns("baseSalary")
                    .where(r -> r.get("ID").eq(roleId));
            Result roleResult = db.run(roleQuery);
            Optional<Row> row = roleResult.first();
            if (row.isPresent()) {
                Object baseSalaryObj = row.get().get("baseSalary");
                if (baseSalaryObj != null) {
                    return new BigDecimal(baseSalaryObj.toString());
                }
            }
        } catch (Exception e) {
            logger.error("Error fetching base salary for role ID: {}", roleId, e);
        }
        return null;
    }
}