import React, { useState, useEffect } from 'react';
import { useRegisterMutation } from '../services/api';
import { useAppDispatch } from '../hooks/redux';
import { setCredentials } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { validatePassword } from '../utils/validators';
import '../styles/Auth.css';
import type { RegisterProps } from '../types/components/RegisterProps';

export default function Register({ onSwitchToLogin }: RegisterProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [register, { isLoading: loading, error }] = useRegisterMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [apiError, setApiError] = useState<string>('');

  useEffect(() => {
    if (error && 'data' in error) {
      setApiError((error.data as any)?.error || 'Registration failed');
    } else if (error) {
      setApiError('Registration failed');
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setApiError('');

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    const { valid } = validatePassword(password);
    if (!valid) {
      setPasswordError('Password must be at least 8 characters with uppercase, lowercase, and numbers');
      return;
    }

    try {
      const result = await register({
        email,
        password,
        password_confirm: confirmPassword,
        full_name: fullName,
      }).unwrap();
      dispatch(setCredentials(result));
      // Let App.tsx handle the redirect based on user role via useEffect
      navigate('/dashboard');
    } catch (err: any) {
      setApiError(err?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
      </div>

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-icon">👤</div>
            <h1>Task Management System</h1>
            <p className="auth-subtitle">Join Our Team</p>
          </div>

          {apiError && (
            <div className="auth-error">
              <span>⚠️ {apiError}</span>
            </div>
          )}
          {passwordError && (
            <div className="auth-error">
              <span>⚠️ {passwordError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="fullName">👤 Full Name</label>
              <input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">📧 Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">🔒 Password</label>
              <input
                id="password"
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">✓ Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className="form-input"
              />
            </div>

            <button type="submit" disabled={loading} className="submit-btn">
              <span>{loading ? '🔄 Creating Account...' : '✨ Create Account'}</span>
            </button>
          </form>

          <div className="auth-footer">
            <p>Already have an account?</p>
            <button
              onClick={onSwitchToLogin}
              className="switch-btn"
              disabled={loading}
            >
              Sign In Here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
