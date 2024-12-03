import React from 'react';

interface TimeFrameInputsProps {
  timeFrame: 'day' | 'week' | 'month' | 'year';
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  step?: string;
  unit?: string;
  required?: boolean;
  error?: string;
}

export default function TimeFrameInputs({
  timeFrame,
  value,
  onChange,
  placeholder = '',
  min,
  max,
  step,
  unit,
  required,
  error
}: TimeFrameInputsProps) {
  const getInputCount = () => {
    switch (timeFrame) {
      case 'week':
        return 7;
      case 'month':
        return 30;
      case 'year':
        return 12;
      default:
        return 1;
    }
  };

  const getLabel = (index: number) => {
    switch (timeFrame) {
      case 'week':
        return `Day ${index + 1}`;
      case 'month':
        return `Day ${index + 1}`;
      case 'year':
        return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index];
      default:
        return '';
    }
  };

  const handleInputChange = (index: number, newValue: string) => {
    const newValues = [...value];
    newValues[index] = newValue;
    onChange(newValues);
  };

  const inputCount = getInputCount();
  const inputs = Array.from({ length: inputCount }, (_, i) => {
    const currentValue = value[i] || '';
    return (
      <div key={i} className="space-y-1">
        <label className="block text-sm text-gray-600">{getLabel(i)}</label>
        <div className="relative">
          <input
            type="number"
            value={currentValue}
            onChange={(e) => handleInputChange(i, e.target.value)}
            placeholder={placeholder}
            min={min}
            max={max}
            step={step}
            required={required}
            className={`block w-full pr-12 rounded-md shadow-sm 
              ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                     : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-gray-500 sm:text-sm">{unit}</span>
          </div>
        </div>
      </div>
    );
  });

  return (
    <div className={`grid gap-4 ${timeFrame === 'day' ? 'grid-cols-1' : 
      timeFrame === 'week' ? 'grid-cols-2 md:grid-cols-4' :
      timeFrame === 'month' ? 'grid-cols-2 md:grid-cols-6' :
      'grid-cols-2 md:grid-cols-4'}`}>
      {inputs}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}