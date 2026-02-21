import React from 'react';
import '../styles/components/LeadFilters.css';
import type { FilterOptions, LeadFiltersProps } from '../types/components/LeadFiltersProps';

const LeadFilters: React.FC<LeadFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  const handleChange = (key: keyof FilterOptions, value: string) => {
    onFilterChange({
      ...filters,
      [key]: value === 'all' ? undefined : value,
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '');

  return (
    <div className="lead-filters">
      <div className="filters-row">
        <div className="filter-group">
          <label htmlFor="stage-filter">Stage</label>
          <select
            id="stage-filter"
            value={filters.stage || 'all'}
            onChange={(e) => handleChange('stage', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Stages</option>
            <option value="new">New</option>
            <option value="in_discussion">In Discussion</option>
            <option value="quoted">Quoted</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="source-filter">Source</label>
          <select
            id="source-filter"
            value={filters.source || 'all'}
            onChange={(e) => handleChange('source', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Sources</option>
            <option value="web">Web</option>
            <option value="referral">Referral</option>
            <option value="campaign">Campaign</option>
            <option value="manual">Manual</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="priority-filter">Priority</label>
          <select
            id="priority-filter"
            value={filters.priority || 'all'}
            onChange={(e) => handleChange('priority', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="btn-reset-filters"
          >
            ✕ Clear Filters
          </button>
        )}
      </div>
    </div>
  );
};

export default LeadFilters;