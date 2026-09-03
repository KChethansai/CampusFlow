import React from 'react';

export default function Card({ children, className = '', title, action }) {
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      {(title || action) && (
        <div className="flex justify-between items-center mb-4">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}