import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, FileQuestion, History as HistoryIcon, User, LogOut, CalendarClock, CheckCircle2, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { useAuth } from "@/lib/auth";

const userNavItems = [
  { title: "Dashboard", url: "/user/dashboard", icon: LayoutDashboard },
  { title: "Quizzes", url: "/quizzes", icon: FileQuestion },
  { title: "History", url: "/history", icon: HistoryIcon },
  { title: "Profile", url: "/profile", icon: User },
  { title: "Logout", url: "/logout", icon: LogOut },
];

const History = () => {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["history", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attempts")
        .select("id, score, total, created_at, quizzes: quiz_id (title)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Array<{ id: string; score: number; total: number; created_at: string; quizzes: { title: string } | null }>;
    },
  });
  return (
    <div className="flex min-h-screen">
      <Sidebar items={userNavItems} />

      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Quiz History</h1>
            <p className="text-muted-foreground">Your recent quiz attempts and results</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {(data ?? []).map((a) => {
              const percent = Math.round((a.score / a.total) * 100);
              const pass = percent >= 50; // heuristic pass threshold
              return (
                <Card key={a.id} className="p-6 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-lg">{a.quizzes?.title ?? "Quiz"}</p>
                      {pass ? (
                        <Badge className="bg-success hover:bg-success/90 flex items-center gap-1" variant="default"><CheckCircle2 className="h-4 w-4" /> passed</Badge>
                      ) : (
                        <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-4 w-4" /> failed</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-3">
                      <span className="flex items-center gap-1"><CalendarClock className="h-4 w-4" /> {new Date(a.created_at).toLocaleString()}</span>
                      <span>Score: {a.score}/{a.total} ({percent}%)</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {isLoading && (
            <div className="text-center py-16 text-muted-foreground">Loading...</div>
          )}
          {(!isLoading && (data?.length ?? 0) === 0) && (
            <div className="text-center py-16">
              <HistoryIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Attempts Yet</h3>
              <p className="text-muted-foreground">Start a quiz to see your history here</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default History;
