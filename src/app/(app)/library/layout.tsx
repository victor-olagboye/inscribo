import { SignOutButton } from "@/components/sign-out-button";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <aside className="fixed left-0 top-0 h-full w-[68px] z-50 flex flex-col justify-between items-center py-space-lg bg-surface-container-lowest border-r border-[#E7E5E4]">
        <div className="flex flex-col items-center gap-space-xl w-full">
          <div className="flex flex-col items-center">
            <div className="w-9 h-9 rounded-xl bg-surface-container-low border border-[#E7E5E4] flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">
                auto_stories
              </span>
            </div>
            <span className="mt-1 font-title-editorial text-[11px] text-on-surface tracking-tight lowercase">
              inscribo<span className="text-primary font-bold">.</span>
            </span>
          </div>
          <nav className="flex flex-col items-center gap-space-sm w-full px-space-xs">
            <a
              href="/library"
              aria-current="page"
              className="w-12 h-12 flex flex-col items-center justify-center rounded-lg bg-surface-container-high text-primary"
            >
              <span className="material-symbols-outlined text-[22px]">
                auto_stories
              </span>
              <span className="font-label-caps text-[9px] uppercase tracking-wider mt-0.5">
                lib
              </span>
            </a>
          </nav>
        </div>
        <SignOutButton />
      </aside>
      <div className="pl-[68px] min-h-screen">{children}</div>
    </>
  );
}
