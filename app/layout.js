import '../styles/globals.css';
import MainNavigation from "@/components/layout/main-navigation";

export const metadata = {
  title: "ChrisBrooker.com",
  description: "New and improved site written in React",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body >
        <MainNavigation/>
        <main>{children}</main>
        <div id="notifications"></div>
        
      </body>
    </html>
  );
}
