import "../styles/globals.css";
import MainNavigation from "@/components/layout/main-navigation";
import MySessionProvider from "./mySessionProvider";

export const metadata = {
  title: "ChrisBrooker.com",
  description: "New and improved site written in React",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({ session, children }) {
  return (
    <html lang="en">
      <body>
        <MySessionProvider session={session}>
          <MainNavigation />
          <main>{children}</main>
          <div id="notifications"></div>
        </MySessionProvider>
      </body>
    </html>
  );
}
