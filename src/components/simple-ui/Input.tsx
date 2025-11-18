// Simple native input component
export const Input = ({ 
  className = '', 
  placeholder = '',
  value,
  onChange,
  type = 'text',
  ...props 
}: any) => {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none transition-colors ${className}`}
      {...props}
    />
  );
};
