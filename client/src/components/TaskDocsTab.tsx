import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useGetTaskDocQuery, useUpsertTaskDocMutation } from '../services/api';
import type { TaskDocsTabProps } from '../types/components/TaskDocsTabProps';

export const TaskDocsTab: React.FC<TaskDocsTabProps> = ({ taskId, isAdmin }) => {
  const { data: doc, isLoading, error } = useGetTaskDocQuery(taskId, {
    skip: !taskId,
  });
  const [upsertDoc, { isLoading: isSaving }] = useUpsertTaskDocMutation();
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!isEditing) {
      setContent(doc?.content || '');
    }
  }, [doc, isEditing]);

  const handleSave = async () => {
    await upsertDoc({ taskId, content }).unwrap();
    setIsEditing(false);
  };

  const applyFormat = (type: 'bold' | 'italic' | 'heading' | 'ul' | 'ol' | 'code' | 'quote' | 'link') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.slice(start, end) || '';
    let replacement = '';

    switch (type) {
      case 'bold':
        replacement = `**${selected || 'bold text'}**`;
        break;
      case 'italic':
        replacement = `*${selected || 'italic text'}*`;
        break;
      case 'heading':
        replacement = `## ${selected || 'Heading'}`;
        break;
      case 'ul':
        replacement = selected
          ? selected.split('\n').map((line) => `- ${line}`).join('\n')
          : '- List item';
        break;
      case 'ol':
        replacement = selected
          ? selected.split('\n').map((line, i) => `${i + 1}. ${line}`).join('\n')
          : '1. List item';
        break;
      case 'code':
        replacement = selected ? `\`${selected}\`` : '`code`';
        break;
      case 'quote':
        replacement = selected
          ? selected.split('\n').map((line) => `> ${line}`).join('\n')
          : '> Quote';
        break;
      case 'link':
        replacement = `[${selected || 'Link text'}](https://example.com)`;
        break;
      default:
        replacement = selected;
    }

    const next = content.slice(0, start) + replacement + content.slice(end);
    setContent(next);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + replacement.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  if (isLoading) {
    return <div className="docs-section">Loading docs...</div>;
  }

  if (error) {
    return <div className="docs-section">Failed to load docs.</div>;
  }

  return (
    <div className="docs-section">
      <div className="docs-header">
        <div>
          <h3>Task Docs</h3>
          <p className="docs-subtitle">Markdown notes for this task</p>
        </div>
        {isAdmin && (
          <div className="docs-actions">
            {!isEditing ? (
              <button className="docs-btn" onClick={() => setIsEditing(true)}>
                Edit
              </button>
            ) : (
              <div className="docs-action-group">
                <button className="docs-btn secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
                <button className="docs-btn" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {isEditing && isAdmin ? (
        <div className="docs-editor">
          <div className="docs-editor-panel">
            <div className="docs-toolbar">
              <button type="button" onClick={() => applyFormat('bold')}>B</button>
              <button type="button" onClick={() => applyFormat('italic')}>I</button>
              <button type="button" onClick={() => applyFormat('heading')}>H2</button>
              <button type="button" onClick={() => applyFormat('ul')}>• List</button>
              <button type="button" onClick={() => applyFormat('ol')}>1. List</button>
              <button type="button" onClick={() => applyFormat('quote')}>❝ Quote</button>
              <button type="button" onClick={() => applyFormat('code')}>Code</button>
              <button type="button" onClick={() => applyFormat('link')}>Link</button>
            </div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write markdown here..."
            />
          </div>
          <div className="docs-preview">
            <p className="preview-title">Preview</p>
            <div className="markdown-body">
              <ReactMarkdown>{content || '_No content yet_'}</ReactMarkdown>
            </div>
          </div>
        </div>
      ) : (
        <div className="markdown-body">
          <ReactMarkdown>{doc?.content || '_No docs created yet._'}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default TaskDocsTab;
