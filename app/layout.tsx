import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NFL God Squad',
  description: 'Draft NFL legends and team units from historic eras, then simulate a 17-game chase for perfection.',
  keywords: ['NFL', 'football', 'fantasy', 'team builder', 'simulation', 'historical football'],
  openGraph: {
    title: 'NFL God Squad',
    description: 'Build an all-time NFL squad and try to go 17-0.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0a0a] text-gray-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
