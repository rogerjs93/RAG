import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { type FormData } from '../types/form';

interface JsonPreviewProps {
  data: FormData;
}

export default function JsonPreview({ data }: JsonPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <Eye className="h-5 w-5 text-purple-500" />
          <span className="font-medium text-gray-700">Preview Submitted Data</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </button>

      {isOpen && (
        <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <pre className="text-sm text-gray-600 overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}