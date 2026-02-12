import { useState, useCallback } from 'react';

export interface FilterOptions {
  stage?: string;
  source?: string;
  priority?: string;
  owner?: string;
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
}

/**
 * Custom hook for managing filter state
 * Provides utilities for setting, clearing, and checking active filters
 */
export const useFilters = (initialFilters: FilterOptions = {}) => {
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);

  // Set a single filter
  const setFilter = useCallback((key: keyof FilterOptions, value: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === 'all' || value === '' ? undefined : value,
    }));
  }, []);

  // Set multiple filters at once
  const setMultipleFilters = useCallback((newFilters: Partial<FilterOptions>) => {
    setFilters((prev) => ({
      ...prev,
      ...Object.fromEntries(
        Object.entries(newFilters).map(([key, value]) => [
          key,
          value === 'all' || value === '' ? undefined : value,
        ])
      ),
    }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Clear a specific filter
  const clearFilter = useCallback((key: keyof FilterOptions) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined && value !== ''
  );

  // Get active filter count
  const activeFilterCount = Object.values(filters).filter(
    (value) => value !== undefined && value !== ''
  ).length;

  // Get cleaned filters (removes undefined/empty values)
  const cleanedFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
  ) as FilterOptions;

  return {
    filters,
    cleanedFilters,
    setFilter,
    setMultipleFilters,
    clearFilters,
    clearFilter,
    hasActiveFilters,
    activeFilterCount,
  };
};

export default useFilters;
