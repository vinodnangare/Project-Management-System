import React, { useState } from 'react';
import { 
  useGetLeadStagesQuery, 
  useCreateLeadStageMutation, 
  useUpdateLeadStageDefMutation, 
  useDeleteLeadStageDefMutation 
} from '../services/api';
import type { LeadStageDef } from '../services/api';
import { toast } from 'react-hot-toast';
import { HiPlus, HiPencil, HiTrash, HiCheck, HiX } from 'react-icons/hi';
import '../styles/LeadStagesSettings.css';

const LeadStagesSettings: React.FC = () => {
  const { data: stages = [], isLoading } = useGetLeadStagesQuery();
  const [createStage] = useCreateLeadStageMutation();
  const [updateStage] = useUpdateLeadStageDefMutation();
  const [deleteStage] = useDeleteLeadStageDefMutation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<LeadStageDef>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', sequence: stages.length + 1, color: '#3B82F6' });

  const handleEditClick = (stage: LeadStageDef) => {
    setEditingId(stage._id);
    setEditForm(stage);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      await updateStage({ id: editingId, updates: editForm }).unwrap();
      toast.success('Stage updated successfully');
      setEditingId(null);
    } catch (err: any) {
      toast.error(err.data?.error || 'Failed to update stage');
    }
  };

  const handleDelete = async (stage: LeadStageDef) => {
    if (stage.isDefault) {
      toast.error('Cannot delete default stages');
      return;
    }
    if (window.confirm('Are you sure you want to delete this stage? Existing leads in this stage might stop showing in filters. Please ensure no leads are using this stage.')) {
      try {
        await deleteStage(stage._id).unwrap();
        toast.success('Stage deleted');
      } catch (err: any) {
        toast.error(err.data?.error || 'Failed to delete stage');
      }
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.name.trim()) return toast.error('Name is required');
    try {
      await createStage(newForm).unwrap();
      toast.success('Stage created successfully');
      setIsAdding(false);
      setNewForm({ name: '', sequence: stages.length + 2, color: '#3B82F6' });
    } catch (err: any) {
      toast.error(err.data?.error || 'Failed to create stage');
    }
  };

  return (
    <div className="lead-stages-page">
      <main className="lead-stages-main">
        <header className="lead-stages-hero">
          <div className="lead-stages-title">
            <p className="lead-stages-kicker">Settings</p>
            <h1>Lead Stages</h1>
            <p className="lead-stages-subtitle">Define the pipeline flow, order, and color system used across lead boards.</p>
          </div>
          <button
            onClick={() => {
              setIsAdding(true);
              setNewForm({ ...newForm, sequence: stages.length + 1 });
            }}
            className="lead-stages-add-btn"
          >
            <HiPlus className="lead-stages-add-icon" />
            Add Stage
          </button>
        </header>

        <section className="lead-stages-panel">
          <div className="lead-stages-table-wrap">
            <table className="lead-stages-table">
              <thead>
                <tr>
                  <th>Sequence</th>
                  <th>Name (Identifier)</th>
                  <th>Color</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="lead-stages-loading">Loading...</td>
                  </tr>
                ) : (
                  <>
                    {stages.map((stage) => (
                      <tr key={stage._id}>
                        {editingId === stage._id ? (
                          <>
                            <td>
                              <input
                                type="number"
                                value={editForm.sequence || ''}
                                onChange={(e) => setEditForm({...editForm, sequence: parseInt(e.target.value)})}
                                className="lead-stages-input lead-stages-input-sm"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={editForm.name || ''}
                                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                className="lead-stages-input"
                              />
                            </td>
                            <td>
                              <input
                                type="color"
                                value={editForm.color || '#000000'}
                                onChange={(e) => setEditForm({...editForm, color: e.target.value})}
                                className="lead-stages-color"
                              />
                            </td>
                            <td>
                              <div className="lead-stages-actions">
                                <button onClick={handleSaveEdit} className="lead-stages-action-btn success">
                                  <HiCheck className="lead-stages-action-icon" />
                                </button>
                                <button onClick={handleCancelEdit} className="lead-stages-action-btn">
                                  <HiX className="lead-stages-action-icon" />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="lead-stages-seq">{stage.sequence}</td>
                            <td>
                              <div className="lead-stages-name">
                                <span>{stage.name}</span>
                                {stage.isDefault && (
                                  <span className="lead-stages-pill">Default</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className="lead-stages-color-wrap">
                                <span className="lead-stages-color-dot" style={{ backgroundColor: stage.color }}></span>
                                <span className="lead-stages-color-text">{stage.color}</span>
                              </div>
                            </td>
                            <td>
                              <div className="lead-stages-actions">
                                <button onClick={() => handleEditClick(stage)} className="lead-stages-action-btn primary">
                                  <HiPencil className="lead-stages-action-icon" />
                                </button>
                                {!stage.isDefault && (
                                  <button onClick={() => handleDelete(stage)} className="lead-stages-action-btn danger">
                                    <HiTrash className="lead-stages-action-icon" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                    {isAdding && (
                      <tr className="lead-stages-add-row">
                        <td>
                          <input
                            type="number"
                            value={newForm.sequence}
                            onChange={(e) => setNewForm({...newForm, sequence: parseInt(e.target.value)})}
                            className="lead-stages-input lead-stages-input-sm"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            placeholder="Stage name (e.g. 'new', 'demo_done')"
                            value={newForm.name}
                            onChange={(e) => setNewForm({...newForm, name: e.target.value})}
                            className="lead-stages-input"
                          />
                        </td>
                        <td>
                          <input
                            type="color"
                            value={newForm.color}
                            onChange={(e) => setNewForm({...newForm, color: e.target.value})}
                            className="lead-stages-color"
                          />
                        </td>
                        <td>
                          <div className="lead-stages-actions">
                            <button onClick={handleAddSubmit} className="lead-stages-text-btn success">
                              Save
                            </button>
                            <button onClick={() => setIsAdding(false)} className="lead-stages-text-btn">
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LeadStagesSettings;
