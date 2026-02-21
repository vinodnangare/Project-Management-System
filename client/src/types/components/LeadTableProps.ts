import type { Lead } from './Lead';

export interface LeadTableProps {
  leads: Lead[];
  selectedLeads?: Set<string>;
  onSelectLead?: (leadId: string) => void;
  onSelectAll?: (checked: boolean) => void;
  onRowClick?: (leadId: string) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: string) => void;
}
