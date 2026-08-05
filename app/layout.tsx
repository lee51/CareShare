import './globals.css';
import Header from '../components/Header';
import RequireName from '../components/RequireName';

export const metadata = {
  title: 'CareShare',
  description: 'Quick pet & person care tracker',
  manifest: '/manifest.json',
  themeColor: '#6366F1',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gray-50 text-gray-900">
          <Header />
          <main className="max-w-3xl mx-auto p-4">
            <RequireName>{children}</RequireName>
          </main>
        </div>
      </body>
    </html>
  );
}
