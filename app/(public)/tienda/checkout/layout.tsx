import { Metadata } from 'next';

export const metadata: Metadata = {
  robots: 'noindex',
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}