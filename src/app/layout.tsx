import type { Metadata } from 'next';
import { Noto_Sans_TC } from 'next/font/google';
import { ReactNode } from 'react';

import AppProviders from '@/components/providers/AppProviders';

import './globals.css';

const notoSans = Noto_Sans_TC({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '700']
});

export const metadata: Metadata = {
  title: 'EasyMatching',
  description: '一個專為喜愛交流的你打造的聊天交友平台'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body className={`${notoSans.variable} antialiased`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
