import React, { useState } from 'react';
import type { TaskCommentsTabProps } from '../types/components/TaskCommentsTabProps';

export const TaskCommentsTab: React.FC<TaskCommentsTabProps> = ({
  comments,
  onAddComment,
  isAdding
}) => {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = async () => {
    if (newComment.trim()) {
      await onAddComment(newComment);
      setNewComment('');
    }
  };

  return (
    <div className="comments-section">
      <div className="add-comment">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
        />
        <button onClick={handleSubmit} disabled={!newComment.trim() || isAdding}>
          {isAdding ? 'Posting...' : 'Post Comment'}
        </button>
      </div>

      <div className="comments-list">
        {comments.length === 0 ? (
          <div className="empty-state">No comments yet</div>
        ) : (
          comments.map((comment: any) => (
            <div key={comment.id} className="comment">
              <div className="comment-header">
                <strong>
                  {comment.created_by_user?.full_name || comment.created_by_user?.email || comment.created_by_name || comment.created_by_email || comment.created_by}
                </strong>
                <span className="timestamp">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              <p>{comment.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
