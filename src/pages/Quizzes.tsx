import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, FileQuestion, History, User, LogOut, Clock, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
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

type QuizRow = { id: string; title: string; type: "mcq" | "practical" };

const Quizzes = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: quizzes, isLoading } = useQuery({
    queryKey: ["user-quizzes"],
    queryFn: async (): Promise<QuizRow[]> => {
      const { data, error } = await supabase
        .from("quizzes")
        .select("id, title, type")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as QuizRow[];
    },
  });

  const { data: completedIds } = useQuery({
    queryKey: ["user-quiz-completed", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await supabase
        .from("attempts")
        .select("quiz_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return new Set((data ?? []).map((r: any) => r.quiz_id as string));
    },
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar items={userNavItems} />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Available Quizzes</h1>
            <p className="text-muted-foreground">
              Challenge yourself with our curated collection of quizzes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(quizzes ?? []).map((quiz) => (
              <Card
                key={quiz.id}
                className="p-6 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{quiz.title}</h3>
                    <p className="text-sm text-muted-foreground">{quiz.type.toUpperCase()}</p>
                  </div>

                  {completedIds?.has(quiz.id) ? (
                    <Button className="w-full" variant="outline" disabled>
                      Completed
                    </Button>
                  ) : (
                    <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => navigate(`/quizzes/${quiz.id}`)}>
                      Start Quiz
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {isLoading && (
            <div className="text-center py-16">
              <FileQuestion className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Loading...</h3>
            </div>
          )}

          {!isLoading && (quizzes ?? []).length === 0 && (
            <div className="text-center py-16">
              <FileQuestion className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Quizzes Found</h3>
              <p className="text-muted-foreground">
                Check back later for new quizzes
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Quizzes;
