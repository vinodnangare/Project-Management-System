import React, { useState, useEffect } from 'react';
import { useGetLeadOwnersQuery } from '../services/api';
import '../styles/components/LeadForm.css';

interface LeadFormData {
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  source: string;
  stage: string;
  priority: string;
  owner_id?: string;
}

interface LeadFormProps {
  initialData?: Partial<LeadFormData>;
  onSubmit: (data: LeadFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  mode?: 'create' | 'edit';
}

const LeadForm: React.FC<LeadFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  mode = 'create',
}) => {
  const { data: owners = [], isLoading: ownersLoading } = useGetLeadOwnersQuery();
  const [formData, setFormData] = useState<LeadFormData>({
    company_name: initialData?.company_name || '',
    contact_name: initialData?.contact_name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    source: initialData?.source || 'web',
    stage: initialData?.stage || 'new',
    priority: initialData?.priority || 'medium',
    owner_id: initialData?.owner_id || undefined,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof LeadFormData, string>>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        company_name: initialData.company_name || '',
        contact_name: initialData.contact_name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        source: initialData.source || 'web',
        stage: initialData.stage || 'new',
        priority: initialData.priority || 'medium',
        owner_id: initialData.owner_id || undefined,
      });
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof LeadFormData, string>> = {};

    if (!formData.company_name.trim()) {
      newErrors.company_name = 'Company name is required';
    }

    if (!formData.contact_name.trim()) {
      newErrors.contact_name = 'Contact name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof LeadFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="lead-form-overlay">
     <div className="lead-form-container">
        <div className="form-header">
          <h2>{mode === 'create' ? 'Create New Lead' : 'Edit Lead'}</h2>
          <button className="btn-close" onClick={onCancel} type="button">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="lead-form">
          <div className="form-section">
            <h3>Company Information</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="company_name">
                  Company Name <span className="required">*</span>
                </label>
                <input
                  id="company_name"
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  placeholder="Enter company name"
                  className={errors.company_name ? 'error' : ''}
                />
                {errors.company_name && (
                  <span className="error-message">{errors.company_name}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="contact_name">
                  Contact Name <span className="required">*</span>
                </label>
                <input
                  id="contact_name"
                  type="text"
                  value={formData.contact_name}
                  onChange={(e) => handleChange('contact_name', e.target.value)}
                  placeholder="Enter contact person name"
                  className={errors.contact_name ? 'error' : ''}
                />
                {errors.contact_name && (
                  <span className="error-message">{errors.contact_name}</span>
                )}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Contact Details</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">
                  Email <span className="required">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="contact@company.com"
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && (
                  <span className="error-message">{errors.email}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Lead Details</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="source">Source</label>
                <select
                  id="source"
                  value={formData.source}
                  onChange={(e) => handleChange('source', e.target.value)}
                >
                  <option value="web">Web</option>
                  <option value="referral">Referral</option>
                  <option value="campaign">Campaign</option>
                  <option value="manual">Manual</option>
                </select>
                <span className="form-hint">Where the lead came from.</span>
              </div>

              <div className="form-group">
                <label htmlFor="stage">Stage</label>
                <select
                  id="stage"
                  value={formData.stage}
                  onChange={(e) => handleChange('stage', e.target.value)}
                >
                  <option value="new">New</option>
                  <option value="in_discussion">In Discussion</option>
                  <option value="quoted">Quoted</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
                <span className="form-hint">Current pipeline stage.</span>
              </div>

              <div className="form-group">
                <label htmlFor="priority">Priority</label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <span className="form-hint">Sales urgency level.</span>
              </div>

              <div className="form-group">
                <label htmlFor="owner_id">Owner</label>
                <select
                  id="owner_id"
                  value={formData.owner_id || ''}
                  onChange={(e) => handleChange('owner_id', e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {ownersLoading && <option value="">Loading owners...</option>}
                  {!ownersLoading && owners.map((owner: any) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.full_name || owner.email}
                    </option>
                  ))}
                </select>
                <span className="form-hint">Who owns this lead.</span>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onCancel}
              className="btn-cancel"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : mode === 'create' ? 'Create Lead' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeadForm;