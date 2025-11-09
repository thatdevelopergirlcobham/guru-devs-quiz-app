import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/card";
import { StatsCard } from "@/components/ui/stats-card";
import { LayoutDashboard, FileQuestion, Users, BarChart3, LogOut } from "lucide-react";
import { ResponsiveContainer, BarChart as RBarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";

const adminNavItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Quizzes", url: "/admin/quizzes", icon: FileQuestion },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Logout", url: "/logout", icon: LogOut },
];

const AdminAnalytics = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      // Counts
      const [usersCountRes, quizzesCountRes, attemptsCountRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("quizzes").select("id", { count: "exact", head: true }),
        supabase.from("attempts").select("id", { count: "exact", head: true }),
      ]);
      const usersCount = usersCountRes.count ?? 0;
      const quizzesCount = quizzesCountRes.count ?? 0;
      const attemptsCount = attemptsCountRes.count ?? 0;

      // Average score percentage across attempts (sample last 1000)
      const { data: attemptsForAvg } = await supabase
        .from("attempts")
        .select("score,total,created_at")
        .order("created_at", { ascending: false })
        .limit(1000);
      const avgPct = (() => {
        const rows = (attemptsForAvg ?? []) as { score: number; total: number }[];
        if (!rows.length) return 0;
        return Math.round(
          rows.reduce((acc, r) => acc + (r.total ? (r.score / r.total) * 100 : 0), 0) / rows.length,
        );
      })();

      // Build last 7 days attempts chart
      const since = new Date();
      since.setDate(since.getDate() - 6); // include today
      const { data: recentAttempts } = await supabase
        .from("attempts")
        .select("id, created_at")
        .gte("created_at", since.toISOString());
      const byDay: Record<string, number> = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date(since);
        d.setDate(since.getDate() + i);
        const key = d.toLocaleDateString(undefined, { weekday: "short" });
        byDay[key] = 0;
      }
      (recentAttempts ?? []).forEach((r: any) => {
        const d = new Date(r.created_at);
        const key = d.toLocaleDateString(undefined, { weekday: "short" });
        if (byDay[key] !== undefined) byDay[key] += 1;
      });
      const attemptsData = Object.entries(byDay).map(([name, attempts]) => ({ name, attempts }));

      // Pass rate by quiz (from quiz_performance if exists)
      let passRateData: { name: string; pass: number }[] = [];
      const { data: perfView, error: perfErr } = await supabase
        .from("quiz_performance")
        .select("title, average_percentage")
        .order("attempts_count", { ascending: false })
        .limit(6);
      if (!perfErr && perfView) {
        passRateData = perfView.map((r: any) => ({ name: r.title, pass: Math.round(r.average_percentage ?? 0) }));
      } else {
        // Fallback: compute from attempts grouped by quiz (sample 500)
        const { data: raw } = await supabase
          .from("attempts")
          .select("score,total,quizzes: quiz_id (title)")
          .order("created_at", { ascending: false })
          .limit(500);
        const agg: Record<string, { sum: number; cnt: number }> = {};
        (raw ?? []).forEach((r: any) => {
          const title = r.quizzes?.title ?? "Quiz";
          const pct = r.total ? (r.score / r.total) * 100 : 0;
          (agg[title] ||= { sum: 0, cnt: 0 });
          agg[title].sum += pct;
          agg[title].cnt += 1;
        });
        passRateData = Object.entries(agg)
          .slice(0, 6)
          .map(([name, v]) => ({ name, pass: Math.round(v.sum / Math.max(1, v.cnt)) }));
      }

      return { usersCount, quizzesCount, attemptsCount, avgPct, attemptsData, passRateData };
    },
  });
  return (
    <div className="flex min-h-screen">
      <Sidebar items={adminNavItems} />

      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Analytics</h1>
            <p className="text-muted-foreground">Platform performance and trends</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard title="Total Attempts" value={isLoading ? "…" : String(data?.attemptsCount ?? 0)} icon={BarChart3} trend="" variant="default" />
            <StatsCard title="Active Users" value={isLoading ? "…" : String(data?.usersCount ?? 0)} icon={Users} trend="" variant="default" />
            <StatsCard title="Avg. Score %" value={isLoading ? "…" : `${data?.avgPct ?? 0}%`} icon={LayoutDashboard} trend="" variant="success" />
            <StatsCard title="Quizzes" value={isLoading ? "…" : String(data?.quizzesCount ?? 0)} icon={FileQuestion} trend="" variant="default" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 rounded-3xl">
              <h3 className="text-lg font-semibold mb-4">Daily Attempts</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RBarChart data={data?.attemptsData ?? []}>
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip />
                    <Bar dataKey="attempts" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                  </RBarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6 rounded-3xl">
              <h3 className="text-lg font-semibold mb-4">Pass Rate by Quiz</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RBarChart data={data?.passRateData ?? []}>
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip />
                    <Bar dataKey="pass" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                  </RBarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminAnalytics;
