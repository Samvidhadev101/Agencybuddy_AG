import React from 'react';

export default function AiOutputBadge({ modelName }) {
  if (!modelName) return null;
  
  return (
    <div className="mt-2 text-text-muted text-[10px] font-mono animate-fade-in">
      Generated with {modelName}
    </div>
  );
}
