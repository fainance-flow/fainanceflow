"use client";

import DatePicker from "@components/common/DatePicker";

type Range = {
  from: string;
  to: string;
};

type Props = Range & {
  onChange: (range: Range) => void;
};

const DateRange = ({ from, to, onChange }: Props) => {
  return (
    <div className="grid grid-cols-2 gap-2">
      <DatePicker label="From" value={from} onChange={(v) => onChange({ from: v, to })} />
      <DatePicker label="To" value={to} onChange={(v) => onChange({ from, to: v })} />
    </div>
  );
};

export default DateRange;
