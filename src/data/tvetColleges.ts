import type { Province } from '../types';
import type { NsfasPortalId } from './accommodation';

/**
 * The 50 public TVET colleges. DHET: "There are 50 registered and accredited
 * public TVET Colleges in South Africa". Names and provinces follow the NSFAS
 * accommodation portal map; each website was opened on 23 October 2026 and
 * confirmed to be the college's own site.
 */
export const TVET_SOURCE = { label: 'DHET list of TVET colleges', url: 'https://www.dhet.gov.za/SitePages/Map.aspx' };

export interface TvetCollege {
  id: string;
  name: string;
  province: Province;
  website: string;
  portal: NsfasPortalId;
}

export const TVET_COLLEGES: TvetCollege[] = [
  { id: 'buffalo-city', name: 'Buffalo City TVET College', province: 'Eastern Cape', website: 'https://bccollege.co.za', portal: 'profprod' },
  { id: 'emcol', name: 'East Cape Midlands TVET College', province: 'Eastern Cape', website: 'https://emcol.co.za', portal: 'profprod' },
  { id: 'ikhala', name: 'Ikhala TVET College', province: 'Eastern Cape', website: 'https://ikhala.edu.za', portal: 'profprod' },
  { id: 'ingwe', name: 'Ingwe TVET College', province: 'Eastern Cape', website: 'https://www.ingwecollege.edu.za', portal: 'profprod' },
  { id: 'king-hintsa', name: 'King Hintsa TVET College', province: 'Eastern Cape', website: 'https://www.khc.edu.za', portal: 'profprod' },
  { id: 'ksd', name: 'King Sabata Dalindyebo TVET College', province: 'Eastern Cape', website: 'https://www.ksdcollege.edu.za', portal: 'profprod' },
  { id: 'lovedale', name: 'Lovedale TVET College', province: 'Eastern Cape', website: 'https://lovedale.edu.za', portal: 'profprod' },
  { id: 'pe', name: 'Port Elizabeth TVET College', province: 'Eastern Cape', website: 'https://www.pecollege.edu.za', portal: 'profprod' },
  { id: 'flavius-mareka', name: 'Flavius Mareka TVET College', province: 'Free State', website: 'https://flaviusmareka.net', portal: 'profprod' },
  { id: 'goldfields', name: 'Goldfields TVET College', province: 'Free State', website: 'https://goldfieldstvet.edu.za', portal: 'profprod' },
  { id: 'maluti', name: 'Maluti TVET College', province: 'Free State', website: 'https://www.malutitvet.co.za', portal: 'profprod' },
  { id: 'motheo', name: 'Motheo TVET College', province: 'Free State', website: 'https://www.motheotvet.edu.za', portal: 'profprod' },
  { id: 'cjc', name: 'Central Johannesburg TVET College', province: 'Gauteng', website: 'https://cjc.edu.za', portal: 'ndtprod' },
  { id: 'eec', name: 'Ekurhuleni East TVET College', province: 'Gauteng', website: 'https://eec.edu.za', portal: 'ndtprod' },
  { id: 'ewc', name: 'Ekurhuleni West TVET College', province: 'Gauteng', website: 'https://www.ewc.edu.za', portal: 'ndtprod' },
  { id: 'sedibeng', name: 'Sedibeng TVET College', province: 'Gauteng', website: 'https://www.sedcol.co.za', portal: 'ndtprod' },
  { id: 'swgc', name: 'South West Gauteng TVET College', province: 'Gauteng', website: 'https://www.swgc.co.za', portal: 'ndtprod' },
  { id: 'tnc', name: 'Tshwane North TVET College', province: 'Gauteng', website: 'https://www.tnc.edu.za', portal: 'tymprod' },
  { id: 'tsc', name: 'Tshwane South TVET College', province: 'Gauteng', website: 'https://www.tsc.edu.za', portal: 'tymprod' },
  { id: 'westcol', name: 'Western TVET College', province: 'Gauteng', website: 'https://westcol.co.za', portal: 'ndtprod' },
  { id: 'coastal-kzn', name: 'Coastal KZN TVET College', province: 'KwaZulu-Natal', website: 'https://www.coastalkzn.co.za', portal: 'xgprod' },
  { id: 'elangeni', name: 'Elangeni TVET College', province: 'KwaZulu-Natal', website: 'https://www.elangeni.edu.za', portal: 'xgprod' },
  { id: 'esayidi', name: 'Esayidi TVET College', province: 'KwaZulu-Natal', website: 'https://esayiditvet.co.za', portal: 'xgprod' },
  { id: 'majuba', name: 'Majuba TVET College', province: 'KwaZulu-Natal', website: 'https://www.majuba.edu.za', portal: 'xgprod' },
  { id: 'mnambithi', name: 'Mnambithi TVET College', province: 'KwaZulu-Natal', website: 'https://www.mnambithicollege.co.za', portal: 'xgprod' },
  { id: 'mthashana', name: 'Mthashana TVET College', province: 'KwaZulu-Natal', website: 'https://www.mthashanacollege.co.za', portal: 'xgprod' },
  { id: 'thekwini', name: 'Thekwini TVET College', province: 'KwaZulu-Natal', website: 'https://www.thekwini.edu.za', portal: 'xgprod' },
  { id: 'umfolozi', name: 'uMfolozi TVET College', province: 'KwaZulu-Natal', website: 'https://umfolozicollege.co.za', portal: 'xgprod' },
  { id: 'umgungundlovu', name: 'uMgungundlovu TVET College', province: 'KwaZulu-Natal', website: 'https://www.utvet.co.za', portal: 'xgprod' },
  { id: 'capricorn', name: 'Capricorn TVET College', province: 'Limpopo', website: 'https://capricorncollege.edu.za', portal: 'tymprod' },
  { id: 'lephalale', name: 'Lephalale TVET College', province: 'Limpopo', website: 'http://leptvetcol.edu.za', portal: 'tymprod' },
  { id: 'letaba', name: 'Letaba TVET College', province: 'Limpopo', website: 'https://www.letcol.co.za', portal: 'tymprod' },
  { id: 'mopani', name: 'Mopani TVET College', province: 'Limpopo', website: 'https://mopanicollege.edu.za', portal: 'tymprod' },
  { id: 'sekhukhune', name: 'Sekhukhune TVET College', province: 'Limpopo', website: 'https://www.sekhukhunetvet.edu.za', portal: 'tymprod' },
  { id: 'vhembe', name: 'Vhembe TVET College', province: 'Limpopo', website: 'https://www.vhembecollege.edu.za', portal: 'tymprod' },
  { id: 'waterberg', name: 'Waterberg TVET College', province: 'Limpopo', website: 'https://www.waterbergcollege.co.za', portal: 'tymprod' },
  { id: 'ehlanzeni', name: 'Ehlanzeni TVET College', province: 'Mpumalanga', website: 'https://www.ehlanzenicollege.co.za', portal: 'xgprod' },
  { id: 'gert-sibande', name: 'Gert Sibande TVET College', province: 'Mpumalanga', website: 'https://gscollege.edu.za', portal: 'xgprod' },
  { id: 'nkangala', name: 'Nkangala TVET College', province: 'Mpumalanga', website: 'https://www.ntc.edu.za', portal: 'xgprod' },
  { id: 'ncr', name: 'Northern Cape Rural TVET College', province: 'Northern Cape', website: 'https://www.ncrtvet.com', portal: 'profprod' },
  { id: 'ncu', name: 'Northern Cape Urban TVET College', province: 'Northern Cape', website: 'https://www.ncutvet.edu.za', portal: 'profprod' },
  { id: 'orbit', name: 'Orbit TVET College', province: 'North West', website: 'https://www.orbitcollege.co.za', portal: 'ndtprod' },
  { id: 'taletso', name: 'Taletso TVET College', province: 'North West', website: 'https://taletso.edu.za', portal: 'ndtprod' },
  { id: 'vuselela', name: 'Vuselela TVET College', province: 'North West', website: 'https://vuselelacollege.co.za', portal: 'ndtprod' },
  { id: 'boland', name: 'Boland TVET College', province: 'Western Cape', website: 'https://bolandcollege.com', portal: 'profprod' },
  { id: 'cct', name: 'College of Cape Town', province: 'Western Cape', website: 'https://www.cct.edu.za', portal: 'profprod' },
  { id: 'false-bay', name: 'False Bay TVET College', province: 'Western Cape', website: 'https://falsebaycollege.co.za', portal: 'profprod' },
  { id: 'northlink', name: 'Northlink TVET College', province: 'Western Cape', website: 'https://www.northlink.co.za', portal: 'profprod' },
  { id: 'south-cape', name: 'South Cape TVET College', province: 'Western Cape', website: 'https://sccollege.co.za', portal: 'profprod' },
  { id: 'west-coast', name: 'West Coast TVET College', province: 'Western Cape', website: 'https://www.westcoastcollege.co.za', portal: 'profprod' },
];
