// Simple native button component
export const Button = ({ 
  children, 
  onClick, 
  className = '',
  variant = 'default',
  size = 'default',
  disabled = false,
  ...props 
}: any) => {
  const baseStyles = 'px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer border-none outline-none';
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 active:scale-95',
    destructive: 'bg-red-600 text-white hover:bg-red-700 active:scale-95',
    outline: 'bg-transparent border-2 border-gray-300 hover:bg-gray-100 active:scale-95',
  };
  
  const sizes = {
    default: 'text-base',
    sm: 'text-sm px-3 py-1',
    lg: 'text-lg px-6 py-3',
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant] || variants.default} ${sizes[size] || sizes.default} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
