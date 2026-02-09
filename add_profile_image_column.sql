-- Add profile_image_url column to users table
ALTER TABLE users ADD COLUMN profile_image_url VARCHAR(500) NULL AFTER mobile_number;
