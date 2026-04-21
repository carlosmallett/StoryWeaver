import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { BookOpen, Sparkles, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { authenticateLocalAccount, ensureDemoAccounts, hydrateAccountsFromMcp, setCurrentUser } from "../utils/localAuth";

export function StudentLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    await hydrateAccountsFromMcp();
    ensureDemoAccounts();
    const result = authenticateLocalAccount(email, password, 'student');

    if (!result.success) {
      setLoading(false);
      setError(result.error);
      return;
    }

    setCurrentUser(result.account);
    setTimeout(() => {
      const hasProfile = Boolean(localStorage.getItem('userProfile'));
      navigate(hasProfile ? '/library' : '/quiz');
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100 px-4 py-6 md:py-10">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/login')}
          className="hover:bg-purple-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login Options
        </Button>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          <Card className="border-2 border-purple-200 bg-white/80 backdrop-blur-sm shadow-lg lg:col-span-5">
            <CardContent className="pt-8 pb-8">
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center gap-3 mb-4 lg:justify-start">
                  <BookOpen className="w-12 h-12 text-purple-600" />
                  <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    StoryWeaver
                  </h1>
                  <Sparkles className="w-12 h-12 text-pink-600" />
                </div>
                <p className="text-lg text-gray-700 font-semibold">Student Login</p>
                <p className="text-sm text-gray-600 mt-3">
                  Jump right into stories, quizzes, and your book club progress from a desktop-friendly layout.
                </p>
              </div>

              <div className="mt-6 rounded-xl border border-purple-200 bg-purple-50 p-4">
                <p className="text-sm text-purple-900 text-center lg:text-left">
                  <strong>📚 Local Student Login:</strong>
                </p>
                <p className="text-xs text-purple-800 text-center mt-2 lg:text-left">
                  Use your student account from setup, or demo:<br />
                  <strong>student@gmail.com / password123</strong>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg lg:col-span-7">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle>Welcome Back, Reader!</CardTitle>
              <CardDescription>Sign in with the student account created by your parent</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="student@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-lg bg-gradient-to-r from-purple-600 to-pink-600"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center lg:text-left">
                <p className="text-sm text-gray-600">
                  Don&apos;t have an account?{' '}
                  <Link 
                    to="/signup" 
                    className="font-semibold text-purple-600 hover:text-purple-700 underline"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
