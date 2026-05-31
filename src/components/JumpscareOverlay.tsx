import React, { useEffect, useState } from "react";
import amitabhFace from "@/assets/amitabh-face.png";

interface JumpscareOverlayProps {
  show: boolean;
  onComplete: () => void;
}

export const JumpscareOverlay: React.FC<JumpscareOverlayProps> = ({ show, onComplete }) => {
  const [imgSrc, setImgSrc] = useState("/jumpscare.png");

  useEffect(() => {
    if (show) {
      // Vibrate for 1 second then go back to normal
      const timer = setTimeout(() => {
        onComplete();
        setImgSrc("/jumpscare.png"); // Reset for next time
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
        src={imgSrc} 
        alt="Jumpscare"
        className="w-full h-full object-cover"
        // If image is missing from public folder, fallback to default amitabh face
        onError={() => {
          setImgSrc(amitabhFace);
        }}
      />
    </div>
  );
};
