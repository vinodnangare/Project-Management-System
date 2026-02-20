export interface LeadFormData {
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  source: string;
  stage: string;
  priority: string;
  owner_id?: string;
}

export interface LeadFormProps {
  initialData?: Partial<LeadFormData>;
  onSubmit: (data: LeadFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  mode?: 'create' | 'edit';
}
