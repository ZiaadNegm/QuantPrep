import { Header } from "@/components/header";
import { ModuleTile } from "@/components/module-tile";
import { StatBlock } from "@/components/stat-block";

const modules = [
  { title: "Mental Math", href: "/mental-math", isActive: true },
  { title: "Coming Soon", isLocked: true },
  { title: "Coming Soon", isLocked: true },
  { title: "Coming Soon", isLocked: true },
  { title: "Coming Soon", isLocked: true },
  { title: "Coming Soon", isLocked: true },
  { title: "Coming Soon", isLocked: true },
  { title: "Coming Soon", isLocked: true },
  { title: "Coming Soon", isLocked: true },
];

export default function DashboardPage() {
  // Mock user data - replace with actual data when auth is implemented
  const isLoggedIn = true;
  const hasData = true;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header isLoggedIn={isLoggedIn} />

      <main className="flex flex-1 flex-col items-center justify-center px-6">
        {/* Module Matrix - Full viewport immersive display */}
        <section className="flex w-full max-w-lg flex-col items-center justify-center">
          <div className="grid w-full grid-cols-3 gap-4">
            {modules.map((module, index) => (
              <ModuleTile
                key={index}
                title={module.title}
                href={module.href}
                isActive={module.isActive}
                isLocked={module.isLocked}
              />
            ))}
          </div>

          {/* Progress Context - Only shown for logged in users */}
          {isLoggedIn && (
            <div className="mt-12 w-full border-t border-border-subtle pt-8">
              {hasData ? (
                <div className="flex justify-between">
                  <StatBlock label="Streak" value="7" subtext="days" />
                  <StatBlock label="Accuracy" value="94%" subtext="last 7 days" />
                  <StatBlock label="Avg. Time" value="2.3s" subtext="last 7 days" />
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-foreground-muted">
                    Complete a session to start tracking progress
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
