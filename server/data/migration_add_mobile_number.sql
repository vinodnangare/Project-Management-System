-- Migration: Add mobile_number column to users table
-- Date: 2026-01-29
-- Description: Adds mobile_number field to support profile management feature

-- Check if column exists, if not add it
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(20) NULL 
AFTER full_name;

-- Optional: Add index for faster queries if needed
-- CREATE INDEX idx_mobile_number ON users(mobile_number);
