import "../styles/globals.css";
import MainNavigation from "@/components/layout/main-navigation";
import MySessionProvider from "./mySessionProvider";
import Footer from "@/components/layout/footer";

export const metadata = {
  title: "ChrisBrooker.com",
  description: "New and improved site written in React",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ session, children }) {
  //<MySessionProvider session={session}></MySessionProvider>
  return (
    <html lang="en">
      <body>
        
          <MainNavigation />
          <main style={{ marginTop: "100px", marginBottom: "33px"}}>{children}</main>
          <div id="notifications"></div>
          <Footer />
    
      </body>
    </html>
  );
}
