import type { Metadata, Viewport } from 'next';
import { Hanken_Grotesk, Spectral } from 'next/font/google';

import { LangSwitch } from '@/components/lang-switch';
import { MobileNav, Sidebar, TopbarTitle } from '@/components/nav';
import { ThemeToggle, themeInitScript } from '@/components/theme-toggle';
import { APP_NAME } from '@/config/tabs';
import { I18nProvider } from '@/i18n/client';
import { getI18n } from '@/i18n/server';

import './globals.css';

// Fonty z designu. next/font pobiera je w trakcie builda i serwuje lokalnie,
// więc aplikacja na Pi działa bez dostępu do internetu.
// Hanken Grotesk jest fontem zmiennym — bez `weight` dostajemy pełen zakres.
const sans = Hanken_Grotesk({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-sans',
  display: 'swap',
});

const serif = Spectral({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600'],
  variable: '--font-serif',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: APP_NAME,
    description: `${APP_NAME} — ${t.app.tagline}.`,
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale } = await getI18n();

  return (
    // Skrypt inicjalizujący podmienia data-theme przed hydratacją — to zamierzona
    // różnica względem HTML-a z serwera, więc uciszamy ostrzeżenie Reacta.
    <html
      lang={locale}
      data-theme="light"
      className={`${sans.variable} ${serif.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <I18nProvider locale={locale}>
          <div className="app">
            <Sidebar />

            <div className="shell">
              <header className="topbar">
                <div className="topbar-title">
                  <span className="topbar-mark">M</span>
                  <TopbarTitle />
                </div>
                <div className="topbar-actions">
                  <LangSwitch />
                  <ThemeToggle />
                </div>
              </header>

              <main className="main">
                <div className="content">{children}</div>
                <div className="mobile-pad" />
              </main>
            </div>

            <MobileNav />
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
