import "../styles/globals.css";
import MainNavigation from "@/components/layout/main-navigation";
import MySessionProvider from "./mySessionProvider";
import Footer from "@/components/layout/footer";

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
          <main style={{ marginTop: "100px", marginBottom: "33px"}}>{children}</main>
          <div id="notifications"></div>
          <Footer />
        </MySessionProvider>
      </body>
    </html>
  );
}
