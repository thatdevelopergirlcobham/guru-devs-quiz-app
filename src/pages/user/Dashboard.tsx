import { Sidebar } from "@/components/layout/Sidebar";
import { StatsCard } from "@/components/ui/stats-card";
import { LayoutDashboard, FileQuestion, History, User, LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { useAuth } from "@/lib/auth";

const userNavItems = [
  { title: "Dashboard", url: "/user/dashboard", icon: LayoutDashboard },
  { title: "Quizzes", url: "/quizzes", icon: FileQuestion },
  { title: "History", url: "/history", icon: History },
  { title: "Profile", url: "/profile", icon: User },
  { title: "Logout", url: "/logout", icon: LogOut },
];

const UserDashboard = () => {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["user-dashboard", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      // Fetch up to 1000 attempts for stats
      const { data: attempts } = await supabase
        .from("attempts")
        .select("id, score, total, created_at, quizzes: quiz_id (title)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1000);

      // Recommended quizzes: latest 3 for now
      const { data: quizzes } = await supabase
        .from("quizzes")
        .select("id, title, type")
        .order("created_at", { ascending: false })
        .limit(3);

      const list = (attempts ?? []) as unknown as { id: string; score: number; total: number; created_at: string; quizzes: { title: string } | null }[];
      const completed = list.length;
      const passed = list.filter((a) => a.total ? (a.score / a.total) * 100 >= 50 : false).length;
      const failed = completed - passed;
      const passPct = completed ? Math.round((passed / completed) * 100) : 0;

      const recent = list.slice(0, 5);

      return { completed, passed, failed, passPct, recent, quizzes: quizzes ?? [] };
    },
  });
  return (
    <div className="flex min-h-screen">
      <Sidebar items={userNavItems} />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome Back!</h1>
            <p className="text-muted-foreground">
              Track your progress and continue your learning journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard title="Quizzes Completed" value={isLoading ? "…" : String(data?.completed ?? 0)} icon={FileQuestion} variant="default" />
            <StatsCard title="Passed" value={isLoading ? "…" : String(data?.passed ?? 0)} icon={LayoutDashboard} trend={isLoading ? "" : `${data?.passPct ?? 0}% success rate`} variant="success" />
            <StatsCard title="Failed" value={isLoading ? "…" : String(data?.failed ?? 0)} icon={LayoutDashboard} trend={isLoading ? "" : `${100 - (data?.passPct ?? 0)}% to improve`} variant="destructive" />
            <StatsCard title="Pass Percentage" value={isLoading ? "…" : `${data?.passPct ?? 0}%`} icon={LayoutDashboard} trend={isLoading ? "" : "Keep it up!"} variant="success" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-card border border-border">
              <h3 className="text-lg font-semibold mb-4">Recent Attempts</h3>
              <div className="space-y-4">
                {(data?.recent ?? []).map((a) => {
                  const pct = a.total ? Math.round((a.score / a.total) * 100) : 0;
                  const status = pct >= 50 ? "passed" : "failed" as const;
                  return (
                    <AttemptCard
                      key={a.id}
                      title={a.quizzes?.title ?? "Quiz"}
                      score={`${a.score}/${a.total}`}
                      status={status}
                      date={new Date(a.created_at).toLocaleString()}
                    />
                  );
                })}
                {!isLoading && (data?.recent?.length ?? 0) === 0 && (
                  <p className="text-sm text-muted-foreground">No attempts yet</p>
                )}
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-card border border-border">
              <h3 className="text-lg font-semibold mb-4">Recommended Quizzes</h3>
              <div className="space-y-3">
                {(data?.quizzes ?? []).map((q: any) => (
                  <div key={q.id} className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer" onClick={() => window.location.assign(`/quizzes`)}>
                    <p className="font-medium">{q.title}</p>
                    <p className="text-sm text-muted-foreground">{q.type?.toUpperCase?.()}</p>
                  </div>
                ))}
                {!isLoading && (data?.quizzes?.length ?? 0) === 0 && (
                  <p className="text-sm text-muted-foreground">No quizzes yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

interface AttemptCardProps {
  title: string;
  score: string;
  status: "passed" | "failed";
  date: string;
}

function AttemptCard({ title, score, status, date }: AttemptCardProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{date}</p>
      </div>
      <div className="text-right">
        <p className="font-semibold">{score}</p>
        <span
          className={`text-xs px-2 py-1 rounded ${
            status === "passed"
              ? "bg-success/20 text-success"
              : "bg-destructive/20 text-destructive"
          }`}
        >
          {status}
        </span>
      </div>
    </div>
  );
}

export default UserDashboard;
