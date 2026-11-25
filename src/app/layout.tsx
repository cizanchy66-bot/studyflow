import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'StudyFlow — Your study space',
  description: 'A calmer way to organize your student life and assignments.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
