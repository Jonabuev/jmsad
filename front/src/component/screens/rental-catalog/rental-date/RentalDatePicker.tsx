import React from "react";

interface Props {
  startDate: string;
  endDate: string;
  setStartDate: (v: string) => void;
  setEndDate: (v: string) => void;
  onSearch: () => void;
  buttonText: string;
}

export default function RentalDatePicker({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  onSearch,
  buttonText,
}: Props) {
  return (
    <div className="mb-4 flex gap-4">
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        className="border px-2 py-1 rounded"
      />
      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        className="border px-2 py-1 rounded"
      />
      <button
        onClick={onSearch}
        className="bg-blue-600 text-white px-4 py-1 rounded"
      >
        {buttonText}
      </button>
    </div>
  );
}
