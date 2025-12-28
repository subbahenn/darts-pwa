import React from 'react';
import './Dialog.css';

interface DialogProps {
  isOpen: boolean;
  title?: string;
  message: string;
  type?: 'alert' | 'confirm';
  onConfirm: () => void;
  onCancel?: () => void;
}

const Dialog: React.FC<DialogProps> = ({
  isOpen,
  title,
  message,
  type = 'alert',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && type === 'alert') {
      onConfirm();
    }
  };

  return (
    <div className="dialog-overlay" onClick={handleOverlayClick}>
      <div className="dialog-content">
        {title && <h3 className="dialog-title">{title}</h3>}
        <p className="dialog-message">{message}</p>
        <div className="dialog-actions">
          {type === 'confirm' && onCancel && (
            <button className="dialog-button dialog-button-secondary" onClick={onCancel}>
              Abbrechen
            </button>
          )}
          <button className="dialog-button dialog-button-primary" onClick={onConfirm}>
            {type === 'confirm' ? 'Bestätigen' : 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dialog;
