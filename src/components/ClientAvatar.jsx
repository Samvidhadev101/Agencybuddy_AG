import React from 'react';

/**
 * A reusable Client Avatar component that renders a client's uploaded logo
 * or gracefully falls back to a colored initials circle.
 */
export default function ClientAvatar({ client, size = 'md', className = '' }) {
  if (!client) return null;

  // Sizing definitions
  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-10 h-10 text-lg',
    lg: 'w-14 h-14 text-2xl'
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;

  // If a logo exists, render the image
  if (client.logo_url) {
    return (
      <div className={`relative rounded-full overflow-hidden flex-shrink-0 bg-white border border-border-light shadow-sm flex items-center justify-center ${currentSizeClass} ${className}`}>
        <img 
          src={client.logo_url} 
          alt={`${client.name} logo`} 
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback if image fails to load
            e.target.style.display = 'none';
            e.target.parentElement.innerHTML = `<span class="font-bold text-primary-cyan">${client.name?.charAt(0).toUpperCase()}</span>`;
            e.target.parentElement.className = `rounded-full flex items-center justify-center bg-cyan-100 text-primary-cyan border border-cyan-200 shadow-sm flex-shrink-0 ${currentSizeClass} ${className}`;
          }}
        />
      </div>
    );
  }

  // Fallback: Colored Initials Circle
  return (
    <div className={`rounded-full flex items-center justify-center bg-cyan-100 text-primary-cyan font-bold border border-cyan-200 shadow-sm flex-shrink-0 ${currentSizeClass} ${className}`}>
      {client.name?.charAt(0).toUpperCase()}
    </div>
  );
}
