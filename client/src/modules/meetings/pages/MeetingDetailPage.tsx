import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGetMeetingQuery, useDeleteMeetingMutation, useUpdateMeetingMutation } from '../api/meetingsApi';
import { useAppSelector } from '../../../hooks/redux';
import toast from 'react-hot-toast';
import '../../../styles/MeetingsList.css';

const MeetingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: response, isLoading, error } = useGetMeetingQuery(id || '', { skip: !id });
  const [deleteMeeting] = useDeleteMeetingMutation();
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'admin';

  const meeting = response?.data;

  const [noteDraft, setNoteDraft] = React.useState<string>('');
  const [updateMeetingMutation, { isLoading: isUpdatingNote }] = useUpdateMeetingMutation();
  const [lastMyNote, setLastMyNote] = React.useState<string>('');
  const [editingIdx, setEditingIdx] = React.useState<number | null>(null);
  const [editingText, setEditingText] = React.useState<string>('');

  // Initialize editor with the latest note authored by the current user (so employees edit only their contribution)
  React.useEffect(() => {
    if (!meeting) {
      setNoteDraft('');
      setLastMyNote('');
      return;
    }

    const extractBracketedEntries = (raw: string | null) => {
      if (!raw) return [] as Array<{ time?: string; author?: string; content: string }>;
      const entries: Array<{ time?: string; author?: string; content: string }> = [];
      const re = /\[(.*?) - (.*?)\]\s*\n([\s\S]*?)(?=(?:\n\s*\[|$))/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(raw)) !== null) {
        entries.push({ time: m[1], author: m[2], content: m[3].trim() });
      }
      return entries;
    };

    const currentUserName = user?.full_name;
    const entries = extractBracketedEntries(meeting.notes || null);
    let myLast = '';
    if (entries.length > 0 && currentUserName) {
      for (let i = entries.length - 1; i >= 0; i--) {
        if (entries[i].author === currentUserName) { myLast = entries[i].content; break; }
      }
    }

    // Fallback: if no bracketed entries or none by current user, try last plain block
    if (!myLast) {
      if (!meeting.notes) myLast = '';
      else {
        const blocks = meeting.notes.split(/\n\n+/).map(b => b.trim()).filter(Boolean);
        myLast = blocks.length ? blocks[blocks.length - 1] : '';
      }
    }

    setLastMyNote(myLast);
    setNoteDraft(myLast || '');
  }, [meeting, user]);

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
        <div className="loading-spinner">Loading meeting details...</div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="meeting-detail-page">
        <Link to="/meetings" className="back-link">← Back to Meetings</Link>
        <div className="error-message">
          <h3>Meeting not found</h3>
          <p>The meeting you're looking for doesn't exist or has been deleted.</p>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(meeting.status);

  const parseNotes = (raw: string | null) => {
    if (!raw) return [] as Array<{ time?: string; author?: string; content: string }>;
    const entries: Array<{ time?: string; author?: string; content: string }> = [];
    // Extract all bracketed entries like: [ISO - Author]\nContent
    const re = /\[(.*?) - (.*?)\]\s*\n([\s\S]*?)(?=(?:\n\s*\[|$))/g;
    let m: RegExpExecArray | null;
    const consumedRanges: Array<[number, number]> = [];
    while ((m = re.exec(raw)) !== null) {
      entries.push({ time: m[1], author: m[2], content: m[3].trim() });
      consumedRanges.push([m.index, re.lastIndex]);
    }

    // Remove consumed bracketed parts and treat leftover plain blocks as general notes
    if (consumedRanges.length > 0) {
      // Build leftover string
      let leftover = '';
      let last = 0;
      for (const [start, end] of consumedRanges) {
        if (start > last) leftover += raw.slice(last, start);
        last = end;
      }
      if (last < raw.length) leftover += raw.slice(last);
      const blocks = leftover.split(/\n\n+/).map(b => b.trim()).filter(Boolean);
      for (const blk of blocks) entries.unshift({ content: blk });
    } else {
      // No bracketed entries — split by double newlines
      const blocks = raw.split(/\n\n+/).map(b => b.trim()).filter(Boolean);
      for (const blk of blocks) entries.push({ content: blk });
    }

    // Deduplicate (some meeting blobs may contain duplicate appended entries)
    const seen = new Set<string>();
    const unique: Array<{ time?: string; author?: string; content: string }> = [];
    for (const e of entries) {
      const key = `${e.time || ''}||${e.author || ''}||${(e.content || '').trim()}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(e);
      }
    }

    // Return in natural chronological order: earliest first
    return unique;
  };

  const notesEntries = parseNotes(meeting.notes || null);

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
          {meeting.meetingType === 'online' ? '🌐 Online Meeting' : '📍 In-Person Meeting'}
        </div>
      </div>

      {/* Join Meeting Card - Prominent for online meetings */}
      {meeting.meetingType === 'online' && meeting.meetingLink && (
        <div className="join-meeting-card">
          <div className="join-meeting-content">
            <div className="join-meeting-icon">🎥</div>
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
          <div className="location-icon">📍</div>
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
            <span className="detail-icon">📅</span>
            <div className="detail-content">
              <label>Start Time</label>
              <span>{formatDateTime(meeting.startTime)}</span>
            </div>
          </div>
          
          <div className="detail-item">
            <span className="detail-icon">⏰</span>
            <div className="detail-content">
              <label>End Time</label>
              <span>{formatDateTime(meeting.endTime)}</span>
            </div>
          </div>

          {meeting.assignees && meeting.assignees.length > 0 && (
            <div className="detail-item full-width">
              <span className="detail-icon">👥</span>
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
              <span className="detail-icon">✍️</span>
              <div className="detail-content">
                <label>Organized By</label>
                <span>{meeting.createdBy_name}</span>
              </div>
            </div>
          )}

          {meeting.recurrence && (
            <div className="detail-item">
              <span className="detail-icon">🔁</span>
              <div className="detail-content">
                <label>Recurrence</label>
                <span style={{ textTransform: 'capitalize' }}>{meeting.recurrence}</span>
              </div>
            </div>
          )}

          {meeting.description && (
            <div className="detail-item full-width">
              <span className="detail-icon">📝</span>
              <div className="detail-content">
                <label>Meeting Message</label>
                <span style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{meeting.description}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notes Section */}
      <div className="meeting-notes-card">
        <h3>📝 Meeting Notes</h3>
        <div className="notes-content">
          {notesEntries.length > 0 ? (
            <div className="notes-entries">
              {notesEntries.map((entry, idx) => (
                <article className="note-entry" key={idx}>
                  {/* NOTE: author/time intentionally hidden per request — only show content */}
                  <div className="note-body">
                    {editingIdx === idx ? (
                      <div className="note-editing">
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          rows={4}
                        />
                        <div className="note-edit-actions">
                          <button
                            className="btn-secondary"
                            onClick={() => { setEditingIdx(null); setEditingText(''); }}
                            type="button"
                          >
                            Cancel
                          </button>
                          <button
                            className="btn-primary"
                            onClick={async () => {
                              try {
                                // Build new entries with edited content and update server with full replace
                                const newEntries = notesEntries.map((e, i) => {
                                  if (i !== idx) return e;
                                  return {
                                    ...e,
                                    content: editingText
                                    // Keep original time/author metadata
                                  };
                                });

                                const buildNotesFromEntries = (entries: Array<{ time?: string; author?: string; content: string }>) => {
                                  return entries.map(en => {
                                    if (en.time || en.author) {
                                      const time = en.time || new Date().toISOString();
                                      const author = en.author || 'Employee';
                                      return `[${time} - ${author}]\n${en.content}`;
                                    }
                                    return en.content;
                                  }).join('\n\n');
                                };

                                const newNotes = buildNotesFromEntries(newEntries);
                                await updateMeetingMutation({ id: meeting.id, data: { notes: newNotes || null, replaceNotes: true } }).unwrap();
                                toast.success('Note updated');
                                setEditingIdx(null);
                                setEditingText('');
                              } catch (err) {
                                console.error('Edit error:', err);
                                toast.error('Failed to update note');
                              }
                            }}
                            type="button"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {entry.content.split('\n').map((p, i) => (
                          <p key={i}>{p}</p>
                        ))}
                      </>
                    )}
                  </div>
                  <div className="note-actions">
                    <button
                      className="icon-btn"
                      title="Edit note"
                      onClick={() => { setEditingIdx(idx); setEditingText(entry.content); }}
                      type="button"
                    >
                      ✏️
                    </button>
                    <button
                      className="icon-btn"
                      title="Delete note"
                      onClick={async () => {
                        if (!window.confirm('Delete this note?')) return;
                        try {
                          const newEntries = notesEntries.filter((_, i) => i !== idx);
                          const buildNotesFromEntries = (entries: Array<{ time?: string; author?: string; content: string }>) => {
                            return entries.map(en => {
                              if (en.time || en.author) {
                                const time = en.time || new Date().toISOString();
                                const author = en.author || 'Employee';
                                return `[${time} - ${author}]\n${en.content}`;
                              }
                              return en.content;
                            }).join('\n\n');
                          };
                          const newNotes = buildNotesFromEntries(newEntries);
                          await updateMeetingMutation({ id: meeting.id, data: { notes: newNotes || null, replaceNotes: true } }).unwrap();
                          toast.success('Note deleted');
                        } catch (err) {
                          console.error('Delete error:', err);
                          toast.error('Failed to delete note');
                        }
                      }}
                      type="button"
                    >
                      🗑️
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="no-notes">No notes yet.</div>
          )}

          {meeting.notesFileName && (
            <div className="notes-file">
              <label>Attachment:</label>
              <a href={`/api/meetings/${meeting.id}/notes-file`} target="_blank" rel="noopener noreferrer" className="btn-link">
                {meeting.notesFileName}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Note editor - for both admins and employees */}
      <div className="meeting-notes-editor">
        <h4>{isAdmin ? 'Add Admin Note' : 'Your Note'}</h4>
        <textarea
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          placeholder={isAdmin ? 'Add admin notes or comments about this meeting...' : 'Add your notes or comments about this meeting...'}
          rows={6}
        />
        <div className="editor-actions">
          <button
            className="btn-secondary"
            onClick={() => setNoteDraft(lastMyNote || '')}
            type="button"
          >
            Reset
          </button>
          <button
            className="btn-primary"
            disabled={isUpdatingNote}
            onClick={async () => {
              try {
                const result = await updateMeetingMutation({ id: meeting.id, data: { notes: noteDraft || null, replaceNotes: isAdmin } }).unwrap();
                if (result.success) {
                  toast.success('Note saved');
                }
              } catch (err) {
                console.error('Save error:', err);
                toast.error('Failed to save note');
              }
            }}
            type="button"
          >
            {isUpdatingNote ? 'Saving...' : 'Save Note'}
          </button>
        </div>
      </div>

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
