'use client';

interface TranscriptPaneProps {
  transcript: string;
}

export function TranscriptPane({ transcript }: TranscriptPaneProps) {
  if (!transcript) {
    return (
      <div className="card h-64 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-2">No transcript available</p>
          <p className="text-sm text-gray-400">
            Send a test transcript or wait for call data
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="h-64 overflow-y-auto">
        <div className="prose prose-sm max-w-none">
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
            {transcript}
          </p>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Length: {transcript.length} characters</span>
          <span>Words: {transcript.split(/\s+/).length}</span>
        </div>
      </div>
    </div>
  );
}
