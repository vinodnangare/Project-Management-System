import { useEffect, useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { updateUser } from '../store/slices/authSlice';
import { useUpdateProfileMutation, useUploadProfileImageMutation } from '../services/api';
import '../styles/Profile.css';

const Profile = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [updateProfile, { isLoading: updatingProfile, error: profileError }] = useUpdateProfileMutation();
  const [uploadProfileImage, { isLoading: uploadingImage }] = useUploadProfileImageMutation();

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    mobile_number: user?.mobile_number || ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [localError, setLocalError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        mobile_number: user.mobile_number || ''
      });
    }
  }, [user]);

  useEffect(() => {
    if (profileError) {
      setLocalError((profileError as any)?.data?.error || 'Failed to update profile');
      const timer = setTimeout(() => setLocalError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [profileError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.full_name.trim()) {
      alert('Name cannot be empty');
      return;
    }

    if (formData.mobile_number && formData.mobile_number.trim()) {
      // Basic mobile validation (10 digits)
      if (!/^\d{10}$/.test(formData.mobile_number.replace(/[-\s]/g, ''))) {
        alert('Please enter a valid 10-digit mobile number');
        return;
      }
    }

    try {
      const updated = await updateProfile({
        full_name: formData.full_name,
        mobile_number: formData.mobile_number.trim() || null
      }).unwrap();
      dispatch(updateUser(updated));
      setIsEditing(false);
      setSuccessMessage('Profile updated successfully!');
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    } catch (err: any) {
      setLocalError(err?.data?.error || 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        mobile_number: user.mobile_number || ''
      });
    }
    setImageFile(null);
    setImagePreview(null);
    setLocalError('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile) return;

    const formDataObj = new FormData();
    formDataObj.append('image', imageFile);

    try {
      const updatedUser = await uploadProfileImage(formDataObj).unwrap();
      dispatch({ type: 'auth/updateUser', payload: updatedUser });
      setImageFile(null);
      setImagePreview(null);
      setSuccessMessage('Profile image updated successfully!');
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    } catch (error: any) {
      setLocalError(error?.data?.error || 'Failed to upload image');
    }
  };

  const isValidImageUrl = (url?: string | null) => {
    if (!url) return false;
    if (url.startsWith('data:image/')) return true;
    return /^https?:\/\//i.test(url);
  };

  const profileImageUrl = isValidImageUrl(user?.profile_image_url)
    ? user?.profile_image_url
    : null;

  return (
    <div className="profile-section">
      <div className="profile-header">
        <h2>Profile Information</h2>
        {!isEditing && (
          <button
            className="edit-btn"
            onClick={() => setIsEditing(true)}
            type="button"
          >
            Edit Profile
          </button>
        )}
      </div>

      {successMessage && (
        <div className="alert alert-success">
          ✓ {successMessage}
        </div>
      )}

      {localError && <div className="alert alert-error">✗ {localError}</div>}

      {/* Profile Image Section */}
      <div className="profile-image-section">
        <div className="profile-image-container">
          <img
            src={
              imagePreview ||
              profileImageUrl ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                user?.full_name || 'User'
              )}&background=667eea&color=fff&size=400`
            }
            alt="Profile"
            className="profile-image"
          />
        </div>
        <div className="profile-image-actions">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="change-image-btn"
            disabled={uploadingImage}
          >
            Change Photo
          </button>
          {imageFile && (
            <button
              type="button"
              onClick={handleImageUpload}
              className="upload-image-btn"
              disabled={uploadingImage}
            >
              {uploadingImage ? 'Uploading...' : 'Upload'}
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="full_name">Full Name</label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              disabled={updatingProfile}
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="mobile_number">Mobile Number</label>
            <input
              type="tel"
              id="mobile_number"
              name="mobile_number"
              value={formData.mobile_number}
              onChange={handleChange}
              disabled={updatingProfile}
              placeholder="Enter 10-digit mobile number"
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="submit-btn"
              disabled={updatingProfile}
            >
              {updatingProfile ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              className="cancel-btn"
              onClick={handleCancel}
              disabled={updatingProfile}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="profile-display">
          <div className="profile-item">
            <span className="profile-label">Email:</span>
            <span className="profile-value">{user?.email}</span>
          </div>
          <div className="profile-item">
            <span className="profile-label">Full Name:</span>
            <span className="profile-value">{user?.full_name || '-'}</span>
          </div>
          <div className="profile-item">
            <span className="profile-label">Mobile Number:</span>
            <span className="profile-value">
              {user?.mobile_number || 'Not added'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
