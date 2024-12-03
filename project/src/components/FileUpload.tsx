import React from 'react';
import { Upload } from 'lucide-react';
import UploadGuide from './UploadGuide';
import JsonFormatGuide from './JsonFormatGuide';

interface FileUploadProps {
  onFileSelect: (files: FileList) => void;
}

export default function FileUpload({ onFileSelect }: FileUploadProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const { files } = e.dataTransfer;
    if (files?.length) onFileSelect(files);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <UploadGuide />
        <JsonFormatGuide />
      </div>
      
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer bg-blue-50"
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          onChange={(e) => e.target.files && onFileSelect(e.target.files)}
          accept=".csv,.json,.xlsx,.xls"
          multiple
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className="mx-auto h-12 w-12 text-blue-500 mb-4" />
          <p className="text-sm text-gray-600">
            Drag and drop files here or click to select
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Supports CSV, JSON, and Excel files
          </p>
        </label>
      </div>
    </div>
  );
}