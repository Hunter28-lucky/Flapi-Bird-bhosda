import React, { useEffect, useState } from "react";

interface JumpscareOverlayProps {
  show: boolean;
  onComplete: () => void;
}

export const JumpscareOverlay: React.FC<JumpscareOverlayProps> = ({ show, onComplete }) => {
  useEffect(() => {
    if (show) {
      // Vibrate for 1 second then go back to normal
      const timer = setTimeout(() => {
        onComplete();
      }, 1000);
      
      // Optional: Add browser vibration API if supported
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-black/80 animate-vibrate">
      <img 
        src="/jumpscare.png" 
        alt="Jumpscare"
        className="w-full h-full object-cover"
        // If image is missing, we still want it to look decent
        onError={(e) => {
          (e.target as HTMLImageElement).src = "https://i.ibb.co/KVxJgYg/placeholder.png";
        }}
      />
    </div>
  );
};
