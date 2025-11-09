import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { LayoutDashboard, FileQuestion, Users, BarChart3, LogOut, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase";

const adminNavItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Quizzes", url: "/admin/quizzes", icon: FileQuestion },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Logout", url: "/logout", icon: LogOut },
];

type MCQQuestion = {
  id: string;
  title: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

type QuizType = "mcq" | "practical";

const QuizEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [title, setTitle] = useState("Untitled Quiz");
  const [type, setType] = useState<QuizType>("mcq");

  const [mcqCount, setMcqCount] = useState("4");
  const [mcqQuestions, setMcqQuestions] = useState<MCQQuestion[]>([]);

  const [practicalTitle, setPracticalTitle] = useState("");
  const [practicalText, setPracticalText] = useState("");
  const [durationMin, setDurationMin] = useState<string>("");

  // Load quiz + questions/options
  useEffect(() => {
    (async () => {
      if (!id) return;
      const { data: quiz, error: qErr } = await supabase
        .from("quizzes")
        .select("title, type, duration_minutes")
        .eq("id", id)
        .maybeSingle();
      if (qErr || !quiz) return;
      setTitle(quiz.title);
      setType(quiz.type as QuizType);
      setDurationMin((quiz as any).duration_minutes != null ? String((quiz as any).duration_minutes) : "");

      const { data: qs, error: qsErr } = await supabase
        .from("questions")
        .select("id, title, body, position")
        .eq("quiz_id", id)
        .order("position", { ascending: true });
      if (qsErr) return;

      if ((quiz.type as QuizType) === "practical") {
        const first = (qs ?? [])[0];
        setPracticalTitle(first?.title ?? "");
        setPracticalText(first?.body ?? "");
        setMcqQuestions([]);
      } else {
        const qids = (qs ?? []).map((x: any) => x.id);
        let grouped: Record<string, { id: string; text: string; is_correct: boolean }[]> = {};
        if (qids.length) {
          const { data: opts } = await supabase
            .from("mcq_options")
            .select("id, question_id, text, is_correct, position")
            .in("question_id", qids)
            .order("position", { ascending: true });
          (opts ?? []).forEach((o: any) => {
            (grouped[o.question_id] ||= []).push({ id: o.id, text: o.text, is_correct: o.is_correct });
          });
        }
        const next: MCQQuestion[] = (qs ?? []).map((q: any) => {
          const list = grouped[q.id] || [];
          const correctIndex = Math.max(0, list.findIndex((o) => o.is_correct));
          return {
            id: q.id,
            title: q.title,
            options: list.length ? list.map((o) => o.text) : ["", "", "", ""],
            correctIndex: correctIndex === -1 ? 0 : correctIndex,
            explanation: "",
          } as MCQQuestion;
        });
        setMcqQuestions(next);
      }
    })();
  }, [id]);

  const createMcqSkeleton = (count: number) => {
    const next: MCQQuestion[] = Array.from({ length: count }).map((_, idx) => ({
      id: `q_${Date.now()}_${idx}`,
      title: "",
      options: ["", "", "", ""],
      correctIndex: 0,
      explanation: "",
    }));
    setMcqQuestions(next);
  };

  const addMcqQuestion = () => {
    setMcqQuestions((prev) => [
      ...prev,
      { id: `q_${Date.now()}`, title: "", options: ["", "", "", ""], correctIndex: 0, explanation: "" },
    ]);
  };

  const removeMcqQuestion = (qid: string) => {
    setMcqQuestions((prev) => prev.filter((q) => q.id !== qid));
  };

  const updateMcqField = (
    qid: string,
    updater: (q: MCQQuestion) => MCQQuestion
  ) => {
    setMcqQuestions((prev) => prev.map((q) => (q.id === qid ? updater(q) : q)));
  };

  const onSave = async () => {
    if (!id) return;
    try {
      // Validation: for MCQ, require non-empty question titles and all options completed
      if (type === "mcq") {
        for (let i = 0; i < mcqQuestions.length; i++) {
          const q = mcqQuestions[i];
          if (!q.title.trim()) {
            toast({ title: "Missing question title", description: `Please enter a title for question ${i + 1}.`, variant: "destructive" });
            return;
          }
          const trimmed = q.options.map((o) => (o ?? "").trim());
          if (trimmed.some((o) => !o)) {
            toast({ title: "Incomplete options", description: `All options must be filled for question ${i + 1}.`, variant: "destructive" });
            return;
          }
        }
      }

      // Update quiz meta
      const minutes = durationMin.trim() === "" ? null : Math.max(0, parseInt(durationMin, 10));
      const { error: quizErr } = await supabase.from("quizzes").update({ title, type, duration_minutes: minutes }).eq("id", id);
      if (quizErr) throw quizErr;

      // Fetch existing questions for cleanup
      const { data: existingQs } = await supabase
        .from("questions")
        .select("id")
        .eq("quiz_id", id);
      const existingIds = (existingQs ?? []).map((x: any) => x.id);

      // Delete options then questions (for fresh replace)
      if (existingIds.length) {
        await supabase.from("mcq_options").delete().in("question_id", existingIds);
        await supabase.from("questions").delete().in("id", existingIds);
      }

      if (type === "practical") {
        // Insert single practical question
        const { error: insErr } = await supabase.from("questions").insert({
          quiz_id: id,
          title: practicalTitle || "Practical Task",
          body: practicalText || "",
          position: 1,
        });
        if (insErr) throw insErr;
      } else {
        // Insert MCQ questions and then their options
        const qRows = mcqQuestions.map((q, idx) => ({ quiz_id: id, title: q.title || `Question ${idx + 1}`, body: null, position: idx + 1 }));
        const { data: insertedQs, error: qInsErr } = await supabase.from("questions").insert(qRows).select("id");
        if (qInsErr) throw qInsErr;
        const optionRows: any[] = [];
        (insertedQs || []).forEach((row: any, i: number) => {
          const q = mcqQuestions[i];
          const opts = q.options.length ? q.options : ["", "", "", ""];
          opts.forEach((text, pos) => {
            optionRows.push({
              question_id: row.id,
              position: pos + 1,
              text,
              is_correct: q.correctIndex === pos,
            });
          });
        });
        if (optionRows.length) {
          const { error: oErr } = await supabase.from("mcq_options").insert(optionRows);
          if (oErr) throw oErr;
        }
      }

      toast({ title: "Quiz saved", description: `Quiz “${title}” (${type}) updated.` });
      navigate(`/admin/quizzes/${id}`);
    } catch (e: any) {
      toast({ title: "Save failed", description: String(e.message ?? e), variant: "destructive" });
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar items={adminNavItems} />

      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Edit Quiz</h1>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => navigate(`/admin/quizzes/${id}`)}>View Details</Button>
              <Button className="bg-primary hover:bg-primary/90" onClick={onSave}>Save</Button>
            </div>
          </div>

          {/* Quiz meta */}
          <Card>
            <CardHeader>
              <CardTitle>Quiz Settings</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="quiz-title">Title</Label>
                <Input id="quiz-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter quiz title" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor="quiz-type">Type</Label>
                  <select
                    id="quiz-type"
                    value={type}
                    onChange={(e) => setType(e.target.value as QuizType)}
                    className="w-full h-10 rounded-md border border-border bg-background px-3"
                  >
                    <option value="mcq">Multiple Choice</option>
                    <option value="practical">Practical</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quiz-duration">Duration (minutes)</Label>
                  <Input id="quiz-duration" type="number" min={0} value={durationMin} onChange={(e) => setDurationMin(e.target.value)} placeholder="e.g. 20" />
                </div>
                {type === "mcq" && mcqQuestions.length === 0 && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="mcq-count">Number of Questions</Label>
                      <Input id="mcq-count" type="number" min={1} value={mcqCount} onChange={(e) => setMcqCount(e.target.value)} />
                    </div>
                    <div className="md:col-span-1">
                      <Button className="mt-2 md:mt-0" onClick={() => createMcqSkeleton(Math.max(1, parseInt(mcqCount || "1", 10)))}>
                        Create
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Questions builder */}
          {type === "practical" ? (
            <Card>
              <CardHeader>
                <CardTitle>Practical Question</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="practical-title">Title</Label>
                  <Input id="practical-title" value={practicalTitle} onChange={(e) => setPracticalTitle(e.target.value)} placeholder="Enter question title" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="practical-text">Instructions / Task</Label>
                  <textarea
                    id="practical-text"
                    value={practicalText}
                    onChange={(e) => setPracticalText(e.target.value)}
                    placeholder="Describe the task the learner should complete"
                    className="min-h-[160px] w-full rounded-md border border-border bg-background px-3 py-2"
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>MCQ Questions</CardTitle>
                <Button variant="outline" size="sm" onClick={addMcqQuestion}>
                  <Plus className="h-4 w-4 mr-1" /> Add Question
                </Button>
              </CardHeader>
              <CardContent className="grid gap-6">
                {mcqQuestions.map((q, idx) => (
                  <div key={q.id} className="p-4 rounded-lg border border-border">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <Label>Question {idx + 1} Title</Label>
                        <Input value={q.title} onChange={(e) => updateMcqField(q.id, (prev) => ({ ...prev, title: e.target.value }))} placeholder="Enter question title" />
                      </div>
                      <Button variant="destructive" size="icon" onClick={() => removeMcqQuestion(q.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      {q.options.map((opt, i) => (
                        <div key={i} className="space-y-1">
                          <Label>Option {i + 1}</Label>
                          <Input
                            value={opt}
                            onChange={(e) =>
                              updateMcqField(q.id, (prev) => {
                                const next = [...prev.options];
                                next[i] = e.target.value;
                                return { ...prev, options: next };
                              })
                            }
                            placeholder={`Option ${i + 1}`}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 items-end">
                      <div className="space-y-2">
                        <Label htmlFor={`correct-${q.id}`}>Correct Option</Label>
                        <select
                          id={`correct-${q.id}`}
                          value={q.correctIndex}
                          onChange={(e) => updateMcqField(q.id, (prev) => ({ ...prev, correctIndex: parseInt(e.target.value, 10) }))}
                          className="w-full h-10 rounded-md border border-border bg-background px-3"
                        >
                          {q.options.map((_, i) => (
                            <option key={i} value={i}>{`Option ${i + 1}`}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2 md:col-span-1">
                        <Label htmlFor={`exp-${q.id}`}>Explanation</Label>
                        <Input id={`exp-${q.id}`} value={q.explanation} onChange={(e) => updateMcqField(q.id, (prev) => ({ ...prev, explanation: e.target.value }))} placeholder="Optional explanation" />
                      </div>
                    </div>
                  </div>
                ))}

                {mcqQuestions.length === 0 && (
                  <p className="text-sm text-muted-foreground">Specify the number of questions above and click Create.</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default QuizEdit;
