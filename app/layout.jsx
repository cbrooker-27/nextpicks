import ResponsiveDrawer from "./responsiveDrawer";
import { SessionProvider } from "next-auth/react";

export const metadata = {
  title: "ChrisBrooker.com",
  description: "New and improved site written in React",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function Layout({ children }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <ResponsiveDrawer>
            {children}
            <div id="notifications"></div>
          </ResponsiveDrawer>
        </SessionProvider>
      </body>
    </html>
  );
}
