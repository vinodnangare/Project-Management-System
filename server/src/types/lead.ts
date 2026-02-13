export enum LeadStage {
  NEW = 'new',
  IN_DISCUSSION = 'in_discussion',
  QUOTED = 'quoted',
  WON = 'won',
  LOST = 'lost'
}

export enum LeadSource {
  WEB = 'web',
  REFERRAL = 'referral',
  CAMPAIGN = 'campaign',
  MANUAL = 'manual'
}

export enum LeadPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export interface Lead {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  stage: LeadStage;
  priority: LeadPriority;
  source: LeadSource;
  owner_id: string | null;
  owner_name?: string | null;
  owner_email?: string | null;
  notes?: string | null;
  created_by: string;
  created_by_name?: string | null;
  created_by_email?: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}
