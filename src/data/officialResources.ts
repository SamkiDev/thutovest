import type { NavigatorSource } from '../types';

/** Official homepages only. Checked for the prototype; content on them changes over time. */
export const OFFICIAL: Record<string, NavigatorSource> = {
  nsfas: { label: 'NSFAS official website', url: 'https://www.nsfas.org.za' },
  isfap: { label: 'ISFAP official website', url: 'https://www.isfap.org.za' },
  funza: { label: 'Funza Lushaka Bursary official website', url: 'https://www.funzalushaka.doe.gov.za' },
  dhet: { label: 'Department of Higher Education and Training', url: 'https://www.dhet.gov.za' },
  cao: { label: 'Central Applications Office (KZN institutions)', url: 'https://www.cao.ac.za' },
};
