import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FileQuestion, Users, BarChart3, LogOut, BarChart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";

const adminNavItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Quizzes", url: "/admin/quizzes", icon: FileQuestion },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Performance", url: "/admin/performance", icon: BarChart },
  { title: "Logout", url: "/logout", icon: LogOut },
];

type PerfRow = { quiz_id: string; title: string; type: string; attempts_count: number; average_percentage: number };

const AdminPerformance = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-performance"],
    queryFn: async (): Promise<PerfRow[]> => {
      const { data, error } = await supabase
        .from("quiz_performance")
        .select("quiz_id, title, type, attempts_count, average_percentage")
        .order("attempts_count", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PerfRow[];
    },
  });
  return (
    <div className="flex min-h-screen">
      <Sidebar items={adminNavItems} />

      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Performance</h1>
            <p className="text-muted-foreground">All quizzes and their engagement</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(data ?? []).map((q) => (
              <Card key={q.quiz_id} className="p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-semibold">{q.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {(q as any).type?.toUpperCase?.() || ""} • {q.attempts_count} Attempts • Avg {q.average_percentage}%
                  </p>
                </div>
                <Button className="bg-primary hover:bg-primary/90" onClick={() => navigate(`/admin/quizzes/${q.quiz_id}`)}>
                  Check Performance
                </Button>
              </Card>
            ))}
          </div>
          {isLoading && (
            <div className="text-center text-muted-foreground py-8">Loading...</div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPerformance;
