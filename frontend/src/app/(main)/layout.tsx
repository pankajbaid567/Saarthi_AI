import { Breadcrumbs } from '@/components/shell/breadcrumbs';
import { MainHeader } from '@/components/shell/main-header';
import { Sidebar } from '@/components/shell/sidebar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background md:flex">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MainHeader />
        <div className="space-y-4 p-4">
          <Breadcrumbs />
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
