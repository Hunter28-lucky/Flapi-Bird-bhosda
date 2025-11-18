// Simple native card component
export const Card = ({ children, className = '', ...props }: any) => {
  return (
    <div 
      className={`bg-white rounded-xl shadow-lg p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
