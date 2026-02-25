import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGetMeetingQuery, useDeleteMeetingMutation, useUpdateMeetingMutation } from '../api/meetingsApi';
import { useAppSelector } from '../../../hooks/redux';
import toast from 'react-hot-toast';
import {
  HiOutlineLocationMarker,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineUserGroup,
  HiOutlinePencil,
  HiOutlineRefresh,
  HiOutlineDocumentText,
  HiOutlineGlobeAlt,
  HiOutlineVideoCamera
} from 'react-icons/hi';
import '../../../styles/MeetingsList.css';

const MeetingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [diagnosticResult, setDiagnosticResult] = React.useState<any>(null);
  const [diagnosing, setDiagnosing] = React.useState(false);
  
  // Only fetch if we have a valid ID
  const shouldSkip = !id || id.trim() === '';
  const { data: response, isLoading, error, refetch } = useGetMeetingQuery(
    id?.trim() || '', 
    { skip: shouldSkip }
  );
  
  const [deleteMeeting] = useDeleteMeetingMutation();
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'admin';

  const meeting = response?.data;

  // Log errors for debugging
  React.useEffect(() => {
    if (error) {
      console.error('Meeting fetch error:', error);
    }
  }, [error]);

  // Diagnostic function for admins only
  const runDiagnostics = async () => {
    if (!isAdmin || !id) return;
    
    setDiagnosing(true);
    try {
      const response = await fetch(`/api/meetings/status/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      
      if (!response.ok) {
        console.error('Diagnostic API error:', response.status, result);
      }
      
      setDiagnosticResult(result);
    } catch (err) {
      console.error('Diagnostic fetch error:', err);
      setDiagnosticResult({ 
        error: 'Failed to run diagnostics', 
        details: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString()
      });
    } finally {
      setDiagnosing(false);
    }
  };

  const [adminNoteDraft, setAdminNoteDraft] = React.useState<string>('');
  const [myNoteDraft, setMyNoteDraft] = React.useState<string>('');
  const [updateMeetingMutation] = useUpdateMeetingMutation();
  const adminSaveTimer = React.useRef<number | null>(null);
  const personalSaveTimer = React.useRef<number | null>(null);
  const isInitialMount = React.useRef(true);

  // Initialize notes from meeting data
  React.useEffect(() => {
    if (!meeting || !meeting.id) {
      setAdminNoteDraft('');
      setMyNoteDraft('');
      return;
    }

    // Admin notes (universal)
    setAdminNoteDraft(meeting.notes || '');

    // Find current user's personal note
    const myNote = meeting.userNotes?.find(n => n.userId === user?.id);
    setMyNoteDraft(myNote?.content || '');
    isInitialMount.current = false;
  }, [meeting?.id, user?.id]); // Only depend on IDs to avoid unnecessary updates // More specific dependencies

  // Autosave admin notes with 1 second debounce
  React.useEffect(() => {
    // Skip if not admin, no meeting, or initial mount
    if (!isAdmin || !meeting?.id || !adminNoteDraft.trim() || isInitialMount.current) {
      return;
    }

    // Clear previous timer
    if (adminSaveTimer.current !== null) {
      window.clearTimeout(adminSaveTimer.current);
    }

    // Set new timer
    adminSaveTimer.current = window.setTimeout(async () => {
      if (!meeting?.id) return; // Double-check meeting ID exists
      
      try {
        const result = await updateMeetingMutation({ 
          id: meeting.id, 
          data: { notes: adminNoteDraft || null } 
        }).unwrap();
        
        if (result?.success) {
          toast.success('Admin notes saved ✓', {
            duration: 2000,
            position: 'bottom-right'
          });
        }
      } catch (err) {
        console.error('Admin notes save error:', err);
        toast.error('Failed to save admin notes', {
          duration: 3000,
          position: 'bottom-right'
        });
      }
    }, 1000) as unknown as number;

    // Cleanup: clear timer on unmount or when dependencies change
    return () => {
      if (adminSaveTimer.current !== null) {
        window.clearTimeout(adminSaveTimer.current);
        adminSaveTimer.current = null;
      }
    };
  }, [adminNoteDraft, isAdmin, meeting?.id]); // Removed updateMeetingMutation

  // Autosave personal notes with 1 second debounce
  React.useEffect(() => {
    // Skip if no meeting/user or initial mount
    if (!meeting?.id || !user?.id || !myNoteDraft.trim() || isInitialMount.current) {
      return;
    }

    // Clear previous timer
    if (personalSaveTimer.current !== null) {
      window.clearTimeout(personalSaveTimer.current);
    }

    // Set new timer
    personalSaveTimer.current = window.setTimeout(async () => {
      if (!meeting?.id || !user?.id) return; // Double-check IDs exist
      
      try {
        const result = await updateMeetingMutation({ 
          id: meeting.id, 
          data: { userNote: myNoteDraft || null } 
        }).unwrap();
        
        if (result?.success) {
          toast.success('Personal notes saved ✓', {
            duration: 2000,
            position: 'bottom-right'
          });
        }
      } catch (err) {
        console.error('Personal notes save error:', err);
        toast.error('Failed to save personal notes', {
          duration: 3000,
          position: 'bottom-right'
        });
      }
    }, 1000) as unknown as number;

    // Cleanup: clear timer on unmount or when dependencies change
    return () => {
      if (personalSaveTimer.current !== null) {
        window.clearTimeout(personalSaveTimer.current);
        personalSaveTimer.current = null;
      }
    };
  }, [myNoteDraft, meeting?.id, user?.id]); // Removed updateMeetingMutation

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { color: string; bg: string; label: string }> = {
      scheduled: { color: '#2563eb', bg: '#dbeafe', label: 'Scheduled' },
      completed: { color: '#16a34a', bg: '#dcfce7', label: 'Completed' },
      cancelled: { color: '#dc2626', bg: '#fee2e2', label: 'Cancelled' },
      rescheduled: { color: '#f59e0b', bg: '#fef3c7', label: 'Rescheduled' },
    };
    return statusMap[status] || { color: '#6b7280', bg: '#f3f4f6', label: status };
  };

  const handleDelete = async () => {
    if (!meeting) return;
    if (window.confirm('Are you sure you want to delete this meeting?')) {
      try {
        await deleteMeeting(meeting.id).unwrap();
        toast.success('Meeting deleted successfully');
        navigate('/meetings');
      } catch (err) {
        toast.error('Failed to delete meeting');
      }
    }
  };


  if (isLoading) {
    return (
      <div className="meeting-detail-page">
        <div className="loading-spinner">
          <div>Loading meeting details...</div>
          {id && <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '8px' }}>Meeting ID: {id}</div>}
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    const isEmployee = user?.role === 'employee';
    const isAdmin = user?.role === 'admin';
    
    return (
      <div className="meeting-detail-page">
        <Link to="/meetings" className="back-link">← Back to Meetings</Link>
        <div className="error-message">
          <h3>Meeting not found</h3>
          
          {isEmployee ? (
            <div>
              <p>You are logged in as an <strong>Employee</strong>. You can only view meetings you are assigned to.</p>
              <div style={{ marginTop: '12px', padding: '12px', background: '#fff3cd', borderRadius: '6px', textAlign: 'left' }}>
                <strong>What to do:</strong>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                  <li>Ask an admin to assign you to this meeting</li>
                  <li>Or go to <Link to="/meetings" style={{ color: '#2563eb', textDecoration: 'underline' }}>Meetings List</Link> to see meetings you're assigned to</li>
                </ul>
              </div>
            </div>
          ) : isAdmin ? (
            <div>
              <p>You are logged in as an <strong>Admin</strong>. This meeting either doesn't exist or has been deleted.</p>
              <div style={{ marginTop: '12px', padding: '12px', background: '#f8d7da', borderRadius: '6px', textAlign: 'left' }}>
                <strong>Possible reasons:</strong>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                  <li>The meeting has been permanently deleted</li>
                  <li>The Meeting ID is incorrect or malformed</li>
                  <li>Database connection issue</li>
                </ul>
              </div>
            </div>
          ) : (
            <p>The meeting you're looking for doesn't exist, has been deleted, or you don't have permission to view it.</p>
          )}

          {id && (
            <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(0,0,0,0.05)', borderRadius: '6px', fontSize: '0.85rem' }}>
              <strong>Meeting ID:</strong> <code>{id}</code>
            </div>
          )}

          {/* Debug Info */}
          <div style={{ marginTop: '16px', padding: '12px', background: '#f0f0f0', borderRadius: '6px', fontSize: '0.8rem', fontFamily: 'monospace' }}>
            <strong>Debug Info:</strong>
            <div style={{ marginTop: '6px', lineHeight: '1.8' }}>
              <div>📌 Your User ID: <strong>{user?.id || 'Not logged in'}</strong></div>
              <div>👤 Your Role: <strong>{user?.role || 'Unknown'}</strong></div>
              <div>✉️ Your Email: <strong>{user?.email || 'N/A'}</strong></div>
              <div>🔐 Token Status: <strong>{localStorage.getItem('token') ? '✓ Valid' : '✗ Missing'}</strong></div>
            </div>
          </div>

          <button 
            onClick={() => refetch()} 
            style={{
              marginTop: '16px',
              marginRight: '8px',
              padding: '10px 16px',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}
          >
            Try Again
          </button>
          <button 
            onClick={() => navigate('/meetings')} 
            style={{
              marginTop: '16px',
              marginRight: '8px',
              padding: '10px 16px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}
          >
            Back to Meetings
          </button>

          {isAdmin && (
            <button 
              onClick={runDiagnostics}
              disabled={diagnosing}
              style={{
                marginTop: '16px',
                padding: '10px 16px',
                background: diagnosing ? '#ccc' : '#f97316',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: diagnosing ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}
            >
              {diagnosing ? 'Checking...' : '🔍 Run Diagnostics'}
            </button>
          )}

          {diagnosticResult && (
            <div style={{ marginTop: '16px', padding: '12px', background: diagnosticResult.success ? '#d1fae5' : '#fee2e2', borderRadius: '6px', fontSize: '0.8rem', fontFamily: 'monospace' }}>
              <strong>{diagnosticResult.success ? '✓ Meeting Found' : '✗ Meeting Not Found'}</strong>
              <pre style={{ marginTop: '8px', whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontSize: '0.75rem', maxHeight: '200px', overflow: 'auto' }}>
                {JSON.stringify(diagnosticResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(meeting.status);

  return (
    <div className="meeting-detail-page">
      <Link to="/meetings" className="back-link">← Back to Meetings</Link>
      
      {/* Meeting Header */}
      <div className="meeting-detail-header">
        <div className="meeting-detail-title-section">
          <h2>{meeting.title}</h2>
          <span 
            className="meeting-status-badge"
            style={{ backgroundColor: statusInfo.bg, color: statusInfo.color }}
          >
            {statusInfo.label}
          </span>
        </div>
        <div className="meeting-type-badge">
          {meeting.meetingType === 'online' ? <><HiOutlineGlobeAlt /> Online Meeting</> : <><HiOutlineLocationMarker /> In-Person Meeting</>}
        </div>
      </div>

      {/* Join Meeting Card - Prominent for online meetings */}
      {meeting.meetingType === 'online' && meeting.meetingLink && (
        <div className="join-meeting-card">
          <div className="join-meeting-content">
            <div className="join-meeting-icon"><HiOutlineVideoCamera /></div>
            <div className="join-meeting-info">
              <h3>Join Meeting</h3>
              <p>Click the button below to join this online meeting</p>
            </div>
          </div>
          <a 
            href={meeting.meetingLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn-join-meeting"
          >
            Join Now
          </a>
        </div>
      )}

      {/* Location Card - For offline meetings */}
      {meeting.meetingType === 'offline' && meeting.location && (
        <div className="location-card">
          <div className="location-icon"><HiOutlineLocationMarker /></div>
          <div className="location-info">
            <h3>Meeting Location</h3>
            <p>{meeting.location}</p>
          </div>
        </div>
      )}

      {/* Meeting Details */}
      <div className="meeting-detail-card">
        <h3>Meeting Details</h3>
        
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-icon"><HiOutlineCalendar /></span>
            <div className="detail-content">
              <label>Start Time</label>
              <span>{formatDateTime(meeting.startTime)}</span>
            </div>
          </div>
          
          <div className="detail-item">
            <span className="detail-icon"><HiOutlineClock /></span>
            <div className="detail-content">
              <label>End Time</label>
              <span>{formatDateTime(meeting.endTime)}</span>
            </div>
          </div>

          {meeting.assignees && meeting.assignees.length > 0 && (
            <div className="detail-item full-width">
              <span className="detail-icon"><HiOutlineUserGroup /></span>
              <div className="detail-content">
                <label>Participants</label>
                <div className="participants-list">
                  {meeting.assignees.map(a => (
                    <span key={a.id} className="participant-chip" title={a.email}>
                      {a.full_name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {meeting.createdBy_name && (
            <div className="detail-item">
              <span className="detail-icon"><HiOutlinePencil /></span>
              <div className="detail-content">
                <label>Organized By</label>
                <span>{meeting.createdBy_name}</span>
              </div>
            </div>
          )}

          {meeting.recurrence && (
            <div className="detail-item">
              <span className="detail-icon"><HiOutlineRefresh /></span>
              <div className="detail-content">
                <label>Recurrence</label>
                <span style={{ textTransform: 'capitalize' }}>{meeting.recurrence}</span>
              </div>
            </div>
          )}

          {meeting.description && (
            <div className="detail-item full-width">
              <span className="detail-icon"><HiOutlineDocumentText /></span>
              <div className="detail-content">
                <label>Meeting Message</label>
                <span style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{meeting.description}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Admin Notes Section (Universal - visible to all) */}
      <div className="meeting-notes-card">
        <h3><HiOutlineDocumentText className="section-icon" /> Admin Notes</h3>
        <div className="notes-content">
          {isAdmin ? (
            <div className="meeting-notes-editor">
              <textarea
                value={adminNoteDraft}
                onChange={(e) => setAdminNoteDraft(e.target.value)}
                placeholder="Add official meeting notes visible to all participants..."
                rows={4}
              />
              <div className="editor-saving" aria-live="polite">
                <span className="saving-indicator">✓ Auto-saving</span>
              </div>
            </div>
          ) : (
            <div className="notes-display">
              {meeting.notes ? (
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{meeting.notes}</div>
              ) : (
                <div className="no-notes">No admin notes yet.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Personal Notes Section (User-specific) */}
      <div className="meeting-notes-card">
        <h3><HiOutlinePencil className="section-icon" /> My Personal Notes</h3>
        <div className="notes-content">
          <div className="meeting-notes-editor">
            <textarea
              value={myNoteDraft}
              onChange={(e) => setMyNoteDraft(e.target.value)}
              placeholder="Add your personal notes about this meeting (only visible to you)..."
              rows={4}
            />
            <div className="editor-saving" aria-live="polite">
              <span className="saving-indicator">✓ Auto-saving</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes File Attachment */}
      {meeting.notesFileName && (
        <div className="meeting-notes-card">
          <h3><HiOutlineDocumentText className="section-icon" /> Attachment</h3>
          <div className="notes-content">
            <a href={`/api/meetings/${meeting.id}/notes-file`} target="_blank" rel="noopener noreferrer" className="btn-link">
              {meeting.notesFileName}
            </a>
          </div>
        </div>
      )}

      {/* Meeting Link Info (for reference) */}
      {meeting.meetingType === 'online' && meeting.meetingLink && (
        <div className="meeting-link-info">
          <label>Meeting Link:</label>
          <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer">
            {meeting.meetingLink}
          </a>
        </div>
      )}

      {/* Admin Actions */}
      {isAdmin && (
        <div className="meeting-detail-actions">
          <button className="btn-secondary" onClick={() => navigate('/meetings')}>
            Back to List
          </button>
          <button className="btn-primary" onClick={() => navigate(`/meetings/${meeting.id}/edit`)}>
            Edit Meeting
          </button>
          <button className="btn-danger" onClick={handleDelete}>
            Delete Meeting
          </button>
        </div>
      )}

      {/* Employee Back Button */}
      {!isAdmin && (
        <div className="meeting-detail-actions">
          <button className="btn-secondary" onClick={() => navigate('/meetings')}>
            Back to Meetings
          </button>
        </div>
      )}
    </div>
  );
};

export default MeetingDetailPage;
