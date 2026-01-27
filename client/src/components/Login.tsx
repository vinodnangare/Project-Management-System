import React, { useState } from 'react';
import '../styles/Auth.css';

interface LoginProps {
  onLogin: (email: string, password: string) => void;
  onSwitchToRegister: () => void;
  loading: boolean;
  error: string | null;
}

export default function Login({ onLogin, onSwitchToRegister, loading, error }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
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
            <div className="auth-icon">🔐</div>
            <h1>Task Management System</h1>
            <p className="auth-subtitle">Welcome Back</p>
          </div>

          {error && (
            <div className="auth-error">
              <span>⚠️ {error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
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
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="form-input"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="submit-btn">
              <span>{loading ? '🔄 Signing in...' : '✨ Sign In'}</span>
            </button>
          </form>

          <div className="auth-footer">
            <p>Don't have an account?</p>
            <button
              onClick={onSwitchToRegister}
              className="switch-btn"
              disabled={loading}
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
