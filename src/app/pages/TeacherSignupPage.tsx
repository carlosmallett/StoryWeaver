import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle, GraduationCap, Loader2, Plus, Trash2, Users } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { createLocalAccount, ensureDemoAccounts, getStoredAccounts, hydrateAccountsFromMcp, setCurrentUser } from "../utils/localAuth";

interface StudentDraft {
  id: string;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const createStudentDraft = (): StudentDraft => ({
  id: `teacher-student-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
});

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function classCodeFromInput(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
}

export function TeacherSignupPage() {
  const navigate = useNavigate();

  const [teacherName, setTeacherName] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherPassword, setTeacherPassword] = useState("");
  const [teacherConfirmPassword, setTeacherConfirmPassword] = useState("");
  const [className, setClassName] = useState("");
  const [classCode, setClassCode] = useState("");
  const [students, setStudents] = useState<StudentDraft[]>([createStudentDraft()]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    teacherEmail: string;
    classCode: string;
    studentEmails: string[];
    teacherId: string;
  } | null>(null);

  const addStudent = () => setStudents((prev) => [...prev, createStudentDraft()]);

  const removeStudent = (id: string) => setStudents((prev) => prev.filter((student) => student.id !== id));

  const updateStudent = (id: string, field: keyof StudentDraft, value: string) => {
    setStudents((prev) => prev.map((student) => (student.id === id ? { ...student, [field]: value } : student)));
  };

  const validate = (): string | null => {
    if (!teacherName.trim()) return "Please enter the teacher name.";
    if (!teacherEmail.trim()) return "Please enter the teacher email.";
    if (teacherPassword.length < 6) return "Teacher password must be at least 6 characters.";
    if (teacherPassword !== teacherConfirmPassword) return "Teacher passwords do not match.";
    if (!className.trim()) return "Please enter a class name.";

    const normalizedClassCode = classCodeFromInput(classCode || className);
    if (!normalizedClassCode) return "Please enter a valid class code (letters or numbers).";

    if (students.length === 0) return "Please add at least one student account.";

    const seenEmails = new Set<string>([teacherEmail.trim().toLowerCase()]);

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const label = `student ${i + 1}`;

      if (!student.name.trim()) return `Please enter a name for ${label}.`;
      if (!student.email.trim()) return `Please enter an email for ${label}.`;
      if (student.password.length < 6) return `Password for ${label} must be at least 6 characters.`;
      if (student.password !== student.confirmPassword) return `Passwords do not match for ${label}.`;

      const normalized = student.email.trim().toLowerCase();
      if (seenEmails.has(normalized)) return `Duplicate email found for ${label}.`;
      seenEmails.add(normalized);
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
  await hydrateAccountsFromMcp();
    ensureDemoAccounts();

    const existingAccounts = getStoredAccounts();
    const normalizedTeacherEmail = teacherEmail.trim().toLowerCase();

    if (existingAccounts.some((account) => account.email.toLowerCase() === normalizedTeacherEmail)) {
      setLoading(false);
      setError("A teacher account with that email already exists.");
      return;
    }

    const duplicateStudent = students.find((student) =>
      existingAccounts.some((account) => account.email.toLowerCase() === student.email.trim().toLowerCase()),
    );

    if (duplicateStudent) {
      setLoading(false);
      setError(`A student account with email ${duplicateStudent.email} already exists.`);
      return;
    }

    const teacherResult = createLocalAccount({
      role: "teacher",
      name: teacherName,
      email: teacherEmail,
      password: teacherPassword,
    });

    if (!teacherResult.success) {
      setLoading(false);
      setError(teacherResult.error);
      return;
    }

    const finalClassCode = classCodeFromInput(classCode || className);
    const createdStudentEmails: string[] = [];
    const createdStudentIds: string[] = [];

    for (const student of students) {
      const studentResult = createLocalAccount({
        role: "student",
        name: student.name,
        email: student.email,
        password: student.password,
      });

      if (!studentResult.success) {
        setLoading(false);
        setError(studentResult.error);
        return;
      }

      createdStudentEmails.push(studentResult.account.email);
      createdStudentIds.push(studentResult.account.id);

      const classKey = `bookclub-classes-${studentResult.account.id}`;
      const existingClasses = parseJson<Array<Record<string, string>>>(localStorage.getItem(classKey), []);
      const nextClasses = [
        ...existingClasses,
        {
          code: finalClassCode,
          className: className.trim(),
          teacherName: teacherResult.account.name,
          joinedAt: new Date().toISOString(),
          emoji: "📘",
        },
      ];

      localStorage.setItem(classKey, JSON.stringify(nextClasses));

      const profileKey = `userProfile-${studentResult.account.id}`;
      if (!localStorage.getItem(profileKey)) {
        localStorage.setItem(
          profileKey,
          JSON.stringify({
            name: studentResult.account.name,
            grade: 3,
            homeLanguage: "English",
            storyLanguage: "English",
            interestIds: [],
            interests: [],
            lexileLevel: "400-600",
            createdAt: studentResult.account.createdAt,
          }),
        );
      }

      const historyKey = `readingHistory-${studentResult.account.id}`;
      if (!localStorage.getItem(historyKey)) {
        localStorage.setItem(historyKey, JSON.stringify([]));
      }
    }

    localStorage.setItem(
      `teacher-class-roster-${teacherResult.account.id}`,
      JSON.stringify({
        classCode: finalClassCode,
        className: className.trim(),
        studentIds: createdStudentIds,
      }),
    );

    setSuccess({
      teacherEmail: teacherResult.account.email,
      classCode: finalClassCode,
      studentEmails: createdStudentEmails,
      teacherId: teacherResult.account.id,
    });
    setLoading(false);
  };

  const continueAsTeacher = () => {
    if (!success) return;
    const accounts = getStoredAccounts();
    const teacher = accounts.find((account) => account.id === success.teacherId && account.role === "teacher");
    if (!teacher) {
      navigate("/login/teacher");
      return;
    }

    setCurrentUser(teacher);
    navigate("/teacher-dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-100 via-cyan-100 to-blue-100 px-4 py-8">
      <div className="mx-auto w-full max-w-7xl grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-4 border-2 border-emerald-200 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardContent className="pt-8">
            <div className="flex items-center justify-center lg:justify-start gap-3">
              <GraduationCap className="h-11 w-11 text-emerald-600" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                Teacher Setup
              </h1>
            </div>
            <p className="mt-4 text-sm text-gray-700">
              Create a teacher account and a full class roster of student logins in one flow.
            </p>
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
              This setup automatically links students to your class code for class-level tracking.
            </div>
            <div className="mt-3 text-sm text-gray-600">
              Already have a teacher account? <Link className="font-semibold text-emerald-700 underline" to="/login/teacher">Sign in</Link>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-8 border-2 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-cyan-50">
            <CardTitle>Create Teacher + Class Accounts</CardTitle>
            <CardDescription>Set up your class once, then students can immediately log in.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {success ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-900">
                  <p className="font-semibold flex items-center gap-2"><CheckCircle className="h-5 w-5" /> Class setup complete</p>
                  <p className="mt-2 text-sm">Teacher login: <strong>{success.teacherEmail}</strong></p>
                  <p className="text-sm">Class code: <strong>{success.classCode}</strong></p>
                  <div className="mt-2 text-sm">
                    {success.studentEmails.map((email, idx) => (
                      <p key={email}>Student {idx + 1}: <strong>{email}</strong></p>
                    ))}
                  </div>
                </div>
                <Button className="w-full h-11 bg-gradient-to-r from-emerald-600 to-cyan-600" onClick={continueAsTeacher}>
                  Continue to Teacher Dashboard
                </Button>
                <Button variant="outline" className="w-full h-11" onClick={() => navigate("/login/teacher")}>
                  Go to Teacher Login
                </Button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 mt-0.5" />
                    <p>{error}</p>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="teacherName">Teacher Name</Label>
                    <Input id="teacherName" value={teacherName} onChange={(e) => setTeacherName(e.target.value)} disabled={loading} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teacherEmail">Teacher Email</Label>
                    <Input id="teacherEmail" type="email" value={teacherEmail} onChange={(e) => setTeacherEmail(e.target.value)} disabled={loading} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teacherPassword">Teacher Password</Label>
                    <Input id="teacherPassword" type="password" minLength={6} value={teacherPassword} onChange={(e) => setTeacherPassword(e.target.value)} disabled={loading} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teacherConfirmPassword">Confirm Teacher Password</Label>
                    <Input id="teacherConfirmPassword" type="password" minLength={6} value={teacherConfirmPassword} onChange={(e) => setTeacherConfirmPassword(e.target.value)} disabled={loading} required />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="className">Class Name</Label>
                    <Input id="className" placeholder="Rivera Reading Crew" value={className} onChange={(e) => setClassName(e.target.value)} disabled={loading} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="classCode">Class Code</Label>
                    <Input
                      id="classCode"
                      placeholder="RIVERA2026"
                      value={classCode}
                      onChange={(e) => setClassCode(classCodeFromInput(e.target.value))}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <Users className="h-4 w-4" /> Student Accounts
                    </p>
                    <Button type="button" variant="outline" className="h-9" onClick={addStudent} disabled={loading}>
                      <Plus className="h-4 w-4 mr-1" /> Add Student
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {students.map((student, index) => (
                      <div key={student.id} className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-emerald-900">Student {index + 1}</p>
                          {students.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-8 px-2 text-gray-600 hover:text-red-600"
                              onClick={() => removeStudent(student.id)}
                              disabled={loading}
                            >
                              <Trash2 className="h-4 w-4 mr-1" /> Remove
                            </Button>
                          )}
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`student-name-${student.id}`}>Student Name</Label>
                            <Input
                              id={`student-name-${student.id}`}
                              value={student.name}
                              onChange={(e) => updateStudent(student.id, "name", e.target.value)}
                              disabled={loading}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`student-email-${student.id}`}>Student Email</Label>
                            <Input
                              id={`student-email-${student.id}`}
                              type="email"
                              value={student.email}
                              onChange={(e) => updateStudent(student.id, "email", e.target.value)}
                              disabled={loading}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`student-password-${student.id}`}>Student Password</Label>
                            <Input
                              id={`student-password-${student.id}`}
                              type="password"
                              minLength={6}
                              value={student.password}
                              onChange={(e) => updateStudent(student.id, "password", e.target.value)}
                              disabled={loading}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`student-confirm-${student.id}`}>Confirm Password</Label>
                            <Input
                              id={`student-confirm-${student.id}`}
                              type="password"
                              minLength={6}
                              value={student.confirmPassword}
                              onChange={(e) => updateStudent(student.id, "confirmPassword", e.target.value)}
                              disabled={loading}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 bg-gradient-to-r from-emerald-600 to-cyan-600" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Creating class accounts...
                    </>
                  ) : (
                    "Create Teacher + Class Accounts"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
