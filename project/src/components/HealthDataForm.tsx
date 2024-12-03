import React, { useCallback, useEffect, useRef } from 'react';
import { Heart, Moon, Scale } from 'lucide-react';
import JsonPreview from './JsonPreview';
import TimeFrameInputs from './TimeFrameInputs';
import SleepStagesInput from './SleepStagesInput';
import { debounce } from 'lodash';
import BodyMetricsInput from './BodyMetricsInput';
import type { FormEvent } from 'react';
import { type SleepStages, type TimeFrame } from '../types/form';

// Remove the local TimeFrame definition
// type TimeFrame = 'day' | 'week' | 'month' | 'year';

interface TimeFrameData {
  timeFrame: TimeFrame;
  values: string[];
}

interface VitalSigns {
  bloodPressure: {
    systolic: TimeFrameData;
    diastolic: TimeFrameData;
  };
  oximetry: TimeFrameData;
  pulse: TimeFrameData;
  temperature: TimeFrameData & {
    unit: 'celsius';
  };
  bodyMetrics: {
    height: number; // in cm
    weight: number; // in kg
    bmi: number;
    timestamp: string;
  };
}

interface SleepData {
  duration: TimeFrameData;
  stages: {
    timeFrame: TimeFrame;
    values: SleepStages[];
  };
  quality: {
    timeFrame: TimeFrame;
    values: string[];
    calculated: boolean;
  };
}

interface FormData {
  vitals: VitalSigns;
  sleep: SleepData;
  mri: {
    notes: string;
  };
  additionalNotes: string;
  timestamp: string;
}

interface HealthDataFormProps {
  onSubmit: (data: FormData) => Promise<void>;
}

// Add these type definitions at the top
type VitalSubsection = 'oximetry' | 'pulse' | 'temperature';
type SleepSubsection = 'duration' | 'stages';
type BloodPressureSubsection = 'bloodPressure.systolic' | 'bloodPressure.diastolic';

interface TimeFrameSelectProps {
  section: 'vitals' | 'sleep';
  subsection: VitalSubsection | SleepSubsection | 'bloodPressure';
  value: TimeFrame;
}

// Update type guards
function isVitalSign(section: string): section is VitalSubsection {
  return ['oximetry', 'pulse', 'temperature'].includes(section);
}

function isSleepData(section: string): section is SleepSubsection {
  return ['duration', 'stages'].includes(section);
}

function isBloodPressureSubsection(section: string): section is BloodPressureSubsection {
  return ['bloodPressure.systolic', 'bloodPressure.diastolic'].includes(section);
}

const initialFormData: FormData = {
  vitals: {
    bloodPressure: {
      systolic: {
        timeFrame: 'day',
        values: [''],
      },
      diastolic: {
        timeFrame: 'day',
        values: [''],
      },
    },
    oximetry: {
      timeFrame: 'day',
      values: [''],
    },
    pulse: {
      timeFrame: 'day',
      values: [''],
    },
    temperature: {
      timeFrame: 'day',
      values: [''],
      unit: 'celsius',
    },
    bodyMetrics: {
      height: 170,
      weight: 70,
      bmi: 24.2,
      timestamp: new Date().toISOString()
    }
  },
  sleep: {
    duration: {
      timeFrame: 'day',
      values: [''],
    },
    stages: {
      timeFrame: 'day',
      values: [{
        awake: 0,
        lightSleep: 0,
        deepSleep: 0,
        remSleep: 0
      }],
    },
    quality: {
      timeFrame: 'day',
      values: [''],
      calculated: false,
    },
  },
  mri: {
    notes: '',
  },
  additionalNotes: '',
  timestamp: new Date().toISOString(),
};

export default function HealthDataForm({ onSubmit }: HealthDataFormProps) {
  const [formData, setFormData] = React.useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);
  const timeFrameOptions: TimeFrame[] = ['day', 'week', 'month', 'year'];

  const debouncedSaveRef = useRef(
    debounce(async (data: FormData) => {
      try {
        await onSubmit(data);
        setLastSaved(new Date());
      } catch (error) {
        console.error('Error auto-saving:', error);
      }
    }, 1000)
  ).current;

  const handleManualSave = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onSubmit]);

  useEffect(() => {
    return () => {
      debouncedSaveRef.cancel();
    };
  }, [debouncedSaveRef]);

  const handleChange = (newDataOrUpdater: FormData | ((prev: FormData) => FormData)) => {
    const newData = typeof newDataOrUpdater === 'function' 
      ? newDataOrUpdater(formData)
      : newDataOrUpdater;
    
    setFormData(newData);
    debouncedSaveRef(newData);
  };

  const handleTimeFrameChange = (
    section: 'vitals' | 'sleep',
    subsection: VitalSubsection | SleepSubsection | 'bloodPressure',
    newTimeFrame: TimeFrame
  ) => {
    handleChange(prev => {
      const newData = { ...prev };
      
      if (section === 'vitals') {
        if (subsection === 'bloodPressure') {
          newData.vitals.bloodPressure.systolic.timeFrame = newTimeFrame;
          newData.vitals.bloodPressure.systolic.values = [''];
          newData.vitals.bloodPressure.diastolic.timeFrame = newTimeFrame;
          newData.vitals.bloodPressure.diastolic.values = [''];
        } else if (isVitalSign(subsection)) {
          const vital = newData.vitals[subsection];
          if ('timeFrame' in vital) {
            vital.timeFrame = newTimeFrame;
            vital.values = [''];
          }
        }
      } else if (section === 'sleep' && isSleepData(subsection)) {
        newData.sleep[subsection].timeFrame = newTimeFrame;
        newData.sleep[subsection].values = [''];
      }
      
      return newData;
    });
  };

  const handleValuesChange = (
    section: 'vitals' | 'sleep',
    subsection: VitalSubsection | SleepSubsection | BloodPressureSubsection,
    newValues: string[]
  ) => {
    handleChange(prev => {
      const newData = { ...prev };
      
      if (section === 'vitals') {
        if (isBloodPressureSubsection(subsection)) {
          const [, part] = subsection.split('.') as ['bloodPressure', 'systolic' | 'diastolic'];
          newData.vitals.bloodPressure[part].values = newValues;
        } else if (isVitalSign(subsection)) {
          const vital = newData.vitals[subsection];
          if ('values' in vital) {
            vital.values = newValues;
          }
        }
      } else if (section === 'sleep' && isSleepData(subsection)) {
        newData.sleep[subsection].values = newValues;
      }
      
      return newData;
    });
  };

  const handleSleepStagesChange = (stages: SleepStages, quality: number) => {
    handleChange(prev => ({
      ...prev,
      sleep: {
        ...prev.sleep,
        stages: {
          ...prev.sleep.stages,
          values: [stages]
        },
        quality: {
          ...prev.sleep.quality,
          values: [quality.toString()],
          calculated: true
        }
      }
    }));
  };

  const calculateQuality = (stages: SleepStages): number => {
    // Quality calculation based on ideal sleep stage percentages
    const total = stages.awake + stages.lightSleep + stages.deepSleep + stages.remSleep;
    if (total === 0) return 0;

    // Ideal percentages: Light 45-55%, Deep 15-25%, REM 20-25%, Awake 5-10%
    const awakeScore = Math.max(0, 1 - Math.abs(stages.awake / total - 0.075) / 0.075);
    const lightScore = Math.max(0, 1 - Math.abs(stages.lightSleep / total - 0.5) / 0.1);
    const deepScore = Math.max(0, 1 - Math.abs(stages.deepSleep / total - 0.2) / 0.1);
    const remScore = Math.max(0, 1 - Math.abs(stages.remSleep / total - 0.225) / 0.075);

    return Math.round((awakeScore + lightScore + deepScore + remScore) * 2.5);
  };

  const TimeFrameSelect = ({ section, subsection, value }: TimeFrameSelectProps) => (
    <select
      value={value}
      onChange={(e) => handleTimeFrameChange(section, subsection, e.target.value as TimeFrame)}
      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
    >
      {timeFrameOptions.map(option => (
        <option key={option} value={option}>
          Per {option.charAt(0).toUpperCase() + option.slice(1)}
        </option>
      ))}
    </select>
  );

  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleManualSave(new Event('submit') as unknown as React.SyntheticEvent<HTMLFormElement>);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleManualSave]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleManualSave(e);
  };

  return (
    <div role="form" aria-label="Health Data Entry Form">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Health Data Entry</h1>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* First Row: Vitals */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-red-50 to-red-100 px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Heart className="h-5 w-5 text-red-500 mr-2" />
                Basic Vitals
              </h3>
            </div>
            <div className="p-4 space-y-6">
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Blood Pressure (Systolic)
                </label>
                <div className="space-y-4">
                  <TimeFrameSelect 
                    section="vitals"
                    subsection="bloodPressure"
                    value={formData.vitals.bloodPressure.systolic.timeFrame}
                  />
                  <TimeFrameInputs
                    timeFrame={formData.vitals.bloodPressure.systolic.timeFrame}
                    value={formData.vitals.bloodPressure.systolic.values}
                    onChange={(values) => handleValuesChange('vitals', 'bloodPressure.systolic', values)}
                    placeholder="120"
                    min="0"
                    max="300"
                    unit="mmHg"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Blood Pressure (Diastolic)
                </label>
                <div className="space-y-4">
                  <TimeFrameSelect 
                    section="vitals"
                    subsection="bloodPressure"
                    value={formData.vitals.bloodPressure.diastolic.timeFrame}
                  />
                  <TimeFrameInputs
                    timeFrame={formData.vitals.bloodPressure.diastolic.timeFrame}
                    value={formData.vitals.bloodPressure.diastolic.values}
                    onChange={(values) => handleValuesChange('vitals', 'bloodPressure.diastolic', values)}
                    placeholder="80"
                    min="0"
                    max="200"
                    unit="mmHg"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Oxygen Saturation (%)
                </label>
                <div className="space-y-4">
                  <TimeFrameSelect 
                    section="vitals"
                    subsection="oximetry"
                    value={formData.vitals.oximetry.timeFrame}
                  />
                  <TimeFrameInputs
                    timeFrame={formData.vitals.oximetry.timeFrame}
                    value={formData.vitals.oximetry.values}
                    onChange={(values) => handleValuesChange('vitals', 'oximetry', values)}
                    placeholder="98"
                    min="0"
                    max="100"
                    unit="%"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Pulse Rate (BPM)
                </label>
                <div className="space-y-4">
                  <TimeFrameSelect 
                    section="vitals"
                    subsection="pulse"
                    value={formData.vitals.pulse.timeFrame}
                  />
                  <TimeFrameInputs
                    timeFrame={formData.vitals.pulse.timeFrame}
                    value={formData.vitals.pulse.values}
                    onChange={(values) => handleValuesChange('vitals', 'pulse', values)}
                    placeholder="72"
                    min="0"
                    max="300"
                    unit="BPM"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Temperature (°C)
                </label>
                <div className="space-y-4">
                  <TimeFrameSelect 
                    section="vitals"
                    subsection="temperature"
                    value={formData.vitals.temperature.timeFrame}
                  />
                  <TimeFrameInputs
                    timeFrame={formData.vitals.temperature.timeFrame}
                    value={formData.vitals.temperature.values}
                    onChange={(values) => handleValuesChange('vitals', 'temperature', values)}
                    placeholder="37.0"
                    min="35"
                    max="42"
                    step="0.1"
                    unit="°C"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Second Row: Sleep and Body Metrics side by side */}
          <div className="grid gap-8 md:grid-cols-2">
            {/* Sleep Section */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 px-4 py-3 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Moon className="h-5 w-5 text-indigo-500 mr-2" />
                  Sleep Data
                </h3>
              </div>
              <div className="p-4 space-y-6">
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Sleep Duration (hours)
                  </label>
                  <div className="space-y-4">
                    <TimeFrameSelect 
                      section="sleep"
                      subsection="duration"
                      value={formData.sleep.duration.timeFrame}
                    />
                    <TimeFrameInputs
                      timeFrame={formData.sleep.duration.timeFrame}
                      value={formData.sleep.duration.values}
                      onChange={(values) => handleValuesChange('sleep', 'duration', values)}
                      placeholder="8"
                      min="0"
                      max="24"
                      step="0.5"
                      unit="hrs"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Sleep Stages
                  </label>
                  <div className="space-y-4">
                    <TimeFrameSelect 
                      section="sleep"
                      subsection="stages"
                      value={formData.sleep.stages.timeFrame}
                    />
                    <SleepStagesInput
                      value={formData.sleep.stages.values[0] || {
                        awake: 0,
                        lightSleep: 0,
                        deepSleep: 0,
                        remSleep: 0
                      }}
                      onChange={(stages) => {
                        const quality = calculateQuality(stages);
                        handleSleepStagesChange(stages, quality);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Body Metrics Section */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-green-100 px-4 py-3 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Scale className="h-5 w-5 text-green-500 mr-2" />
                  Body Composition
                </h3>
              </div>
              <div className="p-4">
                <BodyMetricsInput
                  metrics={formData.vitals.bodyMetrics}
                  onChange={(newMetrics) => {
                    handleChange(prev => ({
                      ...prev,
                      vitals: {
                        ...prev.vitals,
                        bodyMetrics: {
                          ...newMetrics,
                          timestamp: new Date().toISOString()
                        }
                      }
                    }));
                  }}
                />
              </div>
            </div>
          </div>

          {/* Submit Button and JSON Preview */}
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm">
              {lastSaved ? (
                <span className="text-gray-600">
                  Last saved: {lastSaved.toLocaleString()}
                </span>
              ) : (
                <span className="text-gray-400">Not saved yet</span>
              )}
              <span className="ml-2 text-gray-400">
                (Auto-saves every hour)
              </span>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                       transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Now</span>
              )}
            </button>
          </div>
          
          {/* JSON Preview */}
          <div className="mt-8">
            <JsonPreview data={formData} />
          </div>
        </form>
      </div>
    </div>
  );
}