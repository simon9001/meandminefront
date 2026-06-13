// Covers the root layout's Navbar and Footer so all auth pages are fully standalone
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-white">
      {children}
    </div>
  );
}
