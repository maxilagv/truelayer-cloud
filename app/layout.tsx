import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Truelayer Cloud',
  description: 'Admin panel and public catalog'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="main-shell">{children}</div>
      </body>
    </html>
  );
}
