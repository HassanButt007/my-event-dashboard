import React from 'react';

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  title?: string;
}

const Form: React.FC<FormProps> = ({ title, children, ...props }) => {
  return (
    <form {...props} className="space-y-4">
      {title && <h2 className="text-lg font-semibold">{title}</h2>}
      {children}
    </form>
  );
};

export default Form;