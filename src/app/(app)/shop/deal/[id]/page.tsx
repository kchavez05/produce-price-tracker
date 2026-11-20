import type { Metadata } from 'next';
import ShopPage from '@/modules/shop/ShopPage';

export const metadata: Metadata = { title: 'Deal Detail — PantryBot' };

// Deal Detail (v2.0 M4-3a) is the Shop at a path that names a deal; ShopPage reads the ingredient id from the path.
export default function Page() {
  return <ShopPage />;
}
