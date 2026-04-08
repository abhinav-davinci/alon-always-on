import { UserProperty } from '../constants/properties';

/**
 * Fields needed for full comparison with ALON properties.
 * Each field has a label (display), key (UserProperty field), and priority.
 */
export interface FieldStatus {
  key: string;
  label: string;
  filled: boolean;
  value: string;
  priority: 'required' | 'important' | 'optional';
  hint: string; // nudge text when missing
}

export interface CompletenessResult {
  fields: FieldStatus[];
  filled: number;
  total: number;
  percent: number;
  missingImportant: FieldStatus[];
  canCompare: boolean; // has minimum fields for a useful comparison
}

export function checkCompleteness(property: UserProperty): CompletenessResult {
  const fields: FieldStatus[] = [
    {
      key: 'name',
      label: 'Building name',
      filled: !!property.name,
      value: property.name || '',
      priority: 'required',
      hint: 'Needed to identify the property',
    },
    {
      key: 'area',
      label: 'Location',
      filled: !!property.area,
      value: property.area || '',
      priority: 'required',
      hint: 'Needed for area-level comparison',
    },
    {
      key: 'price',
      label: 'Price',
      filled: !!property.price,
      value: property.price || '',
      priority: 'required',
      hint: 'Needed for budget & value comparison',
    },
    {
      key: 'size',
      label: 'Size (sq.ft)',
      filled: !!property.size && /\d/.test(property.size),
      value: property.size || '',
      priority: 'important',
      hint: 'Needed to calculate price per sq.ft',
    },
    {
      key: 'bhk',
      label: 'Configuration',
      filled: !!property.bhk,
      value: property.bhk || '',
      priority: 'important',
      hint: 'Helps match to your BHK preference',
    },
    {
      key: 'builderName',
      label: 'Builder / Developer',
      filled: !!property.builderName,
      value: property.builderName || '',
      priority: 'important',
      hint: 'ALON can look up builder trust score',
    },
    {
      key: 'rera',
      label: 'RERA number',
      filled: !!property.rera,
      value: property.rera || '',
      priority: 'important',
      hint: 'Lets ALON verify the project instantly',
    },
    {
      key: 'propertyType',
      label: 'Property type',
      filled: !!property.propertyType,
      value: property.propertyType || '',
      priority: 'optional',
      hint: 'Apartment, Villa, Plot, etc.',
    },
  ];

  const filled = fields.filter((f) => f.filled).length;
  const total = fields.length;
  const percent = Math.round((filled / total) * 100);
  const missingImportant = fields.filter((f) => !f.filled && f.priority !== 'optional');
  const canCompare = !!property.name && !!property.area && !!property.price;

  return { fields, filled, total, percent, missingImportant, canCompare };
}
