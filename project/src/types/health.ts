export interface SleepStages {
  awake: number;
  lightSleep: number;
  deepSleep: number;
  remSleep: number;
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

export interface HealthData {
  bloodPressure: {
    systolic: number;
    diastolic: number;
  };
  oxygenSaturation: number;
  pulseRate: number;
  temperature: number;
  sleepDuration: number;
  sleepQuality: number;
  bodyMetrics: BodyMetrics;
  timestamp: string;
}

export type NotificationType = 'success' | 'error';

export interface Notification {
  message: string;
  type: NotificationType;
} 