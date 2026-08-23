import ResponsiveDrawer from "./responsiveDrawer";
import { SessionProvider } from "next-auth/react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";

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
        <AppRouterCacheProvider>
          <SessionProvider>
            <ResponsiveDrawer>
              {children}
              <div id="notifications"></div>
            </ResponsiveDrawer>
          </SessionProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
