import React from 'react';

interface ErrorBannerProps {
  message: string;
  errors?: string[];
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message,
  errors = [],
  onRetry,
  onDismiss,
}) => {
  return (
    <div className="error-banner">
      <div className="error-banner-header">
        <div className="error-banner-title">
          <span className="error-icon">⚠️</span>
          <span>{message}</span>
        </div>
        <div className="error-banner-actions">
          {onRetry && (
            <button className="btn btn-secondary btn-sm" onClick={onRetry}>
              Retry
            </button>
          )}
          {onDismiss && (
            <button className="btn-close" onClick={onDismiss} aria-label="Dismiss">
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
