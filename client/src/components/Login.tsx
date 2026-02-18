import React, { useState, useEffect } from 'react';
import { useLoginMutation } from '../services/api';
import { useAppDispatch } from '../hooks/redux';
import { setCredentials } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import '../styles/Auth.css';

interface LoginProps {
  onSwitchToRegister: () => void;
}

export default function Login({ onSwitchToRegister }: LoginProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [login, { isLoading: loading, error }] = useLoginMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string>('');

  useEffect(() => {
    if (error && 'data' in error) {
      const msg = (error.data as any)?.error || (error.data as any)?.message || 'Login failed';
      if (msg.includes('Too many login attempts')) {
        setLocalError('Too many login attempts. Please try again later.');
      } else {
        setLocalError(msg);
      }
    } else if (error) {
      setLocalError('Login failed');
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    
    if (!email || !password) {
      setLocalError('Please enter both email and password');
      return;
    }

    try {
      const result = await login({ email, password }).unwrap();
      dispatch(setCredentials(result));
      // Let App.tsx handle the redirect based on user role via useEffect
    } catch (err: any) {
      setLocalError(err?.data?.message || 'Login failed');
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
            <div className="auth-icon">🔐</div>
            <h1>Task Management System</h1>
            <p className="auth-subtitle">Welcome Back</p>
          </div>

          {localError && (
            <div className="auth-error">
              <span>⚠️ {localError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="form-input"
              />
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
