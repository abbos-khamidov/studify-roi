import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)] md:flex-row">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col pb-[4.5rem] md:pb-0">
        <Header />
        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
