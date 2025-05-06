import "./globals.css";
import { Inter } from "next/font/google";
import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";
import { ThemeProvider } from "./providers";
import CustomUserDropdown from "@/components/navigation/CustomUserDropdown";
import SignupHandler from "@/components/authentication/SignupHandler";
// import ApiKeyConfig from '@/components/config/ApiKeyConfig';

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <SignupHandler />
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.className} min-h-screen antialiased`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <header className="flex justify-between items-center p-4 border-b border-border bg-card">
              <div>
                <h1 className="text-xl font-bold text-orange-500">NotHotDog</h1>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                  Agent Testing Framework
                </p>
              </div>

              {/* User Avatar with Custom Dropdown */}
              <div className="flex items-center">
                <SignedOut>
                  <SignInButton />
                </SignedOut>
                <SignedIn>
                  <CustomUserDropdown />
                </SignedIn>
              </div>
            </header>

            <main className="flex min-h-screen flex-col">
              {children}
              {/* <ApiKeyConfig /> */}
            </main>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
