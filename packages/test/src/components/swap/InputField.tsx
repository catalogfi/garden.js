"use client";

import React from "react";

type InputFieldProps = {
  id: string;
  label: string;
  value: string | null;
  readOnly?: boolean;
  error?: string | null;
  onChange?: (value: string) => void;
  placeholder?: string;
};

const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  value,
  readOnly,
  error,
  onChange,
  placeholder,
}) => (
  <div className="flex flex-col gap-2 bg-gray-700 rounded-2xl p-4">
    <label htmlFor={id} className="block text-sm font-medium text-white">
      {label}
    </label>
    <input
      id={id}
      placeholder={placeholder}
      value={value || ""}
      type="text"
      readOnly={readOnly}
      onChange={(e) => onChange?.(e.target.value)}
      className={`w-full rounded-md bg-gray-700 text-white outline-none`}
    />
    {error && <p className="text-sm text-red-500">{error}</p>}
  </div>
);

export default InputField;
