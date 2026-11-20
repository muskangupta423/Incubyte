import type { Employee, EmployeeFilterOptions, PaginatedResponse } from '@acme/shared';
import { http, HttpResponse } from 'msw';

export function makeEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: 1,
    employeeCode: 'EMP-00001',
    fullName: 'Asha Rao',
    email: 'asha.rao@acme.test',
    jobTitle: 'Software Engineer',
    department: 'Engineering',
    country: 'IN',
    currency: 'INR',
    annualSalary: 2_500_000,
    annualSalaryUsd: 28_500,
    hireDate: '2022-04-01',
    ...overrides,
  };
}

/** `count` employees named "Employee 1", "Employee 2", … */
export function makeEmployees(count: number): Employee[] {
  return Array.from({ length: count }, (_, index) =>
    makeEmployee({
      id: index + 1,
      employeeCode: `EMP-${String(index + 1).padStart(5, '0')}`,
      fullName: `Employee ${index + 1}`,
      email: `employee${index + 1}@acme.test`,
    }),
  );
}

const filterOptions: EmployeeFilterOptions = {
  departments: ['Engineering', 'Sales'],
  jobTitles: ['Account Executive', 'Software Engineer'],
};

/**
 * A small fake of GET /api/employees: applies search, country and paging to `employees`
 * (like the real API) and records every request so tests can check what was asked for.
 */
export function employeeApiHandlers(employees: Employee[]) {
  const requests: URLSearchParams[] = [];

  const handlers = [
    http.get('*/api/employees/filter-options', () => HttpResponse.json(filterOptions)),
    http.get('*/api/employees', ({ request }) => {
      const params = new URL(request.url).searchParams;
      requests.push(params);

      const search = params.get('search')?.toLowerCase();
      const country = params.get('country');
      const page = Number(params.get('page') ?? 1);
      const pageSize = Number(params.get('pageSize') ?? 25);
      const matching = employees.filter(
        (employee) =>
          (!search || employee.fullName.toLowerCase().includes(search)) &&
          (!country || employee.country === country),
      );

      const body: PaginatedResponse<Employee> = {
        items: matching.slice((page - 1) * pageSize, page * pageSize),
        page,
        pageSize,
        totalItems: matching.length,
        totalPages: Math.ceil(matching.length / pageSize),
      };
      return HttpResponse.json(body);
    }),
  ];

  return { handlers, requests };
}
