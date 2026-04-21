import { useNavigate } from "react-router";
import { BookOpen, Sparkles, BarChart3, User, LogOut } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { useEffect, useState } from "react";
import { clearCurrentUser } from "../utils/localAuth";

export function WelcomePage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);

      // Students bypass the welcome page entirely:
      // — returning students (have a profile) go straight to the library
      // — new students (no profile yet) go straight to onboarding
      if (user.role === 'student') {
        const hasProfile = Boolean(localStorage.getItem('userProfile'));
        navigate(hasProfile ? '/library' : '/quiz', { replace: true });
      }
    }
  }, [navigate]);

  const handleSignOut = () => {
    clearCurrentUser();
    localStorage.removeItem('selectedTopic');
    localStorage.removeItem('currentReading');
    navigate('/login');
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-6">
          <BookOpen className="w-16 h-16 text-purple-600" />
          <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            StoryWeaver
          </h1>
          <Sparkles className="w-16 h-16 text-pink-600" />
        </div>
        {currentUser && (
          <div className="mb-3">
            <p className="text-xl text-gray-700">Welcome, <strong>{currentUser.name || currentUser.email}</strong>! 👋</p>
          </div>
        )}
        <p className="text-2xl text-gray-700 mb-3">
          Your Adaptive Reading Adventure
        </p>
        <p className="text-lg text-gray-600">
          Stories that grow with you • Questions that help you learn • Progress you can see
        </p>
      </div>

      {/* Sign Out Button */}
      {currentUser && (
        <div className="flex justify-end mb-6">
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      )}

      {currentUser?.role === 'parent' && (
        <Card className="border-2 border-blue-200 bg-blue-50 mb-8">
          <CardContent className="pt-5 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <p className="text-blue-900 text-sm md:text-base">
              Setup is complete. Hand the device to your child and have them sign in with their student account.
            </p>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600" onClick={() => navigate('/login/student')}>
              Hand Off to Student
            </Button>
          </CardContent>
        </Card>
      )}

      <div className={`grid gap-6 mb-8 ${currentUser?.role === 'parent' ? 'md:grid-cols-2' : 'max-w-sm mx-auto'}`}>
        <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow cursor-pointer group"
              onClick={() => navigate('/quiz')}>
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <User className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Student Zone</h2>
              <p className="text-gray-600">
                Take a quick quiz, find stories you love, and start reading!
              </p>
              <Button className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                Start Reading
              </Button>
            </div>
          </CardContent>
        </Card>

        {currentUser?.role === 'parent' && (
          <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow cursor-pointer group"
                onClick={() => navigate('/parent-dashboard')}>
            <CardContent className="pt-8 pb-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Parent Dashboard</h2>
                <p className="text-gray-600">
                  View reading progress, metrics, and learning achievements
                </p>
                <Button className="mt-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                  View Progress
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="border-2 shadow-lg bg-white/80 backdrop-blur">
        <CardContent className="pt-6 pb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">How it Works</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-purple-600">1</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Take the Quiz</h4>
              <p className="text-sm text-gray-600">
                Answer fun questions to find your reading level and interests
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-pink-600">2</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Choose Stories</h4>
              <p className="text-sm text-gray-600">
                Pick from our library of fiction and non-fiction topics
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-yellow-600">3</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Read & Learn</h4>
              <p className="text-sm text-gray-600">
                Answer questions as you read and watch your skills grow
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {currentUser && (
        <div className="mt-8 text-center">
          <Button 
            variant="outline"
            onClick={() => navigate('/library')}
            className="text-gray-600"
          >
            Skip to Library →
          </Button>
        </div>
      )}
    </div>
  );
}