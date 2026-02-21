export interface FilterOptions {
  stage?: string;
  source?: string;
  priority?: string;
  owner?: string;
}

export interface LeadFiltersProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  onReset: () => void;
}
