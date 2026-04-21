import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { GraduationCap, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { authenticateLocalAccount, ensureDemoAccounts, hydrateAccountsFromMcp, setCurrentUser } from "../utils/localAuth";

export function TeacherLoginPage() {
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
    const result = authenticateLocalAccount(email, password, "teacher");

    if (!result.success) {
      setLoading(false);
      setError(result.error);
      return;
    }

    setCurrentUser(result.account);
    setTimeout(() => {
      navigate("/teacher-dashboard");
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-100 via-cyan-100 to-blue-100 px-4 py-6 md:py-10">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/login")}
          className="hover:bg-emerald-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login Options
        </Button>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          <Card className="border-2 border-emerald-200 bg-white/80 backdrop-blur-sm shadow-lg lg:col-span-5">
            <CardContent className="pt-8 pb-8">
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center gap-3 mb-4 lg:justify-start">
                  <GraduationCap className="w-12 h-12 text-emerald-600" />
                  <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                    StoryWeaver
                  </h1>
                </div>
                <p className="text-lg text-gray-700 font-semibold">Teacher Login</p>
                <p className="text-sm text-gray-600 mt-3">
                  View class statistics, compare students, and assign personalized reading suggestions.
                </p>
              </div>

              <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm text-emerald-900">
                  <strong>Demo Teacher Login:</strong>
                </p>
                <p className="text-xs text-emerald-800 mt-2">
                  <strong>teacher@gmail.com / password123</strong>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg lg:col-span-7">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-cyan-50">
              <CardTitle>Welcome, Teacher!</CardTitle>
              <CardDescription>Sign in to access your class analytics and student recommendation tools</CardDescription>
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
                    placeholder="teacher@gmail.com"
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
                  className="w-full h-12 text-lg bg-gradient-to-r from-emerald-600 to-cyan-600"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In as Teacher"
                  )}
                </Button>

                <p className="text-center text-sm text-gray-600">
                  Need to create a class first?{" "}
                  <Link to="/signup/teacher" className="font-semibold text-emerald-700 underline hover:text-emerald-800">
                    Teacher setup
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
