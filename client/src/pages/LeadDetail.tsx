import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetLeadByIdQuery, useUpdateLeadMutation, useDeleteLeadMutation, useGetAssignableUsersQuery, type Lead } from '../services/api';
import {
  HiOutlineExclamationCircle,
  HiOutlineArrowLeft,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineClipboardList
} from 'react-icons/hi';
import '../styles/LeadDetail.css';

export const LeadDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: lead, isLoading, error, refetch } = useGetLeadByIdQuery(id!);
  const { data: availableUsers = [] } = useGetAssignableUsersQuery();
  const [updateLead] = useUpdateLeadMutation();
  const [deleteLead] = useDeleteLeadMutation();

  const [activeTab, setActiveTab] = useState<'info'>('info');
  const [isEditing, setIsEditing] = useState(false);
  const [editedLead, setEditedLead] = useState<Partial<Lead>>({});
  const [notes, setNotes] = useState<string>('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const notesTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (lead) {
      setNotes(lead.notes || '');
    }
  }, [lead?.id]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedLead(lead || {});
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedLead({});
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);

    if (notesTimeoutRef.current) {
      clearTimeout(notesTimeoutRef.current);
    }
    notesTimeoutRef.current = setTimeout(async () => {
      if (!id) return;
      
      try {
        setIsSavingNotes(true);
        await updateLead({ leadId: id, updates: { notes: value } }).unwrap();
        toast.success('Notes saved', { duration: 1500 });
        refetch();
      } catch (error: any) {
        console.error('Failed to update notes:', error);
        toast.error('Failed to save notes. Please try again.');
      } finally {
        setIsSavingNotes(false);
      }
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (notesTimeoutRef.current) {
        clearTimeout(notesTimeoutRef.current);
      }
    };
  }, []);

  const handleSave = async () => {
    if (!id) return;
    
    try {
      await updateLead({ leadId: id, updates: editedLead }).unwrap();
      setIsEditing(false);
      toast.success('Lead updated');
      refetch();
    } catch (error: any) {
      console.error('Failed to update lead:', error);

      if (error?.status === 409 || error?.data?.error?.includes('already exists')) {
        toast.error(error?.data?.error || 'A lead with this company name already exists.');
      } else {
        toast.error('Failed to update lead. Please try again.');
      }
    }
  };

  const handleQuickUpdate = async (field: 'stage' | 'priority' | 'owner_id', value: string) => {
    if (!id) return;

    try {
      const updateObj: any = {};
      if (field === 'owner_id') {
        updateObj[field] = value || null;
      } else {
        updateObj[field] = value;
      }
      await updateLead({ leadId: id, updates: updateObj }).unwrap();
      toast.success('Lead updated');
      refetch();
    } catch (error: any) {
      console.error('Failed to update lead:', error);

      if (error?.status === 409 || error?.data?.error?.includes('already exists')) {
        toast.error(error?.data?.error || 'A lead with this company name already exists.');
      } else {
        toast.error('Failed to update lead. Please try again.');
      }
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    if (window.confirm(`Are you sure you want to delete lead "${lead?.company_name}"?`)) {
      try {
        await deleteLead(id).unwrap();
        toast.success('Lead deleted');
        navigate('/leads/list');
      } catch (error) {
        console.error('Failed to delete lead:', error);
        toast.error('Failed to delete lead. Please try again.');
      }
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStageColor = (stage?: string) => {
    switch (stage) {
      case 'new': return '#3b82f6';
      case 'in_discussion': return '#8b5cf6';
      case 'quoted': return '#f59e0b';
      case 'won': return '#10b981';
      case 'lost': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatStageLabel = (stage?: string) => {
    switch (stage) {
      case 'new': return 'New';
      case 'in_discussion': return 'In Discussion';
      case 'quoted': return 'Quoted';
      case 'won': return 'Won';
      case 'lost': return 'Lost';
      case 'qualified': return 'In Discussion';
      case 'in_progress': return 'Quoted';
      default: return stage ? stage.replace('_', ' ') : '-';
    }
  };

  if (isLoading) {
    return (
      <div className="lead-detail-container">
        <div className="loading-state">Loading lead details...</div>
      </div>
    );
  }

  if (error || !lead) {
    const errorMessage = error && 'data' in error
      ? (error.data as any)?.error || 'Failed to load lead'
      : 'Lead not found';

    return (
      <div className="lead-detail-container">
        <div className="error-state">
          <p><HiOutlineExclamationCircle className="inline-icon" /> {errorMessage}</p>
          <button onClick={() => navigate('/leads/list')} className="btn-back-error">
            <HiOutlineArrowLeft className="btn-icon" /> Back to List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lead-detail-container">
      <div className="detail-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate('/leads/list')}>
            <HiOutlineArrowLeft className="btn-icon" /> Back
          </button>
          <div className="header-info">
            <h1>{lead.company_name}</h1>
            <p className="subtitle">{lead.contact_name} • {lead.email}</p>
          </div>
        </div>
        <div className="header-actions">
          {!isEditing ? (
            <>
              <button className="btn-edit" onClick={handleEdit}>
                <HiOutlinePencil className="btn-icon" /> Edit
              </button>
              <button className="btn-delete" onClick={handleDelete}>
                <HiOutlineTrash className="btn-icon" /> Delete
              </button>
            </>
          ) : (
            <>
              <button className="btn-save" onClick={handleSave}>
                <HiOutlineCheck className="btn-icon" /> Save
              </button>
              <button className="btn-cancel" onClick={handleCancelEdit}>
                <HiOutlineX className="btn-icon" /> Cancel
              </button>
            </>
          )}
        </div>
      </div>

      <div className="lead-detail-content">
        <div className="lead-tabs-container">
          <div className="lead-tabs">
            <button
              className={`lead-tab ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => setActiveTab('info')}
            >
              <HiOutlineClipboardList className="tab-icon" /> Information
            </button>
          </div>

          <div className="lead-tab-content">
            {activeTab === 'info' && (
              <div className="lead-info-tab">
                <div className="info-section">
                  <h3>Contact Information</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Company Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedLead.company_name || ''}
                          onChange={(e) => setEditedLead({ ...editedLead, company_name: e.target.value })}
                          className="input-edit"
                        />
                      ) : (
                        <p>{lead.company_name}</p>
                      )}
                    </div>

                    <div className="info-item">
                      <label>Contact Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedLead.contact_name || ''}
                          onChange={(e) => setEditedLead({ ...editedLead, contact_name: e.target.value })}
                          className="input-edit"
                        />
                      ) : (
                        <p>{lead.contact_name}</p>
                      )}
                    </div>

                    <div className="info-item">
                      <label>Email</label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={editedLead.email || ''}
                          onChange={(e) => setEditedLead({ ...editedLead, email: e.target.value })}
                          className="input-edit"
                        />
                      ) : (
                        <p>{lead.email}</p>
                      )}
                    </div>

                    <div className="info-item">
                      <label>Phone</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={editedLead.phone || ''}
                          onChange={(e) => setEditedLead({ ...editedLead, phone: e.target.value })}
                          className="input-edit"
                        />
                      ) : (
                        <p>{lead.phone || '-'}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="info-section">
                  <h3>Lead Details</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Stage</label>
                      {isEditing ? (
                        <select
                          value={editedLead.stage || ''}
                          onChange={(e) => setEditedLead({ ...editedLead, stage: e.target.value })}
                          className="select-edit"
                        >
                          <option value="new">New</option>
                          <option value="in_discussion">In Discussion</option>
                          <option value="quoted">Quoted</option>
                          <option value="won">Won</option>
                          <option value="lost">Lost</option>
                        </select>
                      ) : (
                        <select
                          value={lead.stage || ''}
                          onChange={(e) => handleQuickUpdate('stage', e.target.value)}
                          className="select-edit"
                        >
                          <option value="new">New</option>
                          <option value="in_discussion">In Discussion</option>
                          <option value="quoted">Quoted</option>
                          <option value="won">Won</option>
                          <option value="lost">Lost</option>
                        </select>
                      )}
                    </div>

                    <div className="info-item">
                      <label>Priority</label>
                      {isEditing ? (
                        <select
                          value={editedLead.priority || ''}
                          onChange={(e) => setEditedLead({ ...editedLead, priority: e.target.value })}
                          className="select-edit"
                        >
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      ) : (
                        <select
                          value={lead.priority || ''}
                          onChange={(e) => handleQuickUpdate('priority', e.target.value)}
                          className="select-edit"
                        >
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      )}
                    </div>

                    <div className="info-item">
                      <label>Source</label>
                      {isEditing ? (
                        <select
                          value={editedLead.source || ''}
                          onChange={(e) => setEditedLead({ ...editedLead, source: e.target.value })}
                          className="select-edit"
                        >
                          <option value="web">Web</option>
                          <option value="referral">Referral</option>
                          <option value="campaign">Campaign</option>
                          <option value="manual">Manual</option>
                        </select>
                      ) : (
                        <p className="capitalize">{lead.source}</p>
                      )}
                    </div>

                    <div className="info-item">
                      <label>Owner</label>
                      {isEditing ? (
                        <select
                          value={editedLead.owner_id || ''}
                          onChange={(e) => setEditedLead({ ...editedLead, owner_id: e.target.value || undefined })}
                          className="select-edit"
                        >
                          <option value="">Unassigned</option>
                          {availableUsers?.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.full_name || user.email}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <select
                          value={lead.owner_id || ''}
                          onChange={(e) => handleQuickUpdate('owner_id', e.target.value)}
                          className="select-edit"
                        >
                          <option value="">Unassigned</option>
                          {availableUsers?.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.full_name || user.email}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>

                <div className="info-section">
                  <h3>Timeline</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Created At</label>
                      <p>{formatDate(lead.created_at)}</p>
                    </div>
                    <div className="info-item">
                      <label>Last Updated</label>
                      <p>{formatDate(lead.updated_at)}</p>
                    </div>
                  </div>
                </div>

                <div className="info-section notes-section">
                  <div className="notes-header">
                    <h3>Notes</h3>
                    {isSavingNotes && (
                      <span className="saving-indicator">Saving...</span>
                    )}
                  </div>

                  <div className="notes-edit-area">
                    <textarea
                      value={notes}
                      onChange={(e) => handleNotesChange(e.target.value)}
                      placeholder="Add notes about this lead..."
                      className="notes-textarea"
                    />
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDetail;
