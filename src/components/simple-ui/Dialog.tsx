// Simple native dialog component
import { useEffect } from 'react';

export const Dialog = ({ open, onOpenChange, children }: any) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={() => onOpenChange?.(false)}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

export const DialogContent = ({ children, className = '' }: any) => {
  return (
    <div className={`relative bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto ${className}`}>
      {children}
    </div>
  );
};

export const DialogHeader = ({ children, className = '' }: any) => {
  return <div className={`mb-4 ${className}`}>{children}</div>;
};

export const DialogTitle = ({ children, className = '' }: any) => {
  return <h2 className={`text-2xl font-bold ${className}`}>{children}</h2>;
};
