import { useState, useRef, useEffect } from 'react';
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  error?: string;
}

export function FileUpload({ onFileSelect, error }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (file && !isUploading) {
      onFileSelect(file);
    }
  }, [file, isUploading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setIsUploading(true);
      setProgress(0);

      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      }

      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsUploading(false);
            setFile(selectedFile);
            return 100;
          }
          return prev + 10;
        });
      }, 100);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setProgress(0);
    setPreview(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (!file) {
      onFileSelect(null);
    }
  }, [file]);

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        onChange={handleFileChange}
        accept="image/*,.pdf"
        className="hidden"
      />

      {!file && !isUploading && (
        <div
          onClick={handleClick}
          className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer p-8 text-center bg-gray-50"
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">Upload from desktop</p>
          <p className="mt-1 text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
        </div>
      )}

      {isUploading && (
        <div className="border-2 border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <FileText className="h-10 w-10 text-gray-400" />
            <div className="flex-1">
              <p className="text-sm text-gray-900 mb-2">Uploading...</p>
              <div className="w-full bg-gray-200 h-2">
                <div
                  className="bg-blue-600 h-2 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{progress}%</p>
            </div>
          </div>
        </div>
      )}

      {file && !isUploading && (
        <div className="border-2 border-gray-200 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              {preview ? (
                <img
                  src={preview}
                  alt="ID Preview"
                  className="w-32 h-20 object-cover border border-gray-200"
                />
              ) : (
                <FileText className="h-8 w-8 text-blue-600 mt-1" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                {preview && (
                  <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                    <ImageIcon size={12} />
                    Image preview available
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
