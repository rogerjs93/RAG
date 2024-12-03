export type TimeFrame = 'day' | 'week' | 'month' | 'year';

export interface TimeFrameData {
  timeFrame: TimeFrame;
  values: string[];
}

export interface VitalSigns {
  bloodPressure: {
    systolic: TimeFrameData;
    diastolic: TimeFrameData;
  };
  oximetry: TimeFrameData;
  pulse: TimeFrameData;
  temperature: TimeFrameData;
  bodyMetrics: {
    height: number; // in cm
    weight: number; // in kg
    bmi: number;
    timestamp: string;
  };
}

export interface SleepStages {
  awake: number;
  lightSleep: number;
  deepSleep: number;
  remSleep: number;
}

export interface SleepData {
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

export interface FormData {
  vitals: VitalSigns;
  sleep: SleepData;
  mri?: {
    notes: string;
  };
  additionalNotes?: string;
  timestamp: string;
}

export interface BodyMetrics {
  height: number;
  weight: number;
  bmi: number;
  bodyFat?: number;
  muscleMass?: number;
  bodyWater?: number;
  boneMass?: number;
  timestamp: string;
} 