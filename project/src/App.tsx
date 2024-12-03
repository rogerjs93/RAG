import { useState } from 'react';
import { Activity } from 'lucide-react';
import HealthDataForm from './components/HealthDataForm';
import FileUpload from './components/FileUpload';
import Notification from './components/Notification';
import { type HealthData, type Notification as HealthNotification } from './types/health';
import { type FormData } from './types/form';

function App() {
  const [notification, setNotification] = useState<HealthNotification | null>(null);

  const handleFormSubmit = async (formData: FormData) => {
    try {
      const healthData: HealthData = {
        bloodPressure: {
          systolic: Number(formData.vitals.bloodPressure.systolic.values[0]),
          diastolic: Number(formData.vitals.bloodPressure.diastolic.values[0])
        },
        oxygenSaturation: Number(formData.vitals.oximetry.values[0]),
        pulseRate: Number(formData.vitals.pulse.values[0]),
        temperature: Number(formData.vitals.temperature.values[0]),
        sleepDuration: Number(formData.sleep.duration.values[0]),
        sleepQuality: Number(formData.sleep.quality.values[0]),
        bodyMetrics: formData.vitals.bodyMetrics,
        timestamp: formData.timestamp
      };

      // Send transformed data
      const response = await fetch('http://localhost:5000/api/health-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(healthData)
      });
      
      console.log('Response status:', response.status); // Debug log
      
      const result = await response.json();
      console.log('Response data:', result); // Debug log
      
      if (response.ok) {
        setNotification({ 
          message: 'Health data submitted successfully!', 
          type: 'success' 
        });
      } else {
        throw new Error(result.message || 'Failed to submit data');
      }
    } catch (error) {
      console.error('Submission error:', error); // Debug log
      setNotification({ 
        message: `Error submitting health data: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        type: 'error' as const
      });
    }
  };

  const handleFileSelect = async (files: FileList) => {
    try {
      console.log('Starting file upload...', files);
      const formData = new FormData();
      
      // Add all files to FormData
      Array.from(files).forEach((file, index) => {
        console.log(`Adding file ${index}:`, file.name, file.type);
        formData.append(`file${index}`, file);
      });

      console.log('Sending request to server...');
      const response = await fetch('http://localhost:5000/api/batch-upload', {
        method: 'POST',
        body: formData,
      });

      console.log('Server response received:', response.status);
      const result = await response.json();
      console.log('Response data:', result);

      if (response.ok) {
        setNotification({ 
          message: `${files.length} files uploaded successfully!`, 
          type: 'success' 
        });
      } else {
        throw new Error(result.message || 'Failed to upload files');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setNotification({ 
        message: `Error uploading files: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        type: 'error' as const
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-8">
        <div className="text-center mb-12">
          <Activity className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900">Health Data Portal</h1>
          <p className="mt-4 text-gray-600">Monitor and manage your health data efficiently</p>
        </div>

        <div className="grid gap-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Individual Data Entry</h2>
            <HealthDataForm onSubmit={handleFormSubmit} />
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Batch Upload</h2>
            <FileUpload onFileSelect={handleFileSelect} />
          </div>
        </div>

        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}
      </div>
    </div>
  );
}

export default App;