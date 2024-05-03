import React from 'react';


interface ButtonProps {
  /**
   * Is this the principal call to action on the page?
   */
  primary?: boolean;
  /**
   * What background color to use
   */
  backgroundColor?: string;
  /**
   * How large should the button be?
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * Button contents
   */
  label: string;
  
  onClick?: () => void;
}


export const Button = ({
  primary = false,
  size = 'medium',
  backgroundColor,
  label,
  ...props
}: ButtonProps) => {
  const mode = primary ? 'storybook-button--primary' : 'storybook-button--secondary';
  return (
    <button
      type="button"
      className={" text-red-900 font-bold bg-blue-300 border-2 border-blue-300 rounded-lg px-4 py-2 m-2"}
      style={{ backgroundColor }}
      {...props}
    >
      {label}
    </button>
  );
};
