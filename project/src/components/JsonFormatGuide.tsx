import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileJson } from 'lucide-react';

export default function JsonFormatGuide() {
  const [isOpen, setIsOpen] = useState(false);

  const sampleJson = {
    bloodPressure: {
      systolic: 120,
      diastolic: 80
    },
    oxygenSaturation: 98,
    pulseRate: 72,
    sleepDuration: 7.5,
    sleepQuality: "Good",
    temperature: 37.2,
    mri: {
      notes: "Normal scan results"
    },
    additionalNotes: "Patient reports feeling well"
  };

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <FileJson className="h-5 w-5 text-amber-500" />
          <span className="font-medium text-gray-700">JSON Format Guide</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </button>

      {isOpen && (
        <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">JSON Structure Explanation</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-3">
                  The JSON format follows a structured hierarchy that matches our database schema:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                  <li><strong>bloodPressure:</strong> An object containing systolic and diastolic readings</li>
                  <li><strong>oxygenSaturation:</strong> Numeric value for oxygen levels</li>
                  <li><strong>pulseRate:</strong> Heart rate in beats per minute</li>
                  <li><strong>sleepDuration:</strong> Hours of sleep (can include decimals)</li>
                  <li><strong>sleepQuality:</strong> Subjective quality assessment</li>
                  <li><strong>temperature:</strong> Body temperature in Celsius</li>
                  <li><strong>mri:</strong> Object containing MRI-related notes</li>
                  <li><strong>additionalNotes:</strong> Any extra observations</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Example JSON</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm text-gray-600 overflow-x-auto">
                  {JSON.stringify(sampleJson, null, 2)}
                </pre>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded p-3">
              <p className="text-sm text-amber-700">
                <strong>Note:</strong> All fields are optional, but following this structure ensures proper data processing. 
                Numeric values should be provided without quotes, while text values should be in quotes.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm text-blue-700">
                <strong>Tip:</strong> You can validate your JSON format using online tools like{' '}
                <a 
                  href="https://jsonlint.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-800"
                >
                  JSONLint
                </a>
                {' '}before uploading.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 