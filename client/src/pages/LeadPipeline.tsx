import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useGetLeadsQuery, useUpdateLeadStageMutation, type Lead } from '../services/api';
import '../styles/LeadPipeline.css';

interface StageColumn {
  name: string;
  value: string;
  color: string;
  icon: string;
}

const stages: StageColumn[] = [
  { name: 'New', value: 'new', color: '#3b82f6', icon: '🆕' },
  { name: 'In Discussion', value: 'in_discussion', color: '#8b5cf6', icon: '💬' },
  { name: 'Quoted', value: 'quoted', color: '#f59e0b', icon: '🧾' },
  { name: 'Won', value: 'won', color: '#10b981', icon: '✅' },
  { name: 'Lost', value: 'lost', color: '#ef4444', icon: '❌' }
];

export const LeadPipeline: React.FC = () => {
  const navigate = useNavigate();
  const { data: leadsData, isLoading, error, refetch } = useGetLeadsQuery({ page: 1, limit: 100 });
  const [updateLeadStage] = useUpdateLeadStageMutation();
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);

  const leads = leadsData?.leads || [];

  const getLeadsByStage = (stageValue: string): Lead[] => {
    return leads.filter((lead) => lead.stage === stageValue);
  };

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedLead(null);
    setHoveredStage(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (stageValue: string) => {
    setHoveredStage(stageValue);
  };

  const handleDragLeave = () => {
    setHoveredStage(null);
  };

  const handleDrop = async (e: React.DragEvent, newStage: string) => {
    e.preventDefault();
    setHoveredStage(null);

    if (!draggedLead || draggedLead.stage === newStage) {
      setDraggedLead(null);
      return;
    }

    try {
      await updateLeadStage({
        leadId: draggedLead.id,
        stage: newStage
      }).unwrap();
      toast.success('Lead stage updated');
      refetch();
    } catch (error) {
      console.error('Failed to update lead stage:', error);
      toast.error('Failed to update lead stage');
    }

    setDraggedLead(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = today.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="pipeline-container">
        <div className="loading-state">
          <p>Loading pipeline...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage = 'data' in error
      ? (error.data as any)?.error || 'Failed to load leads'
      : 'Failed to load leads';

    return (
      <div className="pipeline-container">
        <div className="error-state">
          <p>⚠️ {errorMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pipeline-container">
      <div className="pipeline-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate('/leads')}>
            ← Back
          </button>
          <h1>Lead Pipeline</h1>
        </div>
        <div className="pipeline-stats">
          <span className="stat-item">
            Total: <strong>{leads.length}</strong>
          </span>
          <button className="btn-refresh" onClick={() => refetch()}>
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="pipeline-board">
        {stages.map((stage) => {
          const stageLeads = getLeadsByStage(stage.value);
          const isHovered = hoveredStage === stage.value;

          return (
            <div
              key={stage.value}
              className={`pipeline-column ${isHovered ? 'drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragEnter={() => handleDragEnter(stage.value)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.value)}
            >
              <div className="column-header" style={{ borderTopColor: stage.color }}>
                <div className="header-title">
                  <span className="stage-icon">{stage.icon}</span>
                  <h3>{stage.name}</h3>
                </div>
                <span className="lead-count" style={{ backgroundColor: stage.color }}>
                  {stageLeads.length}
                </span>
              </div>

              <div className="column-content">
                {stageLeads.length === 0 ? (
                  <div className="empty-column">
                    <p>No leads</p>
                  </div>
                ) : (
                  stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className={`lead-card ${draggedLead?.id === lead.id ? 'dragging' : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="card-header">
                        <h4 className="company-name">{lead.company_name}</h4>
                        <div
                          className="priority-badge"
                          style={{ backgroundColor: getPriorityColor(lead.priority) }}
                        >
                          {lead.priority || 'Medium'}
                        </div>
                      </div>

                      <div className="card-body">
                        <div className="contact-info">
                          <p className="contact-name">👤 {lead.contact_name}</p>
                          <p className="contact-email">📧 {lead.email}</p>
                          {lead.phone && <p className="contact-phone">📞 {lead.phone}</p>}
                        </div>

                        <div className="card-meta">
                          <span className="source-tag">
                            {lead.source === 'web' && '🌐'}
                            {lead.source === 'referral' && '🤝'}
                            {lead.source === 'campaign' && '📢'}
                            {lead.source === 'manual' && '✍️'}
                            {' '}{lead.source}
                          </span>
                        </div>
                      </div>

                      <div className="card-footer">
                        {lead.owner_name && (
                          <span className="owner">👤 {lead.owner_name}</span>
                        )}
                        <span className="created-date">{formatDate(lead.created_at)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LeadPipeline;
