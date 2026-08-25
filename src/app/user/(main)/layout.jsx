import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./all-section.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata = {
  title: "Roventar — AI-Powered Digital Trading Technology",
  description:
    "Roventar is a futuristic trading technology ecosystem combining AI-driven analytics, automated infrastructure and global market data.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-void font-sans text-offwhite antialiased">
        {children}
      </body>
    </html>
  );
}