import type { Metadata } from 'next';
import SensumCSATView from '@/modules/sensum-csat/components/SensumCSATView';

export const metadata: Metadata = {
  title: 'Sensum CSAT | CX One Dashboard',
  description: 'Facility Customer Satisfaction Survey analytics from Sensum — 25,000+ distinct response records across API, IDM, IJH, ITDC, Sarinah and IAS.',
};

export default function SensumCSATPage() {
  return <SensumCSATView />;
}
