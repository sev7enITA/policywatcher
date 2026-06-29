/**
 * Embed layout — /embed/change/[id]
 *
 * Minimal layout that does NOT include the main app's navigation, sidebar,
 * or footer. This is critical: the embed renders inside an iframe on external
 * sites and must NOT inherit the full app shell.
 *
 * Only loads the minimum CSS (no globals.css) and sets viewport meta.
 */
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, padding: 0, background: 'transparent' }}>
        {children}
      </body>
    </html>
  );
}
