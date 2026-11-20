import { MAX_BULK_DELETE, type Employee } from '@acme/shared';
import { useState } from 'react';

const NOTHING_SELECTED: ReadonlyMap<number, Employee> = new Map();

/**
 * Which employees are ticked. Ticks stay while paging, sorting, searching and filtering, so HR can
 * collect people from anywhere in the list (search "Priya", tick; search "John", tick; delete both).
 * They go when cleared, after deleting, or when leaving the page.
 *
 * Whole employees are kept (not just ids), so the confirmation can name people who are not on screen.
 */
export function useRowSelection() {
  const [selected, setSelectedMap] = useState(NOTHING_SELECTED);

  /**
   * Ticks or unticks these employees. Returns false (and changes nothing) if ticking them would go
   * over the most one delete can handle.
   */
  function setSelected(employees: readonly Employee[], isSelected: boolean): boolean {
    const next = new Map(selected);
    for (const employee of employees) {
      if (isSelected) next.set(employee.id, employee);
      else next.delete(employee.id);
    }
    if (next.size > MAX_BULK_DELETE) return false;
    setSelectedMap(next);
    return true;
  }

  return {
    /** For "is this row ticked?" checks. */
    isSelected: (id: number) => selected.has(id),
    /** Every ticked employee, on screen or not, in the order they were ticked. */
    selectedEmployees: [...selected.values()],
    setSelected,
    clear: () => setSelectedMap(NOTHING_SELECTED),
  };
}

export type RowSelection = ReturnType<typeof useRowSelection>;
