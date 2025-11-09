import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, RequireAdmin, RequireAuth } from "@/lib/auth";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminLogin from "./pages/admin/Login";
import AdminQuizzes from "./pages/admin/Quizzes";
import AdminUsers from "./pages/admin/Users";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminQuizDetail from "./pages/admin/QuizDetail";
import AdminQuizEdit from "./pages/admin/QuizEdit";
import AdminPerformance from "./pages/admin/Performance";
import UserDashboard from "./pages/user/Dashboard";
import Quizzes from "./pages/Quizzes";
import NotFound from "./pages/NotFound";
import QuizAttempt from "./pages/QuizAttempt";
import History from "./pages/History";
import Profile from "./pages/Profile";
import Logout from "./pages/Logout";

const queryClient = new QueryClient();

const App = () => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/logout" element={<Logout />} />

            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
            <Route path="/admin/quizzes" element={<RequireAdmin><AdminQuizzes /></RequireAdmin>} />
            <Route path="/admin/quizzes/:id" element={<RequireAdmin><AdminQuizDetail /></RequireAdmin>} />
            <Route path="/admin/quizzes/:id/edit" element={<RequireAdmin><AdminQuizEdit /></RequireAdmin>} />
            <Route path="/admin/users" element={<RequireAdmin><AdminUsers /></RequireAdmin>} />
            <Route path="/admin/analytics" element={<RequireAdmin><AdminAnalytics /></RequireAdmin>} />
            <Route path="/admin/performance" element={<RequireAdmin><AdminPerformance /></RequireAdmin>} />

            <Route path="/user/dashboard" element={<RequireAuth><UserDashboard /></RequireAuth>} />
            <Route path="/quizzes" element={<RequireAuth><Quizzes /></RequireAuth>} />
            <Route path="/quizzes/:id" element={<RequireAuth><QuizAttempt /></RequireAuth>} />
            <Route path="/history" element={<RequireAuth><History /></RequireAuth>} />
            <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </AuthProvider>
);

export default App;
