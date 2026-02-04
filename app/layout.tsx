import type { ReactNode } from 'react';
import '../src/styles/index.css';

export const metadata = {
  title: 'Shopping Notes',
  description: 'Grocery list and recipe organizer',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  appleWebApp: {
    title: 'Shopping Notes',
    capable: true,
    statusBarStyle: 'default',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
