import '../styles/globals.css';
import React from 'react';
import Providers from '@/components/Providers';

export const metadata = {
  title: 'Event Dashboard',
  description: 'Event management dashboard with reminders',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}