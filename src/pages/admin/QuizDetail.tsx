import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FileQuestion, Users, BarChart3, LogOut, ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase";

const adminNavItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Quizzes", url: "/admin/quizzes", icon: FileQuestion },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Logout", url: "/logout", icon: LogOut },
];

type AttemptRow = { id: string; score: number; total: number; created_at: string; profiles: { name: string | null; email: string | null } | null };

const QuizDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [title, setTitle] = useState<string>("");
  const [questionsCount, setQuestionsCount] = useState<number>(0);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) return;
      setLoading(true);
      const { data: quiz, error: qErr } = await supabase.from("quizzes").select("title").eq("id", id).maybeSingle();
      if (qErr || !quiz) {
        setLoading(false);
        return;
      }
      setTitle(quiz.title);
      const { count } = await supabase
        .from("questions")
        .select("id", { count: "exact", head: true })
        .eq("quiz_id", id);
      setQuestionsCount(count ?? 0);

      const { data: atts } = await supabase
        .from("attempts")
        .select("id, score, total, created_at, profiles: user_id (name, email)")
        .eq("quiz_id", id)
        .order("created_at", { ascending: false });
      setAttempts((atts ?? []) as unknown as AttemptRow[]);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 text-center w-full max-w-xl">Loading...</Card>
      </div>
    );
  }
  if (!id || !title) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 text-center w-full max-w-xl">
          <h1 className="text-2xl font-semibold mb-2">Quiz Not Found</h1>
          <p className="text-muted-foreground mb-6">The requested quiz does not exist.</p>
          <Button onClick={() => navigate("/admin/quizzes")}>Back to Quizzes</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar items={adminNavItems} />
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{title}</h1>
              <p className="text-muted-foreground">{questionsCount} questions • {attempts.length} total attempts</p>
            </div>
          </div>

          {/* Header stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Total Attempts</p>
              <p className="text-2xl font-semibold">{attempts.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Average Score %</p>
              <p className="text-2xl font-semibold">
                {attempts.length
                  ? Math.round(attempts.reduce((acc, a) => acc + (a.score / a.total) * 100, 0) / attempts.length)
                  : 0}
                %
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Questions</p>
              <p className="text-2xl font-semibold">{questionsCount}</p>
            </Card>
          </div>

          <Card className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-6 py-3 font-medium">Name</th>
                  <th className="text-left px-6 py-3 font-medium">Email</th>
                  <th className="text-left px-6 py-3 font-medium">Score</th>
                  <th className="text-left px-6 py-3 font-medium">Percentage</th>
                  <th className="text-left px-6 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a.id} className="border-t border-border/60">
                    <td className="px-6 py-4">{a.profiles?.name ?? "(no name)"}</td>
                    <td className="px-6 py-4 text-muted-foreground">{a.profiles?.email ?? "(no email)"}</td>
                    <td className="px-6 py-4">{a.score}/{a.total}</td>
                    <td className="px-6 py-4">{Math.round((a.score / a.total) * 100)}%</td>
                    <td className="px-6 py-4 text-muted-foreground">{new Date(a.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {attempts.length === 0 && (
                  <tr>
                    <td className="px-6 py-10 text-center text-muted-foreground" colSpan={5}>No attempts yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default QuizDetail;
