import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetLeadStatsQuery } from '../services/api';
import '../styles/LeadDashboard.css';

interface DashboardStats {
  totalLeads: number;
  activeLeads: number;
  wonLeads: number;
  lostLeads: number;
  newLeadsThisWeek: number;
  newLeadsThisMonth: number;
  conversionRate: number;
  averageTimeToConvert: number;
  lastWeekConversionTrend: number;
  lastMonthConversionTrend: number;
}

export const LeadDashboard: React.FC = () => {
  const { data: stats, isLoading: loading, error } = useGetLeadStatsQuery();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage = 'data' in error 
      ? (error.data as any)?.error || 'Failed to load dashboard data'
      : 'Failed to load dashboard data';
    
    return (
      <div className="dashboard-container">
        <div className="error-state">
          <p>⚠️ {errorMessage}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="dashboard-container">
        <div className="empty-state">
          <p>No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Lead Dashboard</h1>
          <p className="welcome-text">Welcome back, {user?.full_name || user?.email || 'User'}!</p>
        </div>
        <button className="btn-view-pipeline" onClick={() => navigate('/leads/pipeline')}>
          📊 View Pipeline
        </button>
      </div>

      <section className="kpi-section">
        <h2 className="section-title">Key Metrics</h2>
        <div className="kpi-grid">
          <div className="kpi-card" style={{ backgroundColor: '#f0f9ff' }}>
            <div className="kpi-header">
              <span className="kpi-icon">📋</span>
              <h3 className="kpi-label">Total Leads</h3>
            </div>
            <div className="kpi-value">{stats.totalLeads}</div>
            {stats.lastMonthConversionTrend !== 0 && (
              <div className={`kpi-trend ${stats.lastMonthConversionTrend >= 0 ? 'up' : 'down'}`}>
                {stats.lastMonthConversionTrend >= 0 ? '↑' : '↓'} {Math.abs(stats.lastMonthConversionTrend)}% from last month
              </div>
            )}
          </div>

          <div className="kpi-card" style={{ backgroundColor: '#f0fdf4' }}>
            <div className="kpi-header">
              <span className="kpi-icon">⚡</span>
              <h3 className="kpi-label">Active Leads</h3>
            </div>
            <div className="kpi-value">{stats.activeLeads}</div>
          </div>

          <div className="kpi-card" style={{ backgroundColor: '#ecfdf5' }}>
            <div className="kpi-header">
              <span className="kpi-icon">✅</span>
              <h3 className="kpi-label">Won Leads</h3>
            </div>
            <div className="kpi-value">{stats.wonLeads}</div>
            {stats.lastWeekConversionTrend !== 0 && (
              <div className="kpi-trend up">
                ↑ {stats.lastWeekConversionTrend}% from last week
              </div>
            )}
          </div>

          <div className="kpi-card" style={{ backgroundColor: '#fef2f2' }}>
            <div className="kpi-header">
              <span className="kpi-icon">❌</span>
              <h3 className="kpi-label">Lost Leads</h3>
            </div>
            <div className="kpi-value">{stats.lostLeads}</div>
          </div>
        </div>
      </section>

      <section className="secondary-kpi-section">
        <h2 className="section-title">Performance Metrics</h2>
        <div className="secondary-kpi-grid">
          <div className="kpi-card" style={{ backgroundColor: '#fef3c7' }}>
            <div className="kpi-header">
              <span className="kpi-icon">📈</span>
              <h3 className="kpi-label">Conversion Rate</h3>
            </div>
            <div className="kpi-value">{Math.round(stats.conversionRate * 100)}%</div>
          </div>

          <div className="kpi-card" style={{ backgroundColor: '#f3e8ff' }}>
            <div className="kpi-header">
              <span className="kpi-icon">⏱️</span>
              <h3 className="kpi-label">Avg Time to Convert</h3>
            </div>
            <div className="kpi-value">{Math.round(stats.averageTimeToConvert)}</div>
            <div className="kpi-meta">days</div>
          </div>

          <div className="kpi-card" style={{ backgroundColor: '#fce7f3' }}>
            <div className="kpi-header">
              <span className="kpi-icon">⭐</span>
              <h3 className="kpi-label">New This Week</h3>
            </div>
            <div className="kpi-value">{stats.newLeadsThisWeek}</div>
          </div>

          <div className="kpi-card" style={{ backgroundColor: '#dcfce7' }}>
            <div className="kpi-header">
              <span className="kpi-icon">📅</span>
              <h3 className="kpi-label">New This Month</h3>
            </div>
            <div className="kpi-value">{stats.newLeadsThisMonth}</div>
          </div>
        </div>
      </section>

      <section className="charts-section">
        <div className="chart-container">
          <div className="chart-placeholder">
            <p>🎯 Funnel Chart Component (Coming Soon - Created by Person B)</p>
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-placeholder">
            <p>📊 Conversion Velocity Chart Component (Coming Soon - Created by Person B)</p>
          </div>
        </div>
      </section>

      <section className="quick-stats">
        <h2 className="section-title">Quick Insights</h2>
        <div className="stats-text">
          <p>
            You have <strong>{stats.activeLeads}</strong> active leads in your pipeline.
            {stats.conversionRate > 0 && (
              <> Your conversion rate is <strong>{(stats.conversionRate * 100).toFixed(1)}%</strong>.</>
            )}
          </p>
          <p>
            {stats.newLeadsThisWeek > 0 ? (
              <>
                You received <strong>{stats.newLeadsThisWeek}</strong> new leads this week.
                Keep up the momentum!
              </>
            ) : (
              <>No new leads this week. Consider reaching out to prospects!</>
            )}
          </p>
          {stats.averageTimeToConvert > 0 && (
            <p>
              On average, it takes <strong>{Math.round(stats.averageTimeToConvert)} days</strong> to convert a lead.
            </p>
          )}
        </div>
      </section>
    </div>
  );
};

export default LeadDashboard;
