import { Metadata } from 'next';

export const metadata: Metadata = {
  robots: 'noindex',
};

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}