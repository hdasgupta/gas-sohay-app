import React, { useState } from 'react';

export default function PaginatedList({
  items = [],
  itemProcessor, // Callback function: (item, index) => JSX
  itemsPerPageOptions = [5, 10, 20],
  defaultItemsPerPage = 5
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);

  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = items.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  if (!items || items.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px' }}>
        No items available.
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Item Processing & Rendering Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {currentItems.map((item, index) => itemProcessor(item))}
      </div>

      {/* Pagination Controls */}
      <div
        style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid #e2e8f0',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        {/* Counter & Page Size Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#64748b' }}>
          <span>
            Showing <b>{indexOfFirstItem + 1}</b> to <b>{Math.min(indexOfLastItem, totalItems)}</b> of <b>{totalItems}</b>
          </span>

          <select
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
          >
            {itemsPerPageOptions.map((size) => (
              <option key={size} value={size}>
                {size} per page
              </option>
            ))}
          </select>
        </div>

        {/* Page Buttons */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: currentPage === 1 ? '#f1f5f9' : '#ffffff',
              color: currentPage === 1 ? '#94a3b8' : '#334155',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => handlePageChange(page)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: page === currentPage ? '1px solid #2563eb' : '1px solid #cbd5e1',
                background: page === currentPage ? '#2563eb' : '#ffffff',
                color: page === currentPage ? '#ffffff' : '#334155',
                fontWeight: page === currentPage ? 'bold' : 'normal',
                cursor: 'pointer'
              }}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: currentPage === totalPages ? '#f1f5f9' : '#ffffff',
              color: currentPage === totalPages ? '#94a3b8' : '#334155',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
