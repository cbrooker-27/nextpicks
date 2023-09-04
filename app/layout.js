'use client'
import '../styles/globals.css';
import MainNavigation from "@/components/layout/main-navigation";
import { SessionProvider } from 'next-auth/react';

export const metadata = {
  title: "ChrisBrooker.com",
  description: "New and improved site written in React",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({session, children }) {
  return (
    <html lang="en">
      <body >
        <SessionProvider session={session}>
        <MainNavigation/>
        <main>{children}</main>
        <div id="notifications"></div>
        </SessionProvider>
      </body>
    </html>
  );
}
