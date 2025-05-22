
import React from "react";
import { Slider as ShadcnSlider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface SliderProps {
  id: string;
  label: string;
  value: number[];
  onChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  showValue?: boolean;
  precision?: number;
}

const Slider: React.FC<SliderProps> = ({
  id,
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  disabled = false,
  className = "",
  showValue = true,
  precision = 2,
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center">
        <Label htmlFor={id} className="text-xs font-medium">
          {label}
        </Label>
        {showValue && (
          <span className="text-xs text-muted-foreground">
            {value.map(v => v.toFixed(precision)).join(", ")}
          </span>
        )}
      </div>
      <ShadcnSlider
        id={id}
        value={value}
        onValueChange={onChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
      />
    </div>
  );
};

export default Slider;
