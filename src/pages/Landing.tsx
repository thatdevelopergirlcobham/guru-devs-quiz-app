import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
// import { Trophy, Clock, Users } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-16 pb-24 flex-1">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          {/* Logo */}
          <div className="inline-block">
            <img 
              src="/gurudevs.png" 
              alt="Guru Devs Logo" 
              className="h-20 w-auto mx-auto mb-6"
            />
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            <span className="text-[#eb0000]">Guru Devs:</span>
            <br />
            <span className="text-[#052880]">Baby Devs Quiz Platform</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
            Test your skills, take quizzes tailored to your learning journey, and grow with feedback from your mentor.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Button
              size="lg"
              onClick={() => navigate("/signup")}
              className="bg-[#052880] hover:bg-[#052880]/90 text-white px-10 py-6 text-lg font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/login")}
              className="border-[#052880] text-[#052880] hover:bg-gray-50 hover:text-[#052880]  bg-gray-50 px-10 py-6 text-lg font-medium rounded-xl transition-all duration-300"
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      {/* <section className="container mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <FeatureCard
            icon={Trophy}
            title="Track Progress"
            description="See your improvement with detailed score history and performance insights."
          />
          <FeatureCard
            icon={Clock}
            title="Timed Challenges"
            description="Simulate real-world pressure with countdown timers on every quiz."
          />
          <FeatureCard
            icon={Users}
            title="Mentor-Curated"
            description="Quizzes designed by your facilitator to match your learning goals."
          />
        </div>
      </section> */}

      {/* Footer */}
      <footer className="bg-[#052880] text-white py-5 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            Developed  by{" "}
            <span className="font-bold">Guru Devs</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

// Feature Card Component
interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-gray-100 p-7 rounded-2xl border border-gray-200 hover:border-[#052880]/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group">
      <div className="h-14 w-14 rounded-xl bg-[#052880]/10 flex items-center justify-center mb-5 group-hover:bg-[#052880]/20 transition-colors">
        <Icon className="h-7 w-7 text-[#052880] group-hover:scale-110 transition-transform" />
      </div>
      <h3 className="text-xl font-bold text-[#052880] mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

export default Landing;