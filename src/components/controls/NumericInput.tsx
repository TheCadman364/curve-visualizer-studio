
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NumericInputProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
}

const NumericInput: React.FC<NumericInputProps> = ({
  id,
  label,
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 0.1,
  disabled = false,
  className = "",
}) => {
  const [inputValue, setInputValue] = useState<string>(value.toString());

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleBlur = () => {
    let newValue = parseFloat(inputValue);
    
    if (isNaN(newValue)) {
      newValue = value;
    } else {
      newValue = Math.max(min, Math.min(max, newValue));
    }
    
    setInputValue(newValue.toString());
    onChange(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleBlur();
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <Label htmlFor={id} className="text-xs font-medium">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        step={step}
        disabled={disabled}
        className="h-8"
      />
    </div>
  );
};

export default NumericInput;
