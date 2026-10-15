import React from 'react';

interface ErrorBannerProps {
  message: string;
  errors?: string[];
  onRetry?: () => void;
  onDismiss?: () => void;
  onClose?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message,
  errors = [],
  onRetry,
  onDismiss,
  onClose,
}) => {
  const handleDismiss = onClose || onDismiss;
  return (
    <div className="error-banner">
      <div className="error-banner-header">
        <div className="error-banner-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>{message}</span>
        </div>
        <div className="error-banner-actions">
          {onRetry && (
            <button className="btn btn-secondary btn-sm" onClick={onRetry}>
              Retry
            </button>
          )}
          {handleDismiss && (
            <button className="btn-close" onClick={handleDismiss} aria-label="Dismiss">
              ✕
            </button>
          )}
        </div>
      </div>
      {errors.length > 0 && (
        <ul className="error-list">
          {errors.map((err, idx) => (
            <li key={idx}>{err}</li>
          ))}
        </ul>
      )}
    </div>
  );
};
