import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGetLeadsQuery, useCreateLeadMutation, useDeleteLeadMutation, useGetLeadOwnersQuery, useUpdateLeadStageMutation, useUpdateLeadMutation, type Lead } from '../services/api';
import BulkActions from '../components/BulkActions';
import LeadForm from '../components/LeadForm';
import '../styles/LeadList.css';

export const LeadList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [showAssignPanel, setShowAssignPanel] = useState(false);
  const [selectedOwnerId, setSelectedOwnerId] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('new') === '1') {
      setShowLeadForm(true);
    }
  }, [location.search]);

  const { data: leadsData, isLoading, error, refetch } = useGetLeadsQuery({
    page,
    limit,
    stage: stageFilter,
    source: sourceFilter,
  });

  const { data: leadOwners = [] } = useGetLeadOwnersQuery();
  const [createLead, { isLoading: isCreatingLead }] = useCreateLeadMutation();
  const [deleteLead] = useDeleteLeadMutation();
  const [updateLeadStage] = useUpdateLeadStageMutation();
  const [updateLead] = useUpdateLeadMutation();

  const leads = leadsData?.leads || [];
  const totalLeads = leadsData?.meta?.total || 0;
  const totalPages = Math.ceil(totalLeads / limit);

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = searchTerm
      ? lead.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    const matchesStage = stageFilter ? lead.stage === stageFilter : true;
    const matchesSource = sourceFilter ? lead.source === sourceFilter : true;
    const matchesPriority = priorityFilter ? lead.priority === priorityFilter : true;

    return matchesSearch && matchesStage && matchesSource && matchesPriority;
  });

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    let aVal: any = a[sortBy as keyof Lead];
    let bVal: any = b[sortBy as keyof Lead];

    if (sortBy === 'created_at') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }

    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleSelectLead = (leadId: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedLeads.size === sortedLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(sortedLeads.map(lead => lead.id)));
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStageFilter('');
    setSourceFilter('');
    setPriorityFilter('');
    setPage(1);
  };

  const handleClearSelection = () => {
    setSelectedLeads(new Set());
    setShowAssignPanel(false);
    setSelectedOwnerId('');
  };

  const handleCreateLead = async (formData: any) => {
    try {
      await createLead(formData).unwrap();
      setShowLeadForm(false);
      toast.success('Lead created successfully');
      refetch();
    } catch (error: any) {
      console.error('Failed to create lead:', error);
      
      if (error?.status === 409 || error?.data?.error?.includes('already exists')) {
        toast.error(error?.data?.error || 'A lead with this company name already exists.');
      } else {
        toast.error('Failed to create lead. Please try again.');
      }
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await deleteLead(leadId).unwrap();
        toast.success('Lead deleted successfully');
        refetch();
      } catch (error) {
        console.error('Failed to delete lead:', error);
        toast.error('Failed to delete lead. Please try again.');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLeads.size === 0) return;
    if (!window.confirm(`Delete ${selectedLeads.size} selected lead(s)?`)) return;

    try {
      await Promise.all(
        Array.from(selectedLeads).map((leadId) => deleteLead(leadId).unwrap())
      );
      toast.success('Selected leads deleted');
      handleClearSelection();
      refetch();
    } catch (error) {
      console.error('Failed to delete leads:', error);
      toast.error('Failed to delete selected leads. Please try again.');
    }
  };

  const handleBulkStageChange = async (stage: string) => {
    if (selectedLeads.size === 0) return;

    try {
      await Promise.all(
        Array.from(selectedLeads).map((leadId) => updateLeadStage({ leadId, stage }).unwrap())
      );
      toast.success('Lead stages updated');
      handleClearSelection();
      refetch();
    } catch (error) {
      console.error('Failed to update lead stages:', error);
      toast.error('Failed to update lead stages. Please try again.');
    }
  };

  const handleBulkPriorityChange = async (priority: string) => {
    if (selectedLeads.size === 0) return;

    try {
      await Promise.all(
        Array.from(selectedLeads).map((leadId) => updateLead({ leadId, updates: { priority } }).unwrap())
      );
      toast.success('Lead priorities updated');
      handleClearSelection();
      refetch();
    } catch (error) {
      console.error('Failed to update lead priorities:', error);
      toast.error('Failed to update lead priorities. Please try again.');
    }
  };

  const handleOpenAssign = () => {
    setShowAssignPanel(true);
  };

  const handleAssignOwner = async () => {
    if (!selectedOwnerId || selectedLeads.size === 0) return;

    try {
      await Promise.all(
        Array.from(selectedLeads).map((leadId) => updateLead({ leadId, updates: { owner_id: selectedOwnerId } }).unwrap())
      );
      toast.success('Owner assigned to selected leads');
      handleClearSelection();
      refetch();
    } catch (error) {
      console.error('Failed to assign owner:', error);
      toast.error('Failed to assign owner. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
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

  if (isLoading) {
    return (
      <div className="lead-list-container">
        <div className="loading-state">Loading leads...</div>
      </div>
    );
  }

  if (error) {
    const errorMessage = 'data' in error
      ? (error.data as any)?.error || 'Failed to load leads'
      : 'Failed to load leads';

    return (
      <div className="lead-list-container">
        <div className="error-state">⚠️ {errorMessage}</div>
      </div>
    );
  }

  return (
    <div className="lead-list-container">
      <div className="list-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate('/leads')}>
            ← Back
          </button>
          <h1>All Leads</h1>
        </div>
        <div className="header-actions">
          <button className="btn-add-lead" onClick={() => setShowLeadForm(true)}>
            ➕ Add Lead
          </button>
          <button className="btn-refresh" onClick={() => refetch()}>
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="lead-filters-section">
        <div className="lead-search-box">
          <input
            type="text"
            placeholder="🔍 Search by name, email, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="lead-search-input"
          />
        </div>

        <div className="lead-filters-row">
          <select
            value={stageFilter}
            onChange={(e) => { setStageFilter(e.target.value); setPage(1); }}
            className="lead-filter-select"
          >
            <option value="">All Stages</option>
            <option value="new">New</option>
            <option value="in_discussion">In Discussion</option>
            <option value="quoted">Quoted</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
            className="lead-filter-select"
          >
            <option value="">All Sources</option>
            <option value="web">Web</option>
            <option value="referral">Referral</option>
            <option value="campaign">Campaign</option>
            <option value="manual">Manual</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="lead-filter-select"
          >
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <button onClick={handleClearFilters} className="lead-btn-clear-filters">
            Clear Filters
          </button>
        </div>
      </div>

      <BulkActions
        selectedCount={selectedLeads.size}
        onAssign={handleOpenAssign}
        onChangeStage={handleBulkStageChange}
        onChangePriority={handleBulkPriorityChange}
        onDelete={handleBulkDelete}
        onClearSelection={handleClearSelection}
      />

      {showAssignPanel && selectedLeads.size > 0 && (
        <div className="bulk-assign-panel">
          <div className="bulk-assign-content">
            <span className="bulk-assign-label">Assign owner:</span>
            <select
              value={selectedOwnerId}
              onChange={(e) => setSelectedOwnerId(e.target.value)}
              className="bulk-assign-select"
            >
              <option value="">Select owner</option>
              {leadOwners.map((owner: any) => (
                <option key={owner.id} value={owner.id}>
                  {owner.full_name || owner.email}
                </option>
              ))}
            </select>
            <button
              className="btn-bulk"
              onClick={handleAssignOwner}
              disabled={!selectedOwnerId}
            >
              Assign
            </button>
            <button
              className="btn-bulk"
              onClick={() => {
                setShowAssignPanel(false);
                setSelectedOwnerId('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="table-wrapper">
        <table className="leads-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedLeads.size === sortedLeads.length && sortedLeads.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th onClick={() => handleSort('company_name')} className="sortable">
                Company {sortBy === 'company_name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('contact_name')} className="sortable">
                Contact {sortBy === 'contact_name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>Email</th>
              <th>Phone</th>
              <th>Stage</th>
              <th>Priority</th>
              <th>Source</th>
              <th>Owner</th>
              <th onClick={() => handleSort('created_at')} className="sortable">
                Created {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedLeads.length === 0 ? (
              <tr>
                <td colSpan={11} className="no-data">
                  No leads found. Try adjusting your filters.
                </td>
              </tr>
            ) : (
              sortedLeads.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => navigate(`/leads/${lead.id}`)}
                  className="table-row"
                >
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedLeads.has(lead.id)}
                      onChange={() => handleSelectLead(lead.id)}
                    />
                  </td>
                  <td className="company-cell">{lead.company_name}</td>
                  <td>{lead.contact_name}</td>
                  <td className="email-cell">{lead.email}</td>
                  <td>{lead.phone || '-'}</td>
                  <td>
                    <span
                      className="stage-badge"
                      style={{ backgroundColor: getStageColor(lead.stage) }}
                    >
                      {formatStageLabel(lead.stage)}
                    </span>
                  </td>
                  <td>
                    <span
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(lead.priority) }}
                    >
                      {lead.priority}
                    </span>
                  </td>
                  <td className="source-cell">{lead.source}</td>
                  <td>{lead.owner_name || '-'}</td>
                  <td>{formatDate(lead.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <div className="pagination-info">
          Showing {sortedLeads.length} of {totalLeads} leads
        </div>
        <div className="pagination-controls">
          <select
            value={limit}
            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
            className="limit-select"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
          
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="btn-page"
          >
            Previous
          </button>
          
          <span className="page-info">
            Page {page} of {totalPages}
          </span>
          
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="btn-page"
          >
            Next
          </button>
        </div>
      </div>

      {showLeadForm && (
        <LeadForm
          mode="create"
          onSubmit={handleCreateLead}
          onCancel={() => setShowLeadForm(false)}
          isLoading={isCreatingLead}
        />
      )}
    </div>
  );
};

export default LeadList;
