import { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

interface OCRDebugPanelProps {
  extractedText: string;
  extractedData: Record<string, any>;
}

export function OCRDebugPanel({ extractedText, extractedData }: OCRDebugPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true); // Auto-expand by default

  if (!extractedText && Object.keys(extractedData).length === 0) {
    return null;
  }

  return (
    <div className="mb-6 border-2 border-orange-400 bg-orange-50">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-orange-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info size={20} className="text-orange-600" />
          <span className="text-sm font-semibold text-orange-900">📋 OCR Debug Information - Click to see what was read from your ID</span>
          <span className="text-xs text-orange-700 font-medium">
            ({Object.keys(extractedData).length} fields detected)
          </span>
        </div>
        {isExpanded ? <ChevronUp size={20} className="text-orange-600" /> : <ChevronDown size={20} className="text-orange-600" />}
      </button>

      {isExpanded && (
        <div className="px-4 py-3 border-t-2 border-orange-300 space-y-4 bg-white">
          {extractedText && (
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                📄 Raw OCR Text (What the system read from your ID):
              </h4>
              <div className="bg-gray-50 p-4 border-2 border-gray-300 text-sm font-mono max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap">{extractedText}</pre>
              </div>
              <p className="text-xs text-orange-700 mt-2 font-medium">
                ⚠️ If the wrong data was extracted, please share this OCR text so we can fix the extraction logic!
              </p>
            </div>
          )}

          {Object.keys(extractedData).length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-2">📊 Parsed/Extracted Data:</h4>
              <div className="bg-gray-50 p-3 border-2 border-gray-300 text-sm font-mono">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(extractedData, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <div className="text-sm text-orange-800 bg-orange-100 p-3 border border-orange-300">
            <p>
              <strong>💡 How to help us fix extraction issues:</strong> Copy the "Raw OCR Text" above and share it with support. This shows exactly what text was read from your ID.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
