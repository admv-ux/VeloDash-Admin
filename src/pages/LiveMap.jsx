import React from 'react';
import NetworkMap from '@/components/map/NetworkMap';

/**
 * Live Map page. The map itself lives in NetworkMap so this page and the
 * Dashboard render exactly the same thing from one implementation.
 */
export default function LiveMap() {
  return (
    <div className="p-4 md:p-6">
      <NetworkMap />
    </div>
  );
}
