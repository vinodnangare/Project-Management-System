-- Check all employees and their active status
SELECT id, full_name, email, role, is_active FROM users WHERE role = 'employee' ORDER BY is_active DESC, full_name;

-- Check only ACTIVE employees (what should show in admin dashboard)
SELECT id, full_name, email, role, is_active FROM users WHERE role = 'employee' AND is_active = 1 ORDER BY full_name;

-- Check deleted employees
SELECT id, full_name, email, role, is_active FROM users WHERE role = 'employee' AND is_active = 0 ORDER BY full_name;
