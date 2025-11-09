import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { LayoutDashboard, FileQuestion, History as HistoryIcon, User, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";

const userNavItems = [
  { title: "Dashboard", url: "/user/dashboard", icon: LayoutDashboard },
  { title: "Quizzes", url: "/quizzes", icon: FileQuestion },
  { title: "History", url: "/history", icon: HistoryIcon },
  { title: "Profile", url: "/profile", icon: User },
  { title: "Logout", url: "/logout", icon: LogOut },
];

const Profile = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", phone: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("name, email, phone")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as { name: string | null; email: string | null; phone: string | null } | null;
    },
  });

  useEffect(() => {
    if (data) {
      setForm({ name: data.name ?? "", email: data.email ?? user?.email ?? "", phone: data.phone ?? "" });
    } else if (user) {
      setForm((prev) => ({ ...prev, email: user.email ?? prev.email }));
    }
  }, [data, user]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: async (payload: { name: string; email: string; phone: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ name: payload.name, email: payload.email, phone: payload.phone })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => toast({ title: "Profile saved", description: "Your changes have been updated." }),
    onError: (e: any) => toast({ title: "Save failed", description: String(e.message ?? e), variant: "destructive" }),
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar items={userNavItems} />

      <main className="flex-1 p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Profile</h1>
            <p className="text-muted-foreground">Manage your personal information</p>
          </div>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Personal Info</CardTitle>
              <CardDescription>Update your name and contact details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={form.name} onChange={onChange} placeholder="Jane Doe" disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={onChange} placeholder="your.email@example.com" disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={form.phone} onChange={onChange} placeholder="+1234567890" disabled={isLoading} />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Button onClick={() => save(form)} className="bg-primary hover:bg-primary/90" disabled={saving || isLoading}>
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button variant="outline" onClick={() => setForm({ name: data?.name ?? "", email: data?.email ?? user?.email ?? "", phone: data?.phone ?? "" })} disabled={saving || isLoading}>
                    Reset
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;
