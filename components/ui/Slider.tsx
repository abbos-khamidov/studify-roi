"use client";

type Props = {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  label: string;
  format?: (v: number) => string;
};

export function Slider({
  min,
  max,
  step = 1,
  value,
  onChange,
  label,
  format = (v) => String(v),
}: Props) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-[var(--text-secondary)]">
        <span>{label}</span>
        <span className="font-mono-data text-[var(--text-primary)]">{format(value)}</span>
      </div>
      <input
        type="range"
        className="studify-slider"
        style={{ "--fill": `${pct}%` } as React.CSSProperties}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
