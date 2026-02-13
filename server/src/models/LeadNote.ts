export interface LeadNote {
  id: string;
  lead_id: string;
  note: string;
  created_by: string;
  created_by_name?: string | null;
  created_by_email?: string | null;
  created_at: string;
}
