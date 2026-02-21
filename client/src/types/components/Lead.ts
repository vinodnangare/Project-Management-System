export interface Lead {
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
