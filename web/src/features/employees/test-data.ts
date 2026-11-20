import {
  bulkDeleteEmployeesSchema,
  COUNTRIES,
  isCountryCode,
  type Employee,
  type EmployeeFilterOptions,
  type EmployeeInput,
  type PaginatedResponse,
} from '@acme/shared';
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
 * A small in-memory fake of the employees API: lists (with search, country and paging, like the
 * real API), creates, updates and deletes. It records requests so tests can check what was sent.
 */
export function employeeApiHandlers(initialEmployees: Employee[]) {
  let employees = [...initialEmployees];
  const requests: URLSearchParams[] = [];
  const changes: { method: string; id?: number; ids?: number[]; body?: EmployeeInput }[] = [];

  const toEmployee = (id: number, employeeCode: string, input: EmployeeInput): Employee => ({
    ...input,
    id,
    employeeCode,
    currency: isCountryCode(input.country) ? COUNTRIES[input.country].currency : 'USD',
    annualSalaryUsd: input.annualSalary,
  });

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
    http.post('*/api/employees', async ({ request }) => {
      const body = (await request.json()) as EmployeeInput;
      changes.push({ method: 'POST', body });
      const id = Math.max(0, ...employees.map((e) => e.id)) + 1;
      const created = toEmployee(id, `EMP-${String(id).padStart(5, '0')}`, body);
      employees = [...employees, created];
      return HttpResponse.json(created, { status: 201 });
    }),
    http.put('*/api/employees/:id', async ({ request, params }) => {
      const id = Number(params.id);
      const body = (await request.json()) as EmployeeInput;
      changes.push({ method: 'PUT', id, body });
      const existingCode = employees.find((employee) => employee.id === id)?.employeeCode ?? '';
      const updated = toEmployee(id, existingCode, body);
      employees = employees.map((employee) => (employee.id === id ? updated : employee));
      return HttpResponse.json(updated);
    }),
    http.delete('*/api/employees/:id', ({ params }) => {
      const id = Number(params.id);
      changes.push({ method: 'DELETE', id });
      employees = employees.filter((employee) => employee.id !== id);
      return new HttpResponse(null, { status: 204 });
    }),
    http.post('*/api/employees/bulk-delete', async ({ request }) => {
      const { ids } = bulkDeleteEmployeesSchema.parse(await request.json());
      changes.push({ method: 'BULK_DELETE', ids });
      const before = employees.length;
      employees = employees.filter((employee) => !ids.includes(employee.id));
      return HttpResponse.json({ deletedCount: before - employees.length });
    }),
  ];

  return { handlers, requests, changes };
}
