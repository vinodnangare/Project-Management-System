import React, { useState } from 'react';
import '../styles/Auth.css';

interface RegisterProps {
  onRegister: (email: string, password: string, fullName: string) => void;
  onSwitchToLogin: () => void;
  loading: boolean;
  error: string | null;
}

export default function Register({ onRegister, onSwitchToLogin, loading, error }: RegisterProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    onRegister(email, password, fullName);
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

          {error && (
            <div className="auth-error">
              <span>⚠️ {error}</span>
            </div>
          )}
          {passwordError && (
            <div className="auth-error">
              <span>⚠️ {passwordError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <div className="input-wrapper">
                <span className="input-icon">👤</span>
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
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon">📧</span>
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
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
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
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-wrapper">
                <span className="input-icon">✓</span>
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
