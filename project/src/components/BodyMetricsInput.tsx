import React from 'react';
import { type BodyMetrics } from '../types/form';

interface BodyMetricsInputProps {
  metrics: BodyMetrics;
  onChange: (metrics: BodyMetrics) => void;
  disabled?: boolean;
}

export default function BodyMetricsInput({
  metrics,
  onChange,
  disabled = false
}: BodyMetricsInputProps) {
  const calculateAdjustedBMI = (
    heightCm: number, 
    weightKg: number, 
    bodyFat?: number,
    muscleMass?: number
  ): number => {
    if (heightCm <= 0 || weightKg <= 0) return 0;
    
    const heightM = heightCm / 100;
    const basicBMI = weightKg / (heightM * heightM);

    // If we have body composition data, adjust the BMI calculation
    if (bodyFat !== undefined && muscleMass !== undefined) {
      // Adjust BMI based on body composition
      // Higher muscle mass and lower body fat will result in a more favorable BMI
      const compositionFactor = 1 + ((muscleMass / 100) - (bodyFat / 100));
      return Number((basicBMI / compositionFactor).toFixed(1));
    }

    // Return basic BMI if no composition data available
    return Number(basicBMI.toFixed(1));
  };

  const handleChange = (field: keyof BodyMetrics, value: number) => {
    const newMetrics = { ...metrics, [field]: value };
    
    // Recalculate BMI whenever relevant metrics change
    if (['height', 'weight', 'bodyFat', 'muscleMass'].includes(field)) {
      newMetrics.bmi = calculateAdjustedBMI(
        newMetrics.height,
        newMetrics.weight,
        newMetrics.bodyFat,
        newMetrics.muscleMass
      );
    }
    
    onChange(newMetrics);
  };

  // Update BMI category thresholds based on body composition
  function BMICategory({ bmi, bodyFat, muscleMass }: { 
    bmi: number; 
    bodyFat?: number; 
    muscleMass?: number; 
  }) {
    const getBMICategory = (
      bmi: number, 
      bodyFat?: number, 
      muscleMass?: number
    ): { category: string; color: string; description: string } => {
      if (bmi <= 0) return { 
        category: 'Invalid BMI', 
        color: 'gray',
        description: 'Please enter valid measurements' 
      };

      // Adjust thresholds based on body composition if available
      if (bodyFat !== undefined && muscleMass !== undefined) {
        if (muscleMass > 35 && bodyFat < 25) {
          // Athletic build
          if (bmi < 25) return { 
            category: 'Athletic Build', 
            color: 'green',
            description: 'High muscle mass, healthy body fat' 
          };
          if (bmi < 30) return { 
            category: 'Muscular', 
            color: 'blue',
            description: 'High muscle mass may affect BMI reading' 
          };
        }
      }

      // Standard BMI categories
      if (bmi < 18.5) return { 
        category: 'Underweight', 
        color: 'blue',
        description: 'BMI below healthy range' 
      };
      if (bmi < 25) return { 
        category: 'Normal weight', 
        color: 'green',
        description: 'Healthy BMI range' 
      };
      if (bmi < 30) return { 
        category: 'Overweight', 
        color: 'yellow',
        description: 'BMI above healthy range' 
      };
      return { 
        category: 'Obese', 
        color: 'red',
        description: 'BMI significantly above healthy range' 
      };
    };

    const status = getBMICategory(bmi, bodyFat, muscleMass);

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Category</span>
          <span className={`text-sm font-medium text-${status.color}-600`}>
            {status.category}
          </span>
        </div>
        <p className="text-xs text-gray-500">{status.description}</p>
        {bodyFat !== undefined && muscleMass !== undefined && (
          <p className="text-xs text-gray-500 italic">
            *BMI adjusted for body composition
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Basic Measurements */}
      <div className="grid grid-cols-2 gap-4">
        <MetricInput
          label="Height"
          value={metrics.height}
          onChange={(value) => handleChange('height', value)}
          unit="cm"
          min={0}
          max={300}
          step={0.1}
          disabled={disabled}
        />
        <MetricInput
          label="Weight"
          value={metrics.weight}
          onChange={(value) => handleChange('weight', value)}
          unit="kg"
          min={0}
          max={500}
          step={0.1}
          disabled={disabled}
        />
      </div>

      {/* Body Composition */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700">Body Composition (Optional)</h4>
        <div className="grid grid-cols-2 gap-4">
          <MetricInput
            label="Body Fat"
            value={metrics.bodyFat}
            onChange={(value) => handleChange('bodyFat', value)}
            unit="%"
            min={0}
            max={100}
            step={0.1}
            disabled={disabled}
            optional
          />
          <MetricInput
            label="Muscle Mass"
            value={metrics.muscleMass}
            onChange={(value) => handleChange('muscleMass', value)}
            unit="%"
            min={0}
            max={100}
            step={0.1}
            disabled={disabled}
            optional
          />
          <MetricInput
            label="Body Water"
            value={metrics.bodyWater}
            onChange={(value) => handleChange('bodyWater', value)}
            unit="%"
            min={0}
            max={100}
            step={0.1}
            disabled={disabled}
            optional
          />
          <MetricInput
            label="Bone Mass"
            value={metrics.boneMass}
            onChange={(value) => handleChange('boneMass', value)}
            unit="%"
            min={0}
            max={100}
            step={0.1}
            disabled={disabled}
            optional
          />
        </div>
      </div>

      {/* BMI Display */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">BMI</span>
          <span className="text-lg font-semibold text-gray-900">
            {metrics.bmi > 0 ? metrics.bmi : '-'}
          </span>
        </div>
        <BMICategory 
          bmi={metrics.bmi} 
          bodyFat={metrics.bodyFat} 
          muscleMass={metrics.muscleMass}
        />
      </div>
    </div>
  );
}

// Helper component for consistent input styling
function MetricInput({
  label,
  value,
  onChange,
  unit,
  min,
  max,
  step,
  disabled,
  optional = false
}: {
  label: string;
  value: number | undefined;
  onChange: (value: number) => void;
  unit: string;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  optional?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {optional && <span className="text-gray-400 text-xs ml-1">(optional)</span>}
      </label>
      <div className="relative">
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          className="block w-full rounded-md border-gray-300 shadow-sm 
            focus:border-blue-500 focus:ring-blue-500 
            disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
          {unit}
        </span>
      </div>
    </div>
  );
} 