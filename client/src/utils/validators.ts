export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return { valid: errors.length === 0, errors };
};

export const validateTaskTitle = (title: string): boolean => {
  return title.trim().length > 0 && title.length <= 255;
};

export const validateTaskDescription = (description: string): boolean => {
  return description.length <= 2000;
};

export const validateFormData = (data: Record<string, any>, requiredFields: string[]): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  requiredFields.forEach((field) => {
    if (!data[field]) {
      errors[field] = `${field} is required`;
    }
  });

  return { valid: Object.keys(errors).length === 0, errors };
};
