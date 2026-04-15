import React from 'react';
import FeeStructure from './FeeStructure';

/**
 * Settings page now redirects to the unified FeeStructure (Platform Settings) page
 * which contains all country-level configuration: fees, commissions, pricing, and general settings.
 */
export default function Settings() {
  return <FeeStructure />;
}
