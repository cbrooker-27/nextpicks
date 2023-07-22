import Layout from "@/components/layout/layout";
import '../styles/globals.css';

export const metadata = {
  title: "ChrisBrooker.com",
  description: "New and improved site written in React",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body >
        <Layout>
        {children}
        <div id="notifications"></div>
        </Layout>
      </body>
    </html>
  );
}
