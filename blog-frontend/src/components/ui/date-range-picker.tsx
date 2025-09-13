import React from 'react';

export type DateRange = { from?: Date; to?: Date };

export function DatePickerWithRange({
  date,
  setDate,
  className,
}: {
  date?: DateRange;
  setDate: (range: DateRange | undefined) => void;
  className?: string;
}) {
  const fromStr = date?.from ? toInputValue(date.from) : '';
  const toStr = date?.to ? toInputValue(date.to) : '';

  function toInputValue(d: Date) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  function fromInputValue(s: string) {
    const [y, m, d] = s.split('-').map((v) => parseInt(v, 10));
    if (!y || !m || !d) return undefined;
    return new Date(y, m - 1, d);
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={fromStr}
          onChange={(e) => {
            const from = e.target.value ? fromInputValue(e.target.value) : undefined;
            setDate({ from, to: date?.to });
          }}
          className="h-9 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-transparent text-sm"
          aria-label="Date de début"
        />
        <span className="text-sm">→</span>
        <input
          type="date"
          value={toStr}
          onChange={(e) => {
            const to = e.target.value ? fromInputValue(e.target.value) : undefined;
            setDate({ from: date?.from, to });
          }}
          className="h-9 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-transparent text-sm"
          aria-label="Date de fin"
        />
        <button
          type="button"
          className="h-9 px-3 rounded-md border text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
          onClick={() => setDate(undefined)}
        >
          Réinitialiser
        </button>
      </div>
    </div>
  );
}
