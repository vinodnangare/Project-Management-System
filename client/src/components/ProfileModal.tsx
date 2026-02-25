import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { closeProfileModal } from '../store/slices/uiModalSlice';
import Profile from './Profile';
import { HiOutlineX } from 'react-icons/hi';
import '../styles/ProfileModal.css';

const ProfileModal = () => {
  const dispatch = useAppDispatch();
  const { showProfileModal } = useAppSelector((state) => state.uiModal);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (showProfileModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showProfileModal]);

  const handleClose = () => {
    dispatch(closeProfileModal());
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!showProfileModal) return null;

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="modal-container profile-modal">
        <div className="modal-header">
          <div className="modal-title-section">
            <div className="modal-avatar">
              {user?.profile_image_url ? (
                <img
                  src={user.profile_image_url}
                  alt="Profile"
                  className="modal-avatar-image"
                />
              ) : (
                user?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h2 className="modal-title">My Profile</h2>
              <p className="modal-subtitle">{user?.email}</p>
            </div>
          </div>
          <button
            className="modal-close-btn"
            onClick={handleClose}
            aria-label="Close"
          >
            <HiOutlineX />
          </button>
        </div>

        <div className="modal-body">
          <Profile />
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
