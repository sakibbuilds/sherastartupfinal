import { forwardRef } from 'react';

// Note: advertisements table needs to be created via migration
// This component is disabled until the table is set up
export const AdBanner = forwardRef<HTMLDivElement>((_, ref) => {
  // Return null until advertisements table is created
  return null;
});

AdBanner.displayName = 'AdBanner';