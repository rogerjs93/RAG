import React from 'react';
import { type TimeFrame } from '../types/form';

export interface TimeFrameSelectProps {
  value: TimeFrame;
  onChange?: (timeFrame: TimeFrame) => void;
}

const timeFrameOptions: TimeFrame[] = ['day', 'week', 'month', 'year'];

export default function TimeFrameSelect({ value, onChange }: TimeFrameSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value as TimeFrame)}
      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
    >
      {timeFrameOptions.map((option) => (
        <option key={option} value={option}>
          {option.charAt(0).toUpperCase() + option.slice(1)}
        </option>
      ))}
    </select>
  );
} 