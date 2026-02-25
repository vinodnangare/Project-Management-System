import { useState } from 'react';
import jsPDF from 'jspdf';
import { useGetReportSummaryQuery, useGetEmployeePerformanceQuery, useGetTaskCompletionQuery } from '../services/api';
import {
  HiOutlineChartBar,
  HiOutlineRefresh,
  HiOutlineDownload,
  HiOutlineDocumentText,
  HiOutlineDocument,
  HiOutlineTrendingUp,
  HiOutlineUserGroup,
  HiOutlineChartPie,
  HiOutlineStar
} from 'react-icons/hi';
import '../styles/Reports.css';
import type { DateRange } from '../types/components/ReportsTypes';

export const Reports: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  
  const [activeTab, setActiveTab] = useState<'summary' | 'employee' | 'completion'>('summary');
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
  const [activePreset, setActivePreset] = useState<'7' | '30' | '90' | null>('30');

  const { data: summaryData, isLoading: summaryLoading, error: summaryError, refetch: refetchSummary } = useGetReportSummaryQuery(dateRange);
  const { data: employeeData, isLoading: employeeLoading, error: employeeError, refetch: refetchEmployee } = useGetEmployeePerformanceQuery(dateRange);
  const { data: completionData, isLoading: completionLoading, error: completionError, refetch: refetchCompletion } = useGetTaskCompletionQuery({ ...dateRange, groupBy });

  const summary = summaryData?.summary ?? summaryData ?? {};
  const byStatusRaw = summaryData?.by_status ?? summaryData?.status_breakdown ?? [];
  const byPriorityRaw = summaryData?.by_priority ?? summaryData?.priority_breakdown ?? [];

  const byStatus = Array.isArray(byStatusRaw)
    ? byStatusRaw.map((item: any) => {
        const rawStatus = item.status ?? '';
        const normalized = rawStatus === 'COMPLETED' ? 'DONE' : rawStatus;
        return {
          status: normalized,
          count: item.count ?? 0,
          className: `bar-${normalized.toLowerCase()}`
        };
      })
    : Object.entries(byStatusRaw || {}).map(([status, count]) => {
        const normalized = status === 'COMPLETED' ? 'DONE' : status;
        return {
          status: normalized,
          count,
          className: `bar-${normalized.toLowerCase()}`
        };
      });

  const byPriority = Array.isArray(byPriorityRaw)
    ? byPriorityRaw
    : Object.entries(byPriorityRaw || {}).map(([priority, value]: any) => {
        if (value && typeof value === 'object') {
          return {
            priority,
            count: value.count ?? 0,
            completed: value.completed ?? 0
          };
        }
        return {
          priority,
          count: value ?? 0,
          completed: 0
        };
      });

  const employeesRaw = employeeData?.employees ?? employeeData ?? [];
  const rawEmployees = Array.isArray(employeesRaw) ? employeesRaw : [];
  const employees = rawEmployees
    .filter((emp: any) => (emp.role ?? emp.employee_role ?? emp.user_role ?? 'employee') !== 'admin')
    .map((emp: any) => ({
      employee_id: emp.employee_id ?? emp.user_id ?? emp.id ?? '',
      employee_name: emp.employee_name ?? emp.full_name ?? emp.name ?? 'Unknown',
      employee_email: emp.employee_email ?? emp.email ?? '',
      profile_image_url: emp.profile_image_url ?? emp.employee_profile_image_url ?? emp.avatar_url ?? null,
      total_assigned: emp.total_assigned ?? emp.total_created ?? emp.total_tasks ?? emp.total ?? 0,
      completed: emp.completed ?? emp.completed_tasks ?? emp.done ?? 0,
      in_progress: emp.in_progress ?? 0,
      pending: emp.pending ?? emp.todo ?? 0,
      todo: emp.todo ?? emp.pending ?? 0,
      review: emp.review ?? 0,
      overdue: emp.overdue ?? 0,
      avg_completion_hours: emp.avg_completion_hours ?? emp.avg_hours ?? null,
      completion_rate: emp.completion_rate ?? 0
    }));

  const topPerformers = [...employees]
    .sort((a, b) => (b.completed || 0) - (a.completed || 0))
    .slice(0, 3)
    .map((emp: any) => ({
      full_name: emp.employee_name,
      completed_tasks: emp.completed
    }));

  const completionTrendRaw = completionData?.completion_trend ?? completionData ?? [];
  const completionTrend = Array.isArray(completionTrendRaw)
    ? completionTrendRaw
    : Object.entries(completionTrendRaw || {}).map(([period, values]: any) => ({
        period,
        tasks_completed: values?.completed ?? values?.tasks_completed ?? 0,
        avg_hours_to_complete: values?.avg_hours_to_complete ?? values?.avg_completion_hours ?? 0
      }));
  const maxCompleted = completionTrend.length
    ? Math.max(...completionTrend.map((i: any) => i.tasks_completed || 0))
    : 0;

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
    setActivePreset(null);
  };

  const handleRefresh = () => {
    refetchSummary();
    refetchEmployee();
    refetchCompletion();
  };

  const handleExport = async (format: 'json' | 'csv' | 'pdf') => {
    try {
      const reportType = activeTab === 'summary' ? 'summary' : activeTab === 'employee' ? 'employee-performance' : 'task-completion';
      const downloadBlob = (blob: Blob, filename: string) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
      };

      const exportData = reportType === 'summary'
        ? (summaryData ?? {})
        : reportType === 'employee-performance'
          ? (employeeData ?? [])
          : (completionData ?? {});

      if (format === 'pdf') {
        const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 40;
        const contentWidth = pageWidth - margin * 2;

        const formatLabel = (text: string) => text.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        const getInitials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || 'U';

        const loadImageAsDataUrl = async (url: string) => {
          try {
            const response = await fetch(url, { mode: 'cors' });
            if (!response.ok) return null;
            const blob = await response.blob();
            return await new Promise<string | null>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = () => resolve(null);
              reader.readAsDataURL(blob);
            });
          } catch {
            return null;
          }
        };

        const drawHeader = (title: string) => {
          doc.setFillColor(25, 40, 64);
          doc.rect(0, 0, pageWidth, 70, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(18);
          doc.text(title, margin, 38);
          doc.setFontSize(10);
          doc.text(`Range: ${dateRange.startDate} to ${dateRange.endDate}`, margin, 58);
          doc.setTextColor(33, 33, 33);
        };

        const drawFilterSummary = (yPos: number) => {
          doc.setFontSize(9);
          doc.setTextColor(90, 98, 110);
          const filters = `Filters: Date ${dateRange.startDate} → ${dateRange.endDate}, Group By: ${groupBy}`;
          doc.text(filters, margin, yPos);
          doc.setTextColor(33, 33, 33);
        };

        const drawKpiCards = (yPos: number) => {
          const summaryObj: any = summaryData?.summary ?? summaryData ?? {};
          const totalTasks = summaryObj.total_tasks ?? summaryObj.total ?? 0;
          const completedTasks = summaryObj.completed_tasks ?? summaryObj.completed ?? 0;
          const pendingTasks = summaryObj.pending_tasks ?? summaryObj.pending ?? 0;
          const totalHours = summaryObj.total_estimated_hours ?? summaryObj.estimated_hours ?? summaryObj.total_hours ?? 0;
          const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

          const cards = [
            { label: 'Total Tasks', value: String(totalTasks) },
            { label: 'Completed', value: String(completedTasks) },
            { label: 'Pending', value: String(pendingTasks) },
            { label: 'Est. Hours', value: String(totalHours) },
            { label: 'Completion', value: `${completionRate}%` }
          ];

          const cardGap = 10;
          const cardWidth = (contentWidth - cardGap * (cards.length - 1)) / cards.length;
          const cardHeight = 50;
          cards.forEach((card, index) => {
            const x = margin + index * (cardWidth + cardGap);
            doc.setFillColor(248, 249, 251);
            doc.roundedRect(x, yPos, cardWidth, cardHeight, 6, 6, 'F');
            doc.setFontSize(9);
            doc.setTextColor(90, 98, 110);
            doc.text(card.label, x + 10, yPos + 18);
            doc.setFontSize(14);
            doc.setTextColor(33, 33, 33);
            doc.text(card.value, x + 10, yPos + 38);
          });
        };

        const ensureSpace = (y: number, needed: number) => {
          if (y + needed > pageHeight - margin) {
            doc.addPage();
            drawHeader('Report');
            return 90;
          }
          return y;
        };

        drawHeader(`Report · ${formatLabel(reportType)}`);
        drawFilterSummary(82);
        let y = 100;

        if (reportType === 'summary') {
          drawKpiCards(y);
          y += 70;
          doc.setFontSize(13);
          doc.text('Summary Overview', margin, y);
          y += 12;

          const summaryObj: any = summaryData?.summary ?? summaryData ?? {};
          const rows = Object.entries(summaryObj)
            .filter(([, value]) => typeof value !== 'object' || value === null)
            .map(([key, value]) => ({ label: formatLabel(key), value: String(value) }));

          doc.setFontSize(10);
          rows.forEach((row) => {
            y = ensureSpace(y, 18);
            doc.setTextColor(102, 102, 102);
            doc.text(row.label, margin, y);
            doc.setTextColor(33, 33, 33);
            doc.text(row.value, margin + 220, y);
            y += 16;
          });

          y += 10;
          y = ensureSpace(y, 40);
          doc.setFontSize(13);
          doc.text('Employee Performance', margin, y);
          y += 12;
        } else if (reportType === 'employee-performance') {
          doc.setFontSize(13);
          doc.text('Employee Performance', margin, y);
          y += 12;
        } else {
          doc.setFontSize(13);
          doc.text('Task Completion Trend', margin, y);
          y += 12;
        }

        if (reportType === 'summary' || reportType === 'employee-performance') {
          const avatarSize = 18;
          const rowHeight = 28;
          const columns = [
            { label: '', width: 24 },
            { label: 'Employee', width: 150 },
            { label: 'Email', width: 180 },
            { label: 'Assigned', width: 52 },
            { label: 'Completed', width: 56 },
            { label: 'In Progress', width: 64 },
            { label: 'Review', width: 50 },
            { label: 'TODO', width: 48 },
            { label: 'Overdue', width: 52 },
            { label: 'Rate', width: 48 }
          ];

          const tableWidth = columns.reduce((sum, col) => sum + col.width, 0);
          const startX = margin;
          const startY = y;

          doc.setFillColor(242, 245, 250);
          doc.rect(startX, startY, Math.min(contentWidth, tableWidth), rowHeight, 'F');
          doc.setFontSize(9);
          doc.setTextColor(90, 98, 110);
          let x = startX;
          columns.forEach((col) => {
            if (col.label) {
              doc.text(col.label, x + 4, startY + 18);
            }
            x += col.width;
          });

          y += rowHeight;
          doc.setTextColor(33, 33, 33);

          for (let index = 0; index < employees.length; index += 1) {
            const emp: any = employees[index];
            y = ensureSpace(y, rowHeight + 8);
            if (index % 2 === 0) {
              doc.setFillColor(250, 251, 253);
              doc.rect(startX, y - 4, Math.min(contentWidth, tableWidth), rowHeight, 'F');
            }

            const name = emp.employee_name || 'Unknown';
            const imageUrl = emp.profile_image_url as string | null;
            let imageData: string | null = null;
            if (imageUrl) {
              imageData = await loadImageAsDataUrl(imageUrl);
            }

            let cellX = startX;
            const centerY = y + 10;

            if (imageData) {
              try {
                doc.addImage(imageData, 'PNG', cellX + 4, y + 3, avatarSize, avatarSize);
              } catch {
                doc.setFillColor(224, 231, 255);
                doc.circle(cellX + 13, centerY, 9, 'F');
                doc.setFontSize(8);
                doc.setTextColor(63, 81, 181);
                doc.text(getInitials(name), cellX + 8, centerY + 3);
                doc.setTextColor(33, 33, 33);
                doc.setFontSize(9);
              }
            } else {
              doc.setFillColor(224, 231, 255);
              doc.circle(cellX + 13, centerY, 9, 'F');
              doc.setFontSize(8);
              doc.setTextColor(63, 81, 181);
              doc.text(getInitials(name), cellX + 8, centerY + 3);
              doc.setTextColor(33, 33, 33);
              doc.setFontSize(9);
            }

            cellX += columns[0].width;
            doc.text(name, cellX + 4, y + 18);
            cellX += columns[1].width;
            doc.text(emp.employee_email || '-', cellX + 4, y + 18);
            cellX += columns[2].width;
            doc.text(String(emp.total_assigned ?? 0), cellX + 4, y + 18);
            cellX += columns[3].width;
            doc.text(String(emp.completed ?? 0), cellX + 4, y + 18);
            cellX += columns[4].width;
            doc.text(String(emp.in_progress ?? 0), cellX + 4, y + 18);
            cellX += columns[5].width;
            doc.text(String(emp.review ?? 0), cellX + 4, y + 18);
            cellX += columns[6].width;
            doc.text(String(emp.todo ?? emp.pending ?? 0), cellX + 4, y + 18);
            cellX += columns[7].width;
            doc.text(String(emp.overdue ?? 0), cellX + 4, y + 18);
            cellX += columns[8].width;
            const rateValue = Number(emp.completion_rate ?? 0);
            const rateText = Number.isFinite(rateValue) ? rateValue.toFixed(2) : '0.00';
            doc.text(`${rateText}%`, cellX + 4, y + 18);

            y += rowHeight;
          }
        } else {
          const rowHeight = 22;
          doc.setFontSize(10);
          completionTrend.forEach((row: any) => {
            y = ensureSpace(y, rowHeight + 6);
            doc.setFillColor(248, 249, 251);
            doc.rect(margin, y - 4, contentWidth, rowHeight, 'F');
            doc.setTextColor(33, 33, 33);
            doc.text(String(row.period), margin + 8, y + 12);
            doc.setTextColor(90, 98, 110);
            doc.text(`Completed: ${row.tasks_completed || 0}`, margin + 220, y + 12);
            doc.text(`Avg Hours: ${row.avg_hours_to_complete || 0}`, margin + 340, y + 12);
            y += rowHeight;
          });
        }

        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i += 1) {
          doc.setPage(i);
          doc.setTextColor(120, 120, 120);
          doc.setFontSize(9);
          doc.text('Generated by Project Management System', margin, pageHeight - 24);
          doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 60, pageHeight - 24);
        }
        doc.save(`report-${reportType}-${Date.now()}.pdf`);
      } else if (format === 'json') {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        downloadBlob(blob, `report-${reportType}-${Date.now()}.json`);
      } else {
        let csvContent = '';

        if (reportType === 'summary') {
          const summaryObj: any = summaryData?.summary ?? summaryData ?? {};
          csvContent += 'metric,value\n';
          Object.entries(summaryObj).forEach(([key, value]) => {
            if (typeof value === 'object' && value !== null) return;
            csvContent += `${key},${value}\n`;
          });
          const statusBreakdown = summaryData?.by_status ?? summaryData?.status_breakdown ?? {};
          const priorityBreakdown = summaryData?.by_priority ?? summaryData?.priority_breakdown ?? {};
          Object.entries(statusBreakdown).forEach(([key, value]) => {
            csvContent += `status_${key},${value}\n`;
          });
          Object.entries(priorityBreakdown).forEach(([key, value]) => {
            csvContent += `priority_${key},${value}\n`;
          });
        } else if (reportType === 'employee-performance') {
          const rows: any[] = Array.isArray(employeeData) ? employeeData : (employeeData ?? []);
          if (rows.length) {
            const headers = Object.keys(rows[0]);
            csvContent += `${headers.join(',')}\n`;
            rows.forEach((row) => {
              csvContent += `${headers.map((h) => row[h]).join(',')}\n`;
            });
          }
        } else {
          const completionObj: any = completionData ?? {};
          csvContent += 'period,total,completed,pending\n';
          if (Array.isArray(completionObj)) {
            completionObj.forEach((row: any) => {
              csvContent += `${row.period || row.date || ''},${row.total || 0},${row.completed || row.tasks_completed || 0},${row.pending || 0}\n`;
            });
          } else {
            Object.entries(completionObj).forEach(([period, values]: any) => {
              csvContent += `${period},${values.total || 0},${values.completed || 0},${values.pending || 0}\n`;
            });
          }
        }

        const blob = new Blob([csvContent], { type: 'text/csv' });
        downloadBlob(blob, `report-${reportType}-${Date.now()}.csv`);
      }
      alert('Report exported successfully!');
    } catch (error) {
      alert('Failed to export report');
      console.error(error);
    }
  };

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h2><HiOutlineChartBar className="header-icon" /> Analytics & Reports</h2>
        <div className="header-actions">
          <button onClick={handleRefresh} className="refresh-btn">
            <HiOutlineRefresh className="btn-icon" /> Refresh
          </button>
          <button onClick={() => handleExport('json')} className="export-btn">
            <HiOutlineDownload className="btn-icon" /> Export JSON
          </button>
          <button onClick={() => handleExport('csv')} className="export-btn">
            <HiOutlineDocumentText className="btn-icon" /> Export CSV
          </button>
          <button onClick={() => handleExport('pdf')} className="export-btn">
            <HiOutlineDocument className="btn-icon" /> Export PDF
          </button>
        </div>
      </div>

      <div className="date-range-selector">
        <div className="date-input-group">
          <label>Start Date:</label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => handleDateChange('startDate', e.target.value)}
            max={dateRange.endDate}
          />
        </div>
        <div className="date-input-group">
          <label>End Date:</label>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => handleDateChange('endDate', e.target.value)}
            min={dateRange.startDate}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
        <div className="date-presets">
          <button
            className={activePreset === '7' ? 'preset-active' : ''}
            onClick={() => {
              setActivePreset('7');
              setDateRange({
                startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0]
              });
            }}
          >
            Last 7 Days
          </button>
          <button
            className={activePreset === '30' ? 'preset-active' : ''}
            onClick={() => {
              setActivePreset('30');
              setDateRange({
                startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0]
              });
            }}
          >
            Last 30 Days
          </button>
          <button
            className={activePreset === '90' ? 'preset-active' : ''}
            onClick={() => {
              setActivePreset('90');
              setDateRange({
                startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0]
              });
            }}
          >
            Last 90 Days
          </button>
        </div>
      </div>

      <div className="reports-tabs">
        <button
          className={`tab ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          <HiOutlineTrendingUp className="tab-icon" /> Summary Report
        </button>
        <button
          className={`tab ${activeTab === 'employee' ? 'active' : ''}`}
          onClick={() => setActiveTab('employee')}
        >
          <HiOutlineUserGroup className="tab-icon" /> Employee Performance
        </button>
        <button
          className={`tab ${activeTab === 'completion' ? 'active' : ''}`}
          onClick={() => setActiveTab('completion')}
        >
          <HiOutlineChartPie className="tab-icon" /> Task Completion Trends
        </button>
      </div>

      <div className="reports-content">
        {activeTab === 'summary' && (
          <div className="summary-report">
            {summaryLoading ? (
              <div className="loading">Loading summary...</div>
            ) : summaryError ? (
              <div className="error">Error loading summary: {JSON.stringify(summaryError)}</div>
            ) : summaryData ? (
              <>
                <div className="summary-cards">
                  <div className="summary-card">
                    <div className="card-value">{summary.total_tasks || 0}</div>
                    <div className="card-label">Total Tasks</div>
                  </div>
                  <div className="summary-card completed">
                    <div className="card-value">{summary.completed_tasks || 0}</div>
                    <div className="card-label">Completed</div>
                  </div>
                  <div className="summary-card pending">
                    <div className="card-value">{summary.pending_tasks || 0}</div>
                    <div className="card-label">Pending</div>
                  </div>
                  <div className="summary-card overdue">
                    <div className="card-value">{summary.overdue_tasks || 0}</div>
                    <div className="card-label">Overdue</div>
                  </div>
                  <div className="summary-card">
                    <div className="card-value">{summary.active_employees || summary.total_employees || 0}</div>
                    <div className="card-label">Active Employees</div>
                  </div>
                  <div className="summary-card">
                    <div className="card-value">{Math.round(summary.avg_completion_hours || 0)}h</div>
                    <div className="card-label">Avg Completion Time</div>
                  </div>
                </div>

                <div className="charts-row">
                  <div className="chart-section">
                    <h3>Tasks by Status</h3>
                    <div className="status-breakdown">
                      {byStatus.map((item: any) => (
                        <div key={item.status} className="status-bar">
                          <span className="status-label">{item.status}</span>
                          <div className="bar-container">
                            <div 
                              className={`bar ${item.className || 'bar-default'}`}
                              style={{ width: `${summary.total_tasks ? (item.count / summary.total_tasks) * 100 : 0}%` }}
                            >
                              {item.count}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="chart-section">
                    <h3>Tasks by Priority</h3>
                    <div className="priority-breakdown">
                      {byPriority.map((item: any) => (
                        <div key={item.priority} className="priority-item">
                          <div className="priority-header">
                            <span className={`priority-badge ${item.priority.toLowerCase()}`}>
                              {item.priority}
                            </span>
                            <span className="priority-count">{item.count} tasks</span>
                          </div>
                          <div className="priority-stats">
                            <span>Completed: {item.completed}</span>
                            <span>Rate: {item.count > 0 ? Math.round((item.completed / item.count) * 100) : 0}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="no-data">No data available</div>
            )}
          </div>
        )}

        {activeTab === 'employee' && (
          <div className="employee-report">
            {employeeLoading ? (
              <div className="loading">Loading employee performance...</div>
            ) : employeeError ? (
              <div className="error">Error loading employee data: {JSON.stringify(employeeError)}</div>
            ) : employeeData ? (
              <>
                <div className="top-performers">
                  <h3><HiOutlineStar className="section-icon" /> Top Performers</h3>
                  <div className="performers-list">
                    {topPerformers.map((emp: any, index: number) => (
                      <div key={emp.id} className="performer-card">
                        <div className="rank">#{index + 1}</div>
                        <div className="performer-info">
                          <div className="performer-name">{emp.full_name}</div>
                          <div className="performer-stat">{emp.completed_tasks} tasks completed</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="employee-performance-table">
                  <h3>Employee Performance Details</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Email</th>
                        <th>Assigned</th>
                        <th>Completed</th>
                        <th>In Progress</th>
                        <th>Pending</th>
                        <th>Overdue</th>
                        <th>Avg Time (hrs)</th>
                        <th>Completion Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((emp: any) => (
                        <tr key={emp.employee_id}>
                          <td>{emp.employee_name}</td>
                          <td>{emp.employee_email}</td>
                          <td>{emp.total_assigned}</td>
                          <td className="completed">{emp.completed}</td>
                          <td>{emp.in_progress}</td>
                          <td>{emp.pending}</td>
                          <td className="overdue">{emp.overdue}</td>
                          <td>{emp.avg_completion_hours || '-'}</td>
                          <td>
                            <div className="completion-rate">
                              <div className="rate-bar">
                                <div 
                                  className="rate-fill"
                                  style={{ width: `${emp.completion_rate || 0}%` }}
                                />
                              </div>
                              <span>{emp.completion_rate || 0}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="no-data">No data available</div>
            )}
          </div>
        )}

        {activeTab === 'completion' && (
          <div className="completion-report">
            <div className="group-by-selector">
              <label>Group By:</label>
              <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as any)}>
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
              </select>
            </div>

            {completionLoading ? (
              <div className="loading">Loading completion trends...</div>
            ) : completionError ? (
              <div className="error">Error loading completion data: {JSON.stringify(completionError)}</div>
            ) : completionData ? (
              <div className="trends-container">
                <div className="trend-chart">
                  <h3>Task Completion Trend</h3>
                  <div className="chart-area">
                    {completionTrend.map((item: any, index: number) => (
                      <div key={index} className="chart-bar-group">
                        <div className="chart-bar" style={{ height: `${maxCompleted ? (item.tasks_completed / maxCompleted) * 200 : 0}px` }}>
                          <span className="bar-value">{item.tasks_completed}</span>
                        </div>
                        <div className="chart-label">{item.period}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="trend-stats">
                  <h3>Completion Statistics</h3>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <div className="stat-label">Total Completed</div>
                      <div className="stat-value">
                        {completionTrend.reduce((sum: number, item: any) => sum + (item.tasks_completed || 0), 0)}
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">Average per Period</div>
                      <div className="stat-value">
                        {Math.round((completionTrend.reduce((sum: number, item: any) => sum + (item.tasks_completed || 0), 0) / (completionTrend.length || 1)) || 0)}
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">Avg Completion Time</div>
                      <div className="stat-value">
                        {Math.round((completionTrend.reduce((sum: number, item: any) => sum + (item.avg_hours_to_complete || 0), 0) / (completionTrend.length || 1)) || 0)}h
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-data">No data available</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
