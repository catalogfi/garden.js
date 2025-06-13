import React, { ReactNode } from 'react';

interface ButtonProps {
    children?: ReactNode;
    onClick?: React.MouseEventHandler<HTMLDivElement>;
    className?: string;
    secondary?: boolean;
    disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ children, className, secondary, disabled, ...props }) => {
    return (
        <div className={`px-3 py-1 hover:text-white flex rounded-md bg-[#E36492] hover:bg-opacity-90 transition-all duration-200 ease-in-out cursor-pointer w-full ${disabled ? "border-gray-300 bg-gray-300 text-gray-500 pointer-events-none" : ""} ${secondary ? "border-none bg-opacity-10" : "bg-opacity-60 border border-[#E36492]"}`}
            {...props}
        >
            {children}
        </div>
    );
};