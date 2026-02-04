import type { ReactNode } from 'react';
import '../src/styles/index.css';

export const metadata = {
  title: 'Shopping Notes',
  description: 'Grocery list and recipe organizer',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
