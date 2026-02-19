export interface LeadActivity {
  id: string;
  lead_id: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
  performed_by: string;
  performed_by_name?: string | null;
  performed_by_email?: string | null;
  created_at: string;
}
