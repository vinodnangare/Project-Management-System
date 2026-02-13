import React from 'react';
import '../styles/components/LeadTable.css';

interface Lead {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  source: string;
  stage: string;
  priority: string;
  owner_name?: string;
  created_at: string;
}

interface LeadTableProps {
  leads: Lead[];
  selectedLeads?: Set<string>;
  onSelectLead?: (leadId: string) => void;
  onSelectAll?: (checked: boolean) => void;
  onRowClick?: (leadId: string) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: string) => void;
}

const LeadTable: React.FC<LeadTableProps> = ({
  leads,
  selectedLeads = new Set(),
  onSelectLead,
  onSelectAll,
  onRowClick,
  sortBy,
  sortOrder,
  onSort,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'new': return '#3b82f6';
      case 'in_discussion': return '#8b5cf6';
      case 'quoted': return '#f59e0b';
      case 'won': return '#10b981';
      case 'lost': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatStageLabel = (stage: string) => {
    switch (stage) {
      case 'new': return 'New';
      case 'in_discussion': return 'In Discussion';
      case 'quoted': return 'Quoted';
      case 'won': return 'Won';
      case 'lost': return 'Lost';
      case 'qualified': return 'In Discussion';
      case 'in_progress': return 'Quoted';
      default: return stage.replace('_', ' ');
    }
  };

  const renderSortIcon = (column: string) => {
    if (sortBy !== column) return '⇅';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const allSelected = leads.length > 0 && leads.every(lead => selectedLeads.has(lead.id));

  return (
    <div className="lead-table-container">
      <table className="lead-table">
        <thead>
          <tr>
            {onSelectAll && (
              <th className="checkbox-cell">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                />
              </th>
            )}
            <th onClick={() => onSort?.('company_name')} className="sortable">
              Company {renderSortIcon('company_name')}
            </th>
            <th onClick={() => onSort?.('contact_name')} className="sortable">
              Contact {renderSortIcon('contact_name')}
            </th>
            <th onClick={() => onSort?.('email')} className="sortable">
              Email {renderSortIcon('email')}
            </th>
            <th>Phone</th>
            <th onClick={() => onSort?.('source')} className="sortable">
              Source {renderSortIcon('source')}
            </th>
            <th onClick={() => onSort?.('stage')} className="sortable">
              Stage {renderSortIcon('stage')}
            </th>
            <th onClick={() => onSort?.('priority')} className="sortable">
              Priority {renderSortIcon('priority')}
            </th>
            <th>Owner</th>
            <th onClick={() => onSort?.('created_at')} className="sortable">
              Created {renderSortIcon('created_at')}
            </th>
          </tr>
        </thead>
        <tbody>
          {leads.length === 0 ? (
            <tr>
              <td colSpan={10} className="empty-state">
                No leads found
              </td>
            </tr>
          ) : (
            leads.map((lead) => (
              <tr
                key={lead.id}
                className={`lead-row ${selectedLeads.has(lead.id) ? 'selected' : ''}`}
                onClick={() => onRowClick?.(lead.id)}
              >
                {onSelectLead && (
                  <td className="checkbox-cell" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedLeads.has(lead.id)}
                      onChange={() => onSelectLead(lead.id)}
                    />
                  </td>
                )}
                <td className="company-cell">{lead.company_name}</td>
                <td>{lead.contact_name}</td>
                <td className="email-cell">{lead.email}</td>
                <td>{lead.phone || '-'}</td>
                <td className="capitalize">{lead.source}</td>
                <td>
                  <span
                    className="badge"
                    style={{ backgroundColor: getStageColor(lead.stage) }}
                  >
                    {formatStageLabel(lead.stage)}
                  </span>
                </td>
                <td>
                  <span
                    className="badge"
                    style={{ backgroundColor: getPriorityColor(lead.priority) }}
                  >
                    {lead.priority}
                  </span>
                </td>
                <td>{lead.owner_name || 'Unassigned'}</td>
                <td>{formatDate(lead.created_at)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default LeadTable;