"use client";

import { Calendar } from "lucide-react";
import Input from "@components/common/Input";

type Props = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
};

const DatePicker = ({ value, onChange, label, className }: Props) => {
  return (
    <Input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      label={label}
      leading={<Calendar className="h-3.5 w-3.5" />}
      className={className}
    />
  );
};

export default DatePicker;
