import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase";

type Quiz = { id: string; title: string; type: "mcq" | "practical"; duration_minutes: number | null };
type Question = { id: string; title: string; body: string | null; position: number };
type Option = { id: string; question_id: string; position: number; text: string; is_correct: boolean };

const QuizAttempt = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [options, setOptions] = useState<Record<string, Option[]>>({});
  const [answers, setAnswers] = useState<Record<string, string | null>>({}); // MCQ: option id, Practical: text keyed by 'practical'
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [remainingSec, setRemainingSec] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      if (!id) return;
      setLoading(true);
      const { data: qz, error: qErr } = await supabase
        .from("quizzes")
        .select("id, title, type, duration_minutes")
        .eq("id", id)
        .maybeSingle();
      if (qErr || !qz) {
        setLoading(false);
        return;
      }
      setQuiz(qz as Quiz);
      if ((qz as any).duration_minutes && (qz as any).duration_minutes > 0) {
        setRemainingSec(((qz as any).duration_minutes as number) * 60);
      } else {
        setRemainingSec(null);
      }

      const { data: qs, error: qsErr } = await supabase
        .from("questions")
        .select("id, title, body, position")
        .eq("quiz_id", id)
        .order("position", { ascending: true });
      if (qsErr) {
        setLoading(false);
        return;
      }
      setQuestions((qs ?? []) as Question[]);

      if (qz.type === "mcq" && qs && qs.length) {
        const qids = qs.map((x: any) => x.id);
        const { data: opts } = await supabase
          .from("mcq_options")
          .select("id, question_id, position, text, is_correct")
          .in("question_id", qids)
          .order("position", { ascending: true });
        const grouped: Record<string, Option[]> = {};
        (opts ?? []).forEach((o: any) => {
          (grouped[o.question_id] ||= []).push(o as Option);
        });
        setOptions(grouped);
      }
      setLoading(false);
    })();
  }, [id]);

  // Countdown effect
  useEffect(() => {
    if (remainingSec == null) return;
    if (remainingSec <= 0) {
      // auto-submit once
      if (!submitting) handleSubmit();
      return;
    }
    const t = setInterval(() => {
      setRemainingSec((s) => (s == null ? s : s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [remainingSec, submitting]);

  const handleSelect = (qid: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [qid]: optionId }));
  };

  const handleSubmit = async () => {
    if (!quiz || !id) return;
    setSubmitting(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) throw new Error("Not authenticated");

      let score = 0;
      let total = questions.length;

      if (quiz.type === "mcq") {
        // Ensure all questions are answered
        const unanswered = questions.find((q) => !answers[q.id]);
        if (unanswered) {
          toast({ title: "Incomplete", description: "Please answer all questions before submitting.", variant: "destructive" });
          setSubmitting(false);
          return;
        }
        // compute score locally from options map
        for (const q of questions) {
          const sel = answers[q.id];
          const list = options[q.id] || [];
          const correct = list.find((o) => o.is_correct);
          if (sel && correct && sel === correct.id) score += 1;
        }
      }

      const durationUsed = quiz.duration_minutes && remainingSec != null
        ? Math.max(0, quiz.duration_minutes * 60 - remainingSec)
        : null;
      const { data: attemptRow, error: aErr } = await supabase
        .from("attempts")
        .insert({ quiz_id: id, user_id: uid, score, total, duration_used_seconds: durationUsed })
        .select("id")
        .single();
      if (aErr) throw aErr;
      const attemptId = attemptRow.id as string;

      // Insert answers
      if (quiz.type === "mcq") {
        const answerRows = questions
          .map((q) => ({
            attempt_id: attemptId,
            question_id: q.id,
            selected_option_id: (answers[q.id] as string) || null,
            answer_text: null,
            is_correct: (() => {
              const list = options[q.id] || [];
              const correct = list.find((o) => o.is_correct);
              return correct ? correct.id === answers[q.id] : null;
            })(),
          }));
        if (answerRows.length) await supabase.from("attempt_answers").insert(answerRows);
      } else {
        // practical: single text area answer saved against first question
        const text = (answers[questions[0]?.id] as string) || "";
        await supabase.from("attempt_answers").insert({
          attempt_id: attemptId,
          question_id: questions[0]?.id,
          selected_option_id: null,
          answer_text: text,
          is_correct: null,
        });
      }

      toast({ title: "Quiz submitted", description: `You scored ${score}/${total}` });
      navigate("/history");
    } catch (e) {
      toast({ title: "Submit failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-xl p-6 text-center">Loading...</Card>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-xl p-6 text-center">
          <h1 className="text-2xl font-semibold mb-2">Quiz Not Found</h1>
          <p className="text-muted-foreground mb-6">The requested quiz does not exist.</p>
          <Button onClick={() => navigate("/quizzes")}>Back to Quizzes</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{quiz.title}</h1>
          <p className="text-muted-foreground">Answer the questions below and submit to see your score.</p>
          <p className="text-muted-foreground">If practical please submit your github link, hosted link and documentaton</p>
          {remainingSec != null && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
              <span>Time left:</span>
              <span className="font-semibold">
                {Math.floor(remainingSec / 60).toString().padStart(2, "0")}:{(remainingSec % 60).toString().padStart(2, "0")}
              </span>
            </div>
          )}
        </div>

        {quiz.type === "mcq" ? (
          questions.map((q, idx) => (
            <Card key={q.id} className="p-6 space-y-4">
              <div className="font-medium">{idx + 1}. {q.title}</div>
              <div className="grid gap-2">
                {(options[q.id] || []).map((opt) => {
                  const selected = answers[q.id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelect(q.id, opt.id)}
                      className={`text-left p-3 rounded border transition-colors ${selected ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50"}`}
                    >
                      {opt.text}
                    </button>
                  );
                })}
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-6 space-y-4">
            <div className="font-medium">Task</div>
            <textarea
              className="min-h-[160px] w-full rounded-md border border-border bg-background px-3 py-2"
              placeholder="Enter your answer here"
              value={(answers[questions[0]?.id] as string) || ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [questions[0]?.id || "practical"]: e.target.value }))}
            />
          </Card>
        )}

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate("/quizzes")} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Quiz"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuizAttempt;
