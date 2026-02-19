import type { LeadPriority, LeadSource, LeadStage } from '../types/lead.js';

export interface LeadModel {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  stage: LeadStage;
  priority: LeadPriority;
  source: LeadSource;
  owner_id: string | null;
  created_by: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}
