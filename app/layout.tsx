/* app/layout.tsx */
import './globals.css';

export const metadata = {
  title: 'CareShare',
  description: 'Quick pet & person care tracker'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gray-50 text-gray-900">
          <header className="p-4 border-b bg-white">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-xl font-semibold">CareShare</h1>
            </div>
          </header>
          <main className="max-w-3xl mx-auto p-4">{children}</main>
        </div>
      </body>
    </html>
  );
}
