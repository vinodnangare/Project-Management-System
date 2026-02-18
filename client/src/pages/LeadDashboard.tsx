import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetLeadStatsQuery, type LeadStats } from '../services/api';
import '../styles/LeadDashboard.css';

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

  const rawTotal = Number(stats.totalLeads ?? stats.total ?? 0) || 0;
  const rawWon = Number(stats.wonLeads ?? stats.byStage?.won ?? 0) || 0;
  const rawLost = Number(stats.lostLeads ?? stats.byStage?.lost ?? 0) || 0;
  const rawConversionRate = Number(stats.conversionRate ?? 0) || 0;
  const normalizedConversionRate = rawConversionRate > 1 ? rawConversionRate / 100 : rawConversionRate;

  const safeStats: LeadStats = {
    totalLeads: rawTotal,
    activeLeads: Number(stats.activeLeads ?? Math.max(0, rawTotal - rawWon - rawLost)) || 0,
    wonLeads: rawWon,
    lostLeads: rawLost,
    newLeadsThisWeek: Number(stats.newLeadsThisWeek ?? 0) || 0,
    newLeadsThisMonth: Number(stats.newLeadsThisMonth ?? 0) || 0,
    conversionRate: normalizedConversionRate,
    averageTimeToConvert: Number(stats.averageTimeToConvert ?? 0) || 0,
    lastWeekConversionTrend: Number(stats.lastWeekConversionTrend ?? 0) || 0,
    lastMonthConversionTrend: Number(stats.lastMonthConversionTrend ?? 0) || 0,
  };

  const stageCounts = stats.byStage || {};
  const funnelStages = [
    { key: 'new', label: 'New', color: '#3b82f6' },
    { key: 'in_discussion', label: 'In Discussion', color: '#8b5cf6' },
    { key: 'quoted', label: 'Quoted', color: '#f59e0b' },
    { key: 'won', label: 'Won', color: '#10b981' },
    { key: 'lost', label: 'Lost', color: '#ef4444' },
  ];
  const maxStageCount = Math.max(
    1,
    ...funnelStages.map((stage) => Number(stageCounts[stage.key]) || 0)
  );
  const maxNewLeads = Math.max(1, safeStats.newLeadsThisWeek, safeStats.newLeadsThisMonth);
  const avgTimeScale = Math.max(30, safeStats.averageTimeToConvert || 0);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Lead Dashboard</h1>
          <p className="welcome-text">Welcome back, {user?.full_name || user?.email || 'User'}!</p>
        </div>
        <div className="dashboard-actions">
          <button
            className="btn-add-lead"
            onClick={() => navigate('/leads/list?new=1')}
          >
            ➕ Add Lead
          </button>
          <button className="btn-view-pipeline" onClick={() => navigate('/leads/pipeline')}>
            📊 View Pipeline
          </button>
        </div>
      </div>

      <section className="kpi-section">
        <h2 className="section-title">Key Metrics</h2>
        <div className="kpi-grid">
          <div className="kpi-card kpi-total">
            <div className="kpi-header">
              <span className="kpi-icon">📋</span>
              <h3 className="kpi-label">Total Leads</h3>
            </div>
            <div className="kpi-value">{safeStats.totalLeads}</div>
            {safeStats.lastMonthConversionTrend !== 0 && (
              <div className={`kpi-trend ${safeStats.lastMonthConversionTrend >= 0 ? 'up' : 'down'}`}>
                {safeStats.lastMonthConversionTrend >= 0 ? '↑' : '↓'} {Math.abs(safeStats.lastMonthConversionTrend)}% from last month
              </div>
            )}
          </div>

          <div className="kpi-card kpi-active">
            <div className="kpi-header">
              <span className="kpi-icon">⚡</span>
              <h3 className="kpi-label">Active Leads</h3>
            </div>
            <div className="kpi-value">{safeStats.activeLeads}</div>
          </div>

          <div className="kpi-card kpi-won">
            <div className="kpi-header">
              <span className="kpi-icon">✅</span>
              <h3 className="kpi-label">Won Leads</h3>
            </div>
            <div className="kpi-value">{safeStats.wonLeads}</div>
            {safeStats.lastWeekConversionTrend !== 0 && (
              <div className="kpi-trend up">
                ↑ {safeStats.lastWeekConversionTrend}% from last week
              </div>
            )}
          </div>

          <div className="kpi-card kpi-lost">
            <div className="kpi-header">
              <span className="kpi-icon">❌</span>
              <h3 className="kpi-label">Lost Leads</h3>
            </div>
            <div className="kpi-value">{safeStats.lostLeads}</div>
          </div>
        </div>
      </section>

      <section className="secondary-kpi-section">
        <h2 className="section-title">Performance Metrics</h2>
        <div className="secondary-kpi-grid">
          <div className="kpi-card kpi-conversion">
            <div className="kpi-header">
              <span className="kpi-icon">📈</span>
              <h3 className="kpi-label">Conversion Rate</h3>
            </div>
            <div className="kpi-value">{Math.round(safeStats.conversionRate * 100)}%</div>
          </div>

          <div className="kpi-card kpi-time">
            <div className="kpi-header">
              <span className="kpi-icon">⏱️</span>
              <h3 className="kpi-label">Avg Time to Convert</h3>
            </div>
            <div className="kpi-value">{Math.round(safeStats.averageTimeToConvert)}</div>
            <div className="kpi-meta">days</div>
          </div>

          <div className="kpi-card kpi-week">
            <div className="kpi-header">
              <span className="kpi-icon">⭐</span>
              <h3 className="kpi-label">New This Week</h3>
            </div>
            <div className="kpi-value">{safeStats.newLeadsThisWeek}</div>
          </div>

          <div className="kpi-card kpi-month">
            <div className="kpi-header">
              <span className="kpi-icon">📅</span>
              <h3 className="kpi-label">New This Month</h3>
            </div>
            <div className="kpi-value">{safeStats.newLeadsThisMonth}</div>
          </div>
        </div>
      </section>

      <section className="charts-section">
        <div className="chart-container">
          <div className="chart-title">🎯 Funnel Overview</div>
          <div className="funnel-chart">
            {funnelStages.map((stage) => {
              const count = Number(stageCounts[stage.key]) || 0;
              const width = Math.max(12, Math.round((count / maxStageCount) * 100));
              return (
                <div key={stage.key} className="funnel-stage">
                  <div className="funnel-label">{stage.label}</div>
                  <div className="funnel-bar-wrap">
                    <div
                      className="funnel-bar"
                      style={{ width: `${width}%`, backgroundColor: stage.color }}
                    />
                  </div>
                  <div className="funnel-count">{count}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-title">📊 Conversion Velocity</div>
          <div className="velocity-chart">
            <div className="velocity-row">
              <div className="velocity-label">Conversion Rate</div>
              <div className="velocity-bar-wrap">
                <div
                  className="velocity-bar velocity-bar-rate"
                  style={{ width: `${Math.round(safeStats.conversionRate * 100)}%` }}
                />
              </div>
              <div className="velocity-value">{Math.round(safeStats.conversionRate * 100)}%</div>
            </div>
            <div className="velocity-row">
              <div className="velocity-label">Avg Days to Convert</div>
              <div className="velocity-bar-wrap">
                <div
                  className="velocity-bar velocity-bar-time"
                  style={{
                    width: `${Math.min(100, Math.round((safeStats.averageTimeToConvert / avgTimeScale) * 100))}%`
                  }}
                />
              </div>
              <div className="velocity-value">{Math.round(safeStats.averageTimeToConvert)} days</div>
            </div>
            <div className="velocity-row">
              <div className="velocity-label">New Leads (Week)</div>
              <div className="velocity-bar-wrap">
                <div
                  className="velocity-bar velocity-bar-week"
                  style={{
                    width: `${Math.round((safeStats.newLeadsThisWeek / maxNewLeads) * 100)}%`
                  }}
                />
              </div>
              <div className="velocity-value">{safeStats.newLeadsThisWeek}</div>
            </div>
            <div className="velocity-row">
              <div className="velocity-label">New Leads (Month)</div>
              <div className="velocity-bar-wrap">
                <div
                  className="velocity-bar velocity-bar-month"
                  style={{
                    width: `${Math.round((safeStats.newLeadsThisMonth / maxNewLeads) * 100)}%`
                  }}
                />
              </div>
              <div className="velocity-value">{safeStats.newLeadsThisMonth}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="quick-stats">
        <h2 className="section-title">Quick Insights</h2>
        <div className="stats-text">
          <p>
            You have <strong>{safeStats.activeLeads}</strong> active leads in your pipeline.
            {safeStats.conversionRate > 0 && (
              <> Your conversion rate is <strong>{(safeStats.conversionRate * 100).toFixed(1)}%</strong>.</>
            )}
          </p>
          <p>
            {safeStats.newLeadsThisWeek > 0 ? (
              <>
                You received <strong>{safeStats.newLeadsThisWeek}</strong> new leads this week.
                Keep up the momentum!
              </>
            ) : (
              <>No new leads this week. Consider reaching out to prospects!</>
            )}
          </p>
          {safeStats.averageTimeToConvert > 0 && (
            <p>
              On average, it takes <strong>{Math.round(safeStats.averageTimeToConvert)} days</strong> to convert a lead.
            </p>
          )}
        </div>
      </section>
    </div>
  );
};

export default LeadDashboard;
