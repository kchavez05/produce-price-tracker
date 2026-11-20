import type { Metadata } from 'next';
import ShopPage from '@/modules/shop/ShopPage';

export const metadata: Metadata = { title: 'Shop — PantryBot' };

export default function Page() {
  return <ShopPage />;
}
