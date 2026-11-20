import type { Metadata } from 'next';
import WelcomePage from '@/modules/welcome/WelcomePage';

export const metadata: Metadata = { title: 'Welcome — PantryBot' };

export default function Page() {
  return <WelcomePage />;
}
