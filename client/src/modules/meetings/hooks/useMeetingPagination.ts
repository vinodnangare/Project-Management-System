import { useState } from 'react';

export function useMeetingPagination(totalPages: number) {
  const [currentPage, setCurrentPage] = useState(1);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return {
    currentPage,
    goToPage,
  };
}
