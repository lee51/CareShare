/* app/layout.tsx */
import './globals.css';
import Header from '../components/Header';

export const metadata = {
  title: 'CareShare',
  description: 'Quick pet & person care tracker'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gray-50 text-gray-900">
          <Header />
          <main className="max-w-3xl mx-auto p-4">{children}</main>
        </div>
      </body>
    </html>
  );
}
