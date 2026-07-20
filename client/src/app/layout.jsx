import localFont from "next/font/local";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./globals.css";

const carterFont = localFont({
  src: "../../public/fonts/CarterOne-Regular.ttf",
  variable: "--font-carter",
});

const shareTechFont = localFont({
  src: "../../public/fonts/ShareTech-Regular.ttf",
  variable: "--font-share",
});

export const metadata = {
  title: "AI Learning Platform",
  description: "Enterprise-grade AI Course Generator and LMS",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${carterFont.variable} ${shareTechFont.variable} font-sans`}>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
          {children}
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}