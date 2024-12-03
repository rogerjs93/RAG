import React from 'react';
import { type SleepStages } from '../types/form';

interface SleepStagesInputProps {
  value: SleepStages;
  onChange: (stages: SleepStages, quality: number) => void;
  disabled?: boolean;
}

interface TimeInput {
  hours: number;
  minutes: number;
}

export default function SleepStagesInput({ value, onChange, disabled = false }: SleepStagesInputProps) {
  // Convert hours to TimeInput format
  const hoursToTimeInput = (hours: number): TimeInput => ({
    hours: Math.floor(hours),
    minutes: Math.round((hours % 1) * 60)
  });

  // Convert TimeInput to hours
  const timeInputToHours = (time: TimeInput): number => 
    time.hours + (time.minutes / 60);

  const [timeInputs, setTimeInputs] = React.useState<Record<keyof SleepStages, TimeInput>>({
    awake: hoursToTimeInput(value.awake),
    lightSleep: hoursToTimeInput(value.lightSleep),
    deepSleep: hoursToTimeInput(value.deepSleep),
    remSleep: hoursToTimeInput(value.remSleep)
  });

  const handleTimeChange = (stage: keyof SleepStages, field: keyof TimeInput, value: string) => {
    const numValue = parseInt(value) || 0;
    const newTimeInputs = { ...timeInputs };
    
    if (field === 'hours') {
      newTimeInputs[stage] = {
        ...newTimeInputs[stage],
        hours: Math.max(0, Math.min(24, numValue))
      };
    } else {
      newTimeInputs[stage] = {
        ...newTimeInputs[stage],
        minutes: Math.max(0, Math.min(59, numValue))
      };
    }

    setTimeInputs(newTimeInputs);

    // Convert all time inputs to hours and update parent
    const newHoursData: SleepStages = Object.entries(newTimeInputs).reduce(
      (acc, [key, time]) => ({
        ...acc,
        [key]: timeInputToHours(time)
      }),
      {} as SleepStages
    );

    const quality = calculateQuality(newHoursData);
    onChange(newHoursData, quality);
  };

  const stages: Array<{ key: keyof SleepStages; label: string; color: string }> = [
    { key: 'awake', label: 'Time Awake', color: 'yellow' },
    { key: 'lightSleep', label: 'Light Sleep', color: 'blue' },
    { key: 'deepSleep', label: 'Deep Sleep', color: 'indigo' },
    { key: 'remSleep', label: 'REM Sleep', color: 'purple' }
  ];

  // Convert hours to percentages for quality calculation
  const calculatePercentagesFromHours = (hoursData: SleepStages): SleepStages => {
    const totalHours = Object.values(hoursData).reduce((sum, val) => sum + val, 0);
    if (totalHours === 0) return { awake: 0, lightSleep: 0, deepSleep: 0, remSleep: 0 };

    return {
      awake: (hoursData.awake / totalHours) * 100,
      lightSleep: (hoursData.lightSleep / totalHours) * 100,
      deepSleep: (hoursData.deepSleep / totalHours) * 100,
      remSleep: (hoursData.remSleep / totalHours) * 100
    };
  };

  const calculateQuality = (hoursData: SleepStages): number => {
    const percentages = calculatePercentagesFromHours(hoursData);
    
    // Ideal ranges for sleep stages
    const idealRanges = {
      awake: { min: 5, max: 10 },
      lightSleep: { min: 45, max: 55 },
      deepSleep: { min: 15, max: 25 },
      remSleep: { min: 20, max: 25 }
    };

    // Calculate score for each stage
    const scores = Object.entries(percentages).map(([stage, percentage]) => {
      const range = idealRanges[stage as keyof SleepStages];
      if (percentage < range.min) {
        return 1 - (range.min - percentage) / range.min;
      } else if (percentage > range.max) {
        return 1 - (percentage - range.max) / (100 - range.max);
      }
      return 1;
    });

    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length * 10);
  };

  return (
    <div className="space-y-6">
      {stages.map(({ key, label, color }) => (
        <div key={key} className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {label}
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Hours</label>
              <div className="relative">
                <input
                  type="number"
                  value={timeInputs[key].hours}
                  onChange={(e) => handleTimeChange(key, 'hours', e.target.value)}
                  disabled={disabled}
                  min="0"
                  max="24"
                  className="block w-full rounded-md border-gray-300 shadow-sm 
                    focus:border-blue-500 focus:ring-blue-500 
                    disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  hrs
                </span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Minutes</label>
              <div className="relative">
                <input
                  type="number"
                  value={timeInputs[key].minutes}
                  onChange={(e) => handleTimeChange(key, 'minutes', e.target.value)}
                  disabled={disabled}
                  min="0"
                  max="59"
                  className="block w-full rounded-md border-gray-300 shadow-sm 
                    focus:border-blue-500 focus:ring-blue-500 
                    disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  min
                </span>
              </div>
            </div>
          </div>
          <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-${color}-500 transition-all duration-300`}
              style={{ width: `${calculatePercentagesFromHours(value)[key]}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-1 text-right">
            {calculatePercentagesFromHours(value)[key].toFixed(1)}%
          </p>
        </div>
      ))}
      
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total Sleep Time</span>
          <span className="text-sm font-medium text-gray-900">
            {Object.values(value).reduce((sum, val) => sum + val, 0).toFixed(1)} hours
          </span>
        </div>
        <div className="mt-2 flex justify-between items-center">
          <span className="text-sm text-gray-600">Sleep Quality Score</span>
          <span className="text-lg font-semibold text-indigo-600">
            {calculateQuality(value)}/10
          </span>
        </div>
      </div>
    </div>
  );
} 