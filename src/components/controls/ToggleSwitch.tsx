
import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ToggleSwitchProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  id,
  label,
  checked,
  onChange,
  disabled = false,
  className = "",
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
      />
      <Label htmlFor={id} className="text-xs font-medium cursor-pointer">
        {label}
      </Label>
    </div>
  );
};

export default ToggleSwitch;
