import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { BookOpen, Sparkles, AlertCircle, Loader2, CheckCircle, Plus, Trash2 } from "lucide-react";
import { createLocalAccount, ensureDemoAccounts, getStoredAccounts, hydrateAccountsFromMcp } from "../utils/localAuth";

interface StudentDraft {
  id: string;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const createEmptyStudentDraft = (): StudentDraft => ({
  id: `student-draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
});

export function SignupPage() {
  const navigate = useNavigate();
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPassword, setParentPassword] = useState("");
  const [parentConfirmPassword, setParentConfirmPassword] = useState("");
  const [students, setStudents] = useState<StudentDraft[]>([createEmptyStudentDraft()]);
  const [createdAccounts, setCreatedAccounts] = useState<{ parentEmail: string; studentEmails: string[] } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const addStudent = () => {
    setStudents(prev => [...prev, createEmptyStudentDraft()]);
  };

  const removeStudent = (id: string) => {
    setStudents(prev => prev.filter(student => student.id !== id));
  };

  const updateStudent = (id: string, field: keyof StudentDraft, value: string) => {
    setStudents(prev =>
      prev.map(student => (student.id === id ? { ...student, [field]: value } : student)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!parentName.trim()) {
      setError("Please enter the parent name");
      return;
    }

    if (!parentEmail.trim()) {
      setError("Please enter the parent email");
      return;
    }

    if (parentPassword !== parentConfirmPassword) {
      setError("Parent passwords don't match");
      return;
    }

    if (parentPassword.length < 6) {
      setError("Parent password must be at least 6 characters");
      return;
    }

    if (students.length === 0) {
      setError("Please add at least one child account");
      return;
    }

    const normalizedParentEmail = parentEmail.trim().toLowerCase();
    const seenEmails = new Set<string>([normalizedParentEmail]);

    for (let index = 0; index < students.length; index++) {
      const student = students[index];
      const studentNumber = index + 1;

      if (!student.name.trim()) {
        setError(`Please enter a name for child ${studentNumber}`);
        return;
      }

      if (!student.email.trim()) {
        setError(`Please enter an email for child ${studentNumber}`);
        return;
      }

      if (student.password !== student.confirmPassword) {
        setError(`Passwords don't match for child ${studentNumber}`);
        return;
      }

      if (student.password.length < 6) {
        setError(`Password must be at least 6 characters for child ${studentNumber}`);
        return;
      }

      const normalizedStudentEmail = student.email.trim().toLowerCase();
      if (seenEmails.has(normalizedStudentEmail)) {
        setError(`Duplicate email detected for child ${studentNumber}. Each account needs a unique email.`);
        return;
      }

      seenEmails.add(normalizedStudentEmail);
    }

    if (students.some(student => student.email.trim().toLowerCase() === normalizedParentEmail)) {
      setError("Parent and child accounts must use different emails");
      return;
    }

    setLoading(true);
    await hydrateAccountsFromMcp();
    ensureDemoAccounts();

    const existingAccounts = getStoredAccounts();
    const duplicateParent = existingAccounts.some(
      account => account.email.toLowerCase() === parentEmail.trim().toLowerCase(),
    );
    if (duplicateParent) {
      setLoading(false);
      setError("A parent account with that email already exists.");
      return;
    }

    const duplicateStudent = students.find(student =>
      existingAccounts.some(account => account.email.toLowerCase() === student.email.trim().toLowerCase()),
    );
    if (duplicateStudent) {
      setLoading(false);
      setError(`A student account with email ${duplicateStudent.email} already exists.`);
      return;
    }

    const parentResult = createLocalAccount({
      role: 'parent',
      name: parentName,
      email: parentEmail,
      password: parentPassword,
    });

    if (!parentResult.success) {
      setLoading(false);
      setError(parentResult.error);
      return;
    }

    const studentEmails: string[] = [];
    for (const student of students) {
      const studentResult = createLocalAccount({
        role: 'student',
        name: student.name,
        email: student.email,
        password: student.password,
        linkedParentId: parentResult.account.id,
      });

      if (!studentResult.success) {
        setLoading(false);
        setError(studentResult.error);
        return;
      }

      studentEmails.push(studentResult.account.email);
    }

    setCreatedAccounts({
      parentEmail: parentResult.account.email,
      studentEmails,
    });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100 px-4 py-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          <Card className="border-2 border-purple-200 bg-white/80 backdrop-blur-sm shadow-lg lg:col-span-4">
            <CardContent className="pt-8 pb-8">
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center gap-3 mb-4 lg:justify-start">
                  <BookOpen className="w-12 h-12 text-purple-600" />
                  <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    StoryWeaver
                  </h1>
                  <Sparkles className="w-12 h-12 text-pink-600" />
                </div>
                <p className="text-lg text-gray-700 font-semibold">Parent Setup</p>
                <p className="text-sm text-gray-600 mt-3">
                  Create parent and child accounts in one flow with enough space on desktop to review everything clearly.
                </p>
              </div>

              <Card className="mt-6 border border-green-200 bg-green-50 shadow-none">
                <CardContent className="pt-4 pb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <p className="text-sm text-green-800">Parent-led onboarding flow</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <p className="text-sm text-green-800">Student and parent accounts stored locally</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <p className="text-sm text-green-800">Safer handoff pattern for younger learners</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Signup Form */}
          <Card className="border-2 shadow-lg lg:col-span-8">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle>Create Parent + Child Accounts</CardTitle>
            <CardDescription>Parent starts setup, then hands the device to the student to sign in</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {createdAccounts ? (
              <div className="space-y-4">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">Accounts created locally on this device.</p>
                  <p className="text-sm text-green-700 mt-2">Parent: <strong>{createdAccounts.parentEmail}</strong></p>
                  {createdAccounts.studentEmails.map((email, index) => (
                    <p key={email} className="text-sm text-green-700">Child {index + 1}: <strong>{email}</strong></p>
                  ))}
                </div>

                <Button
                  type="button"
                  className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-cyan-600"
                  onClick={() => navigate('/login/parent')}
                >
                  Continue as Parent
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 text-lg"
                  onClick={() => navigate('/login/student')}
                >
                  Hand Off to Student Login
                </Button>
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="p-3 rounded-lg border border-blue-200 bg-blue-50">
                <p className="text-sm text-blue-900 font-medium">Step 1: Parent creates their account and one or more child accounts.</p>
                <p className="text-xs text-blue-800 mt-1">Step 2: Child signs in with any linked child account created below.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentName">Parent Name</Label>
                <Input
                  id="parentName"
                  type="text"
                  placeholder="Enter parent name"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentEmail">Parent Email</Label>
                <Input
                  id="parentEmail"
                  type="email"
                  placeholder="parent@example.com"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentPassword">Parent Password</Label>
                <Input
                  id="parentPassword"
                  type="password"
                  placeholder="At least 6 characters"
                  value={parentPassword}
                  onChange={(e) => setParentPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentConfirmPassword">Confirm Parent Password</Label>
                <Input
                  id="parentConfirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  value={parentConfirmPassword}
                  onChange={(e) => setParentConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-800">Child Accounts</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9"
                    onClick={addStudent}
                    disabled={loading}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Child
                  </Button>
                </div>

                {students.map((student, index) => (
                  <div key={student.id} className="p-3 rounded-lg border border-purple-200 bg-purple-50/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-purple-900">Child {index + 1}</p>
                      {students.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-8 px-2 text-gray-600 hover:text-red-600"
                          onClick={() => removeStudent(student.id)}
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`studentName-${student.id}`}>Child Name</Label>
                      <Input
                        id={`studentName-${student.id}`}
                        type="text"
                        placeholder="Enter child name"
                        value={student.name}
                        onChange={(e) => updateStudent(student.id, 'name', e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`studentEmail-${student.id}`}>Child Email</Label>
                      <Input
                        id={`studentEmail-${student.id}`}
                        type="email"
                        placeholder="child@example.com"
                        value={student.email}
                        onChange={(e) => updateStudent(student.id, 'email', e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor={`studentPassword-${student.id}`}>Child Password</Label>
                        <Input
                          id={`studentPassword-${student.id}`}
                          type="password"
                          placeholder="At least 6 characters"
                          value={student.password}
                          onChange={(e) => updateStudent(student.id, 'password', e.target.value)}
                          required
                          disabled={loading}
                          minLength={6}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`studentConfirmPassword-${student.id}`}>Confirm Child Password</Label>
                        <Input
                          id={`studentConfirmPassword-${student.id}`}
                          type="password"
                          placeholder="Re-enter password"
                          value={student.confirmPassword}
                          onChange={(e) => updateStudent(student.id, 'confirmPassword', e.target.value)}
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg bg-gradient-to-r from-purple-600 to-pink-600"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Accounts'
                )}
              </Button>
            </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link 
                  to="/login" 
                  className="font-semibold text-purple-600 hover:text-purple-700 underline"
                >
                  Sign in
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
