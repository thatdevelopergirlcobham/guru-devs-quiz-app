import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FileQuestion, Users, BarChart3, LogOut, Plus, Pencil, Trash2 } from "lucide-react";
// import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";

const adminNavItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Quizzes", url: "/admin/quizzes", icon: FileQuestion },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Logout", url: "/logout", icon: LogOut },
];

type Quiz = { id: string; title: string; type: "mcq" | "practical" };

const AdminQuizzes = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: quizzes } = useQuery({
    queryKey: ["admin-quizzes"],
    queryFn: async (): Promise<Quiz[]> => {
      const { data, error } = await supabase
        .from("quizzes")
        .select("id, title, type")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Quiz[];
    },
  });

  const { data: perf } = useQuery({
    queryKey: ["quiz-performance"],
    queryFn: async () => {
      const { data, error } = await supabase.from("quiz_performance").select("quiz_id, attempts_count");
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((r: any) => [r.quiz_id, r.attempts_count as number]));
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("quizzes")
        .insert({ title: "Untitled Quiz", type: "mcq", created_by: uid })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["admin-quizzes"] });
      navigate(`/admin/quizzes/${id}/edit`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quizzes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-quizzes"] }),
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar items={adminNavItems} />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Manage Quizzes</h1>
              <p className="text-muted-foreground">Create and manage quizzes</p>
            </div>
            <Button className="bg-primary hover:bg-primary/90" onClick={() => addMutation.mutate()}>
              <Plus className="h-4 w-4 mr-2" /> Add Quiz
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(quizzes ?? []).map((quiz) => (
              <Card
                key={quiz.id}
                className="p-6 space-y-4 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                onClick={() => navigate(`/admin/quizzes/${quiz.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{quiz.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {quiz.type.toUpperCase()} • {(perf && perf[quiz.id]) ?? 0} Attempts
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/quizzes/${quiz.id}/edit`);
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(quiz.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
              </Card>
            ))}
            {((quizzes ?? []).length === 0) && (
              <Card className="p-8 col-span-full flex flex-col items-center justify-center text-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-24 h-24 text-muted-foreground mb-4">
                  <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h8M12 8v8" />
                </svg>
                <p className="text-muted-foreground mb-4">No quizzes yet. Create your first quiz to get started.</p>
                {/* <Button className="rounded-full" onClick={() => addMutation.mutate()}>
                  <Plus className="h-4 w-4 mr-2" /> Create Quiz
                </Button> */}
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminQuizzes;
