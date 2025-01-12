import ResponsiveDrawer from "./responsiveDrawer";
import Footer from "@/components/layout/footer";
import MySessionProvider from "./mySessionProvider";

export const metadata = {
  title: "ChrisBrooker.com",
  description: "New and improved site written in React",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function Layout({ session, children }) {
  return (
    <html lang="en">
      <body>
        <MySessionProvider session={session}>
          <ResponsiveDrawer>{children}</ResponsiveDrawer>
          <div id="notifications"></div>
          <Footer />
        </MySessionProvider>
      </body>
    </html>
  );
}
