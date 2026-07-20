import localFont from "next/font/local";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./globals.css";

const carterFont = localFont({
  src: "../../public/fonts/CarterOne-Regular.ttf",
  variable: "--font-carter",
<<<<<<< HEAD
=======
  display: 'swap',
>>>>>>> 453d276 (Initial clean commit)
});

const shareTechFont = localFont({
  src: "../../public/fonts/ShareTech-Regular.ttf",
  variable: "--font-share",
<<<<<<< HEAD
=======
  display: 'swap',
>>>>>>> 453d276 (Initial clean commit)
});

export const metadata = {
  title: "AI Learning Platform",
  description: "Enterprise-grade AI Course Generator and LMS",
};

export default function RootLayout({ children }) {
  return (
<<<<<<< HEAD
    <html lang="en">
      <body className={`${carterFont.variable} ${shareTechFont.variable} font-sans`}>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
          {children}
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
=======
    // Apply the font variable to the HTML tag
    <html lang="en">
      <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
        <body className={`${carterFont.variable} ${shareTechFont.variable} font-sans text-slate-900 dark:text-slate-100 antialiased`}>
          {children}
        </body>
      </GoogleOAuthProvider>
    </html>
  );
}


>>>>>>> 453d276 (Initial clean commit)
