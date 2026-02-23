import React from 'react';

export interface MeetingPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const MeetingPagination: React.FC<MeetingPaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  // Simple pagination controls
  return (
    <div className="meeting-pagination">
      <button disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
        Previous
      </button>
      <span>
        Page {currentPage} of {totalPages}
      </span>
      <button disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>
        Next
      </button>
    </div>
  );
};
