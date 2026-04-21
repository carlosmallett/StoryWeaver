import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { BookOpen, Users, BarChart3, GraduationCap, LogOut, ShoppingCart, Sparkles, Brain, Search } from "lucide-react";
import { clearCurrentUser, getStoredAccounts, LocalAccount } from "../utils/localAuth";

interface StudentProfile {
  interests?: string[];
  interestIds?: string[];
  lexileLevel?: string;
  grade?: number;
}

interface HistoryEntry {
  id?: string;
  title?: string;
  story?: string;
  storyExcerpt?: string;
  summary?: string;
  topicId?: string;
  genre?: string;
  dateRead?: string;
  accuracy?: number;
  lexileLevel?: string;
  wordsRead?: number;
  questionsAnswered?: number;
  questionsCorrect?: number;
  timestamp?: string;
}

interface StudentStat {
  id: string;
  name: string;
  email: string;
  classes: string[];
  interests: string[];
  lexileLevel: string;
  wordsRead: number;
  questionsAnswered: number;
  questionsCorrect: number;
  accuracy: number;
  storiesCompleted: number;
  history: HistoryEntry[];
}

interface RecommendationOption {
  label: string;
  topicId?: string;
  amazonQuery?: string;
  reason: string;
}

interface SavedRecommendation {
  storyweaverSuggestion: string;
  amazonSuggestion: string;
  teacherNote: string;
  assignedAt: string;
}

const INTEREST_TO_PROGRAM_BOOKS: Record<string, RecommendationOption[]> = {
  adventure: [
    { label: "Lost Treasure Adventure", topicId: "lost-treasure", reason: "Builds sequencing and prediction in exciting quest stories." },
    { label: "The Time Travelers", topicId: "time-travelers", reason: "Great for cause/effect and timeline thinking." },
  ],
  animals: [
    { label: "Animal Habitats", topicId: "animal-habitats", reason: "Strengthens nonfiction comprehension with high-interest animal topics." },
    { label: "Underwater Adventure", topicId: "underwater-adventure", reason: "Supports domain vocabulary with vivid context." },
  ],
  science: [
    { label: "Solar System", topicId: "space-science", reason: "Supports informational reading and concept vocabulary." },
    { label: "How Weather Works", topicId: "weather-science", reason: "Builds evidence-based reasoning from text." },
  ],
  sports: [
    { label: "Super Bowl 2026", topicId: "super-bowl-2026", reason: "High engagement option for stamina and inference practice." },
    { label: "Sports Champions", topicId: "sports-champions", reason: "Great for motivation and quick wins in fluency." },
  ],
  history: [
    { label: "Ancient Egypt", topicId: "ancient-egypt", reason: "Improves background knowledge and informational comprehension." },
    { label: "Dinosaur Discovery", topicId: "dinosaur-discovery", reason: "Strong bridge from curiosity to academic vocabulary." },
  ],
};

const INTEREST_TO_PHYSICAL_BOOKS: Record<string, RecommendationOption[]> = {
  adventure: [
    { label: "Hatchet by Gary Paulsen", amazonQuery: "Hatchet Gary Paulsen used", reason: "Excellent for resilience and problem-solving discussion." },
    { label: "Holes by Louis Sachar", amazonQuery: "Holes Louis Sachar used", reason: "Boosts inference with a mystery-adventure structure." },
  ],
  animals: [
    { label: "The One and Only Ivan by Katherine Applegate", amazonQuery: "The One and Only Ivan used", reason: "Builds empathy and character analysis." },
    { label: "Because of Winn-Dixie by Kate DiCamillo", amazonQuery: "Because of Winn-Dixie used", reason: "Supports relationship and emotion vocabulary." },
  ],
  science: [
    { label: "National Geographic Kids: Space Encyclopedia", amazonQuery: "National Geographic Kids Space Encyclopedia used", reason: "Excellent for nonfiction stamina and technical vocabulary." },
    { label: "Ada Twist, Scientist", amazonQuery: "Ada Twist Scientist used", reason: "Encourages questioning and scientific language." },
  ],
  sports: [
    { label: "Who Is Tom Brady?", amazonQuery: "Who Is Tom Brady used", reason: "Accessible sports biography with strong engagement." },
    { label: "The Crossover by Kwame Alexander", amazonQuery: "The Crossover Kwame Alexander used", reason: "Motivates reluctant readers through sports storytelling." },
  ],
  history: [
    { label: "Magic Tree House: Mummies in the Morning", amazonQuery: "Mummies in the Morning used", reason: "A kid-friendly path into historical topics." },
    { label: "Who Was King Tut?", amazonQuery: "Who Was King Tut used", reason: "Strong nonfiction support for history curiosity." },
  ],
};

const DEFAULT_PROGRAM_RECOMMENDATIONS: RecommendationOption[] = [
  { label: "Robot Friends", topicId: "robot-friends", reason: "Great all-around pick for comprehension and engagement." },
  { label: "Mission to Mars", topicId: "mission-to-mars", reason: "Supports sequencing and detail tracking." },
];

const DEFAULT_PHYSICAL_RECOMMENDATIONS: RecommendationOption[] = [
  { label: "Charlotte's Web by E.B. White", amazonQuery: "Charlotte's Web used", reason: "Classic discussion-friendly read for home." },
  { label: "Wonder by R.J. Palacio", amazonQuery: "Wonder RJ Palacio used", reason: "Excellent for empathy and family discussion." },
];

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function accuracyFrom(correct: number, answered: number): number {
  if (!answered) return 0;
  return Math.round((correct / answered) * 100);
}

function getAmazonLink(query: string): string {
  return `https://www.amazon.com/s?k=${encodeURIComponent(query)}&i=stripbooks`;
}

function inferGenre(entry: HistoryEntry): string {
  if (entry.genre && entry.genre.trim()) return entry.genre;

  const source = `${entry.topicId || ""} ${entry.title || ""}`.toLowerCase();

  if (source.includes("egypt") || source.includes("history") || source.includes("dinosaur")) return "History / Nonfiction";
  if (source.includes("super bowl") || source.includes("sports")) return "Sports";
  if (source.includes("mars") || source.includes("space") || source.includes("weather")) return "Science";
  if (source.includes("animal") || source.includes("habitat") || source.includes("underwater")) return "Nature";
  if (source.includes("treasure") || source.includes("time traveler") || source.includes("adventure")) return "Adventure";
  return "General Fiction";
}

function inferSummary(entry: HistoryEntry): string {
  if (entry.summary && entry.summary.trim()) return entry.summary;

  const sourceText = entry.storyExcerpt || entry.story || "";
  if (!sourceText.trim()) return "No summary available yet.";

  const cleaned = sourceText.replace(/\s+/g, " ").trim();
  if (cleaned.length <= 140) return cleaned;
  return `${cleaned.slice(0, 140)}...`;
}

function normalizeHistoryForStudent(studentId: string): HistoryEntry[] {
  const history = parseJson<HistoryEntry[]>(localStorage.getItem(`readingHistory-${studentId}`), []);
  const currentReading = parseJson<HistoryEntry | null>(localStorage.getItem(`currentReading-${studentId}`), null);

  if (!currentReading) {
    return history;
  }

  const currentTimestamp = currentReading.timestamp || new Date().toISOString();
  const currentTitle = currentReading.title || 'Reading Session';
  const currentStory = currentReading.story || '';
  const questionsAnswered = Number(currentReading.questionsAnswered || 0);
  const questionsCorrect = Number(currentReading.questionsCorrect || 0);
  const wordsRead = Number(currentReading.wordsRead || (currentStory ? currentStory.split(/\s+/).length : 0));
  const lexileLevel = currentReading.lexileLevel || '400-600';

  const normalizedCurrent: HistoryEntry = {
    id: `current-${studentId}`,
    title: currentTitle,
    story: currentStory,
    storyExcerpt: currentStory ? `${currentStory.slice(0, 220)}${currentStory.length > 220 ? '...' : ''}` : currentReading.storyExcerpt,
    summary: currentReading.summary || inferSummary({ ...currentReading, story: currentStory }),
    topicId: currentReading.topicId,
    genre: currentReading.genre,
    dateRead: new Date(currentTimestamp).toLocaleDateString(),
    accuracy: questionsAnswered > 0 ? Math.round((questionsCorrect / questionsAnswered) * 100) : Number(currentReading.accuracy || 0),
    lexileLevel,
    wordsRead,
    questionsAnswered,
    questionsCorrect,
    timestamp: currentTimestamp,
  };

  const hasCurrent = history.some((entry) => entry.title === normalizedCurrent.title && entry.dateRead === normalizedCurrent.dateRead);
  return hasCurrent ? history : [normalizedCurrent, ...history];
}

function collectStudentStats(students: LocalAccount[]): StudentStat[] {
  return students.map((student) => {
    const profile = parseJson<StudentProfile>(localStorage.getItem(`userProfile-${student.id}`), {});
    const history = normalizeHistoryForStudent(student.id);
    if (history.length > 0) {
      localStorage.setItem(`readingHistory-${student.id}`, JSON.stringify(history));
    }
    const classEntries = parseJson<Array<{ code?: string }>>(
      localStorage.getItem(`bookclub-classes-${student.id}`),
      [],
    );

    const normalizedHistory = [...history].sort(
      (a, b) => new Date(b.timestamp || b.dateRead || 0).getTime() - new Date(a.timestamp || a.dateRead || 0).getTime(),
    );

    const wordsRead = normalizedHistory.reduce((sum, entry) => sum + (entry.wordsRead || 0), 0);
    const questionsAnswered = normalizedHistory.reduce((sum, entry) => sum + (entry.questionsAnswered || 0), 0);
    const questionsCorrect = normalizedHistory.reduce((sum, entry) => sum + (entry.questionsCorrect || 0), 0);

    return {
      id: student.id,
      name: student.name,
      email: student.email,
      classes: classEntries.map((entry) => entry.code).filter(Boolean) as string[],
      interests: profile.interests || [],
      lexileLevel: profile.lexileLevel || "400-600",
      wordsRead,
      questionsAnswered,
      questionsCorrect,
      accuracy: accuracyFrom(questionsCorrect, questionsAnswered),
      storiesCompleted: normalizedHistory.length,
      history: normalizedHistory,
    };
  });
}

function buildRecommendations(student: StudentStat): {
  storyweaver: RecommendationOption[];
  physical: RecommendationOption[];
} {
  const interestMatches = student.interests
    .map((interest) => interest.toLowerCase())
    .flatMap((interest) => {
      if (interest.includes("sport")) return ["sports"];
      if (interest.includes("science") || interest.includes("space") || interest.includes("tech")) return ["science"];
      if (interest.includes("animal") || interest.includes("nature") || interest.includes("wildlife")) return ["animals"];
      if (interest.includes("history") || interest.includes("ancient") || interest.includes("culture")) return ["history"];
      if (interest.includes("adventure") || interest.includes("quest") || interest.includes("explore")) return ["adventure"];
      return [];
    });

  const uniqueInterests = Array.from(new Set(interestMatches));

  const storyweaverPool = uniqueInterests.length > 0
    ? uniqueInterests.flatMap((key) => INTEREST_TO_PROGRAM_BOOKS[key] || [])
    : DEFAULT_PROGRAM_RECOMMENDATIONS;

  const physicalPool = uniqueInterests.length > 0
    ? uniqueInterests.flatMap((key) => INTEREST_TO_PHYSICAL_BOOKS[key] || [])
    : DEFAULT_PHYSICAL_RECOMMENDATIONS;

  const supportMode = student.accuracy < 60;

  const storyweaver = supportMode
    ? [...storyweaverPool].reverse().slice(0, 3)
    : storyweaverPool.slice(0, 3);

  const physical = supportMode
    ? [...physicalPool].reverse().slice(0, 3)
    : physicalPool.slice(0, 3);

  return {
    storyweaver: storyweaver.length > 0 ? storyweaver : DEFAULT_PROGRAM_RECOMMENDATIONS,
    physical: physical.length > 0 ? physical : DEFAULT_PHYSICAL_RECOMMENDATIONS,
  };
}

export function TeacherDashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentStat[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedProgramSuggestion, setSelectedProgramSuggestion] = useState<string>("");
  const [selectedPhysicalSuggestion, setSelectedPhysicalSuggestion] = useState<string>("");
  const [programSearchTerm, setProgramSearchTerm] = useState("");
  const [physicalSearchTerm, setPhysicalSearchTerm] = useState("");
  const [teacherNote, setTeacherNote] = useState("");
  const [activeHistoryItemId, setActiveHistoryItemId] = useState<string | null>(null);
  const [showProgramSuggestions, setShowProgramSuggestions] = useState(false);
  const [showPhysicalSuggestions, setShowPhysicalSuggestions] = useState(false);
  const [savedRecommendations, setSavedRecommendations] = useState<Record<string, SavedRecommendation>>({});

  useEffect(() => {
    const allAccounts = getStoredAccounts();
    const studentAccounts = allAccounts.filter((account) => account.role === "student");

    const computedStats = collectStudentStats(studentAccounts);
    setStudents(computedStats);

    if (computedStats.length > 0) {
      setSelectedStudentId(computedStats[0].id);
    }

    const saved = parseJson<Record<string, SavedRecommendation>>(localStorage.getItem("teacher-recommendations"), {});
    setSavedRecommendations(saved);
  }, []);

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === selectedStudentId) || null,
    [students, selectedStudentId],
  );

  const recommendationSet = useMemo(
    () => (selectedStudent ? buildRecommendations(selectedStudent) : { storyweaver: [], physical: [] }),
    [selectedStudent],
  );

  useEffect(() => {
    if (!selectedStudent) return;
    const nextProgram = recommendationSet.storyweaver[0]?.label || "";
    const nextPhysical = recommendationSet.physical[0]?.label || "";
    setSelectedProgramSuggestion(nextProgram);
    setSelectedPhysicalSuggestion(nextPhysical);
    setProgramSearchTerm(nextProgram);
    setPhysicalSearchTerm(nextPhysical);
    setActiveHistoryItemId(selectedStudent.history[0]?.id || selectedStudent.history[0]?.timestamp || null);
    setShowProgramSuggestions(false);
    setShowPhysicalSuggestions(false);
    setTeacherNote("");
  }, [selectedStudent, recommendationSet]);

  const filteredProgramOptions = useMemo(() => {
    const term = programSearchTerm.trim().toLowerCase();
    if (!term) return recommendationSet.storyweaver;
    return recommendationSet.storyweaver.filter((option) => option.label.toLowerCase().includes(term));
  }, [programSearchTerm, recommendationSet]);

  const filteredPhysicalOptions = useMemo(() => {
    const term = physicalSearchTerm.trim().toLowerCase();
    if (!term) return recommendationSet.physical;
    return recommendationSet.physical.filter((option) => option.label.toLowerCase().includes(term));
  }, [physicalSearchTerm, recommendationSet]);

  const activeHistoryItem = useMemo(() => {
    if (!selectedStudent || selectedStudent.history.length === 0) return null;
    return (
      selectedStudent.history.find(
        (item) => (item.id || item.timestamp || "") === activeHistoryItemId,
      ) || selectedStudent.history[0]
    );
  }, [activeHistoryItemId, selectedStudent]);

  const classSummary = useMemo(() => {
    const classMap = new Map<string, { students: number; totalAccuracy: number; totalWords: number }>();

    for (const student of students) {
      if (student.classes.length === 0) {
        const existing = classMap.get("UNASSIGNED") || { students: 0, totalAccuracy: 0, totalWords: 0 };
        classMap.set("UNASSIGNED", {
          students: existing.students + 1,
          totalAccuracy: existing.totalAccuracy + student.accuracy,
          totalWords: existing.totalWords + student.wordsRead,
        });
        continue;
      }

      for (const classCode of student.classes) {
        const existing = classMap.get(classCode) || { students: 0, totalAccuracy: 0, totalWords: 0 };
        classMap.set(classCode, {
          students: existing.students + 1,
          totalAccuracy: existing.totalAccuracy + student.accuracy,
          totalWords: existing.totalWords + student.wordsRead,
        });
      }
    }

    return Array.from(classMap.entries()).map(([code, values]) => ({
      code,
      students: values.students,
      avgAccuracy: values.students > 0 ? Math.round(values.totalAccuracy / values.students) : 0,
      avgWords: values.students > 0 ? Math.round(values.totalWords / values.students) : 0,
    }));
  }, [students]);

  const overallStats = useMemo(() => {
    const totalStudents = students.length;
    const totalWords = students.reduce((sum, student) => sum + student.wordsRead, 0);
    const totalQuestions = students.reduce((sum, student) => sum + student.questionsAnswered, 0);
    const totalCorrect = students.reduce((sum, student) => sum + student.questionsCorrect, 0);

    return {
      totalStudents,
      totalWords,
      avgAccuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
      totalStories: students.reduce((sum, student) => sum + student.storiesCompleted, 0),
    };
  }, [students]);

  const saveRecommendation = () => {
    if (!selectedStudent) return;

    const payload: SavedRecommendation = {
      storyweaverSuggestion: selectedProgramSuggestion,
      amazonSuggestion: selectedPhysicalSuggestion,
      teacherNote,
      assignedAt: new Date().toISOString(),
    };

    const updated = {
      ...savedRecommendations,
      [selectedStudent.id]: payload,
    };

    setSavedRecommendations(updated);
    localStorage.setItem("teacher-recommendations", JSON.stringify(updated));
  };

  const physicalLookup = recommendationSet.physical.find((option) => option.label === selectedPhysicalSuggestion);
  const selectedProgramReason = recommendationSet.storyweaver.find((item) => item.label === selectedProgramSuggestion)?.reason;
  const selectedPhysicalReason = recommendationSet.physical.find((item) => item.label === selectedPhysicalSuggestion)?.reason;
  const amazonQuery = (physicalLookup?.amazonQuery || selectedPhysicalSuggestion || "").trim();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.14),_transparent_30%),linear-gradient(180deg,_#f0fdfa_0%,_#f8fafc_100%)]">
      <div className="mx-auto max-w-[1700px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-emerald-600 font-semibold">StoryWeaver</p>
              <h1 className="text-3xl font-black text-slate-900">Teacher Portal</h1>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="rounded-full" onClick={() => navigate("/library")}>Library</Button>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => {
                clearCurrentUser();
                navigate("/login");
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-2 shadow-sm">
            <CardContent className="pt-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Students</p>
              <p className="text-4xl font-black text-slate-900 mt-1">{overallStats.totalStudents}</p>
            </CardContent>
          </Card>
          <Card className="border-2 shadow-sm">
            <CardContent className="pt-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Stories Completed</p>
              <p className="text-4xl font-black text-slate-900 mt-1">{overallStats.totalStories}</p>
            </CardContent>
          </Card>
          <Card className="border-2 shadow-sm">
            <CardContent className="pt-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Class Words Read</p>
              <p className="text-4xl font-black text-slate-900 mt-1">{overallStats.totalWords.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="border-2 shadow-sm">
            <CardContent className="pt-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Average Accuracy</p>
              <p className="text-4xl font-black text-slate-900 mt-1">{overallStats.avgAccuracy}%</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-2 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-600" />
              Class Statistics
            </CardTitle>
            <CardDescription>Performance summary across classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {classSummary.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                  No class statistics yet.
                </div>
              ) : (
                classSummary.map((classItem) => (
                  <div key={classItem.code} className="rounded-xl border border-slate-200 p-4 bg-white">
                    <p className="text-sm text-slate-500">Class</p>
                    <p className="text-2xl font-black text-slate-900">{classItem.code === "UNASSIGNED" ? "Unassigned" : classItem.code}</p>
                    <div className="mt-2 text-sm text-slate-600 space-y-1">
                      <p>{classItem.students} student{classItem.students === 1 ? "" : "s"}</p>
                      <p>{classItem.avgAccuracy}% avg accuracy</p>
                      <p>{classItem.avgWords.toLocaleString()} avg words read</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-cyan-600" />
              Individual Student View
            </CardTitle>
            <CardDescription>Select a student to view statistics, interests, and assign recommendations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="student-select">Choose Student</Label>
              <select
                id="student-select"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
              >
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedStudent ? (
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-12 2xl:grid-cols-15">
                <div className="xl:col-span-5 2xl:col-span-4 space-y-4">
                  <Card className="border border-slate-200 shadow-sm">
                    <CardContent className="pt-5 space-y-3">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Student</p>
                        <p className="text-2xl font-black text-slate-900">{selectedStudent.name}</p>
                        <p className="text-sm text-slate-500">{selectedStudent.email}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-cyan-100 bg-cyan-50 p-3">
                          <p className="text-xs text-cyan-700 uppercase tracking-wider">Lexile</p>
                          <p className="text-lg font-bold text-slate-900">{selectedStudent.lexileLevel}L</p>
                        </div>
                        <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                          <p className="text-xs text-emerald-700 uppercase tracking-wider">Accuracy</p>
                          <p className="text-lg font-bold text-slate-900">{selectedStudent.accuracy}%</p>
                        </div>
                        <div className="rounded-lg border border-violet-100 bg-violet-50 p-3">
                          <p className="text-xs text-violet-700 uppercase tracking-wider">Words</p>
                          <p className="text-lg font-bold text-slate-900">{selectedStudent.wordsRead.toLocaleString()}</p>
                        </div>
                        <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                          <p className="text-xs text-amber-700 uppercase tracking-wider">Stories</p>
                          <p className="text-lg font-bold text-slate-900">{selectedStudent.storiesCompleted}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Student Interests (Teacher Alert)</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedStudent.interests.length > 0 ? (
                            selectedStudent.interests.map((interest) => (
                              <Badge key={interest} variant="outline" className="bg-white text-slate-700">
                                {interest}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-slate-500">No interests captured yet.</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="xl:col-span-7 2xl:col-span-11 grid grid-cols-1 2xl:grid-cols-2 gap-4 items-start">
                  <Card className="border border-slate-200 shadow-sm h-full">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                        Student Reading Explorer
                      </CardTitle>
                      <CardDescription>Scroll or click through books and passages this student has completed</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedStudent.history.length > 0 ? (
                        <>
                          <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                            {selectedStudent.history.map((item, index) => {
                              const itemId = item.id || item.timestamp || `${item.title || "story"}-${index}`;
                              const answered = item.questionsAnswered || 0;
                              const correct = item.questionsCorrect || 0;
                              const itemAccuracy = item.accuracy ?? accuracyFrom(correct, answered);
                              const displayDate = item.timestamp
                                ? new Date(item.timestamp).toLocaleString()
                                : item.dateRead || "Unknown date";
                              const genre = inferGenre(item);
                              const shortSummary = inferSummary(item);

                              return (
                                <button
                                  key={itemId}
                                  type="button"
                                  onClick={() => setActiveHistoryItemId(itemId)}
                                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                                    activeHistoryItemId === itemId
                                      ? "border-blue-400 bg-blue-50"
                                      : "border-slate-200 bg-white hover:bg-slate-50"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <p className="font-semibold text-slate-900">{item.title || "Untitled Story"}</p>
                                      <p className="text-xs text-slate-500 mt-1">{displayDate}</p>
                                      <div className="mt-1.5 flex items-center gap-2">
                                        <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                                          {genre}
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                                        {shortSummary}
                                      </p>
                                    </div>
                                    <Badge variant="outline">{itemAccuracy}%</Badge>
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          {activeHistoryItem ? (
                            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <p className="font-bold text-slate-900">{activeHistoryItem.title || "Story Passage"}</p>
                                {activeHistoryItem.lexileLevel ? (
                                  <Badge className="bg-violet-600 text-white">{activeHistoryItem.lexileLevel}</Badge>
                                ) : null}
                                <Badge variant="outline" className="bg-white">
                                  {inferGenre(activeHistoryItem)}
                                </Badge>
                              </div>
                              <p className="text-xs text-blue-800 mb-2 italic">
                                {inferSummary(activeHistoryItem)}
                              </p>
                              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                {activeHistoryItem.storyExcerpt || activeHistoryItem.story || "No saved passage text available yet."}
                              </p>
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                          This student does not have saved reading history yet.
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <Card className="border border-slate-200 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-violet-600" />
                          Assign Personalized Recommendations
                        </CardTitle>
                        <CardDescription>Set StoryWeaver and physical book suggestions for this student</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="program-suggestion">StoryWeaver Program Recommendation (Search or Type)</Label>
                          <div className="relative">
                            <Input
                              id="program-suggestion"
                              placeholder="Search StoryWeaver recommendation or type your own"
                              value={programSearchTerm}
                              onFocus={() => setShowProgramSuggestions(true)}
                              onBlur={() => setTimeout(() => setShowProgramSuggestions(false), 120)}
                              onChange={(e) => {
                                setProgramSearchTerm(e.target.value);
                                setSelectedProgramSuggestion(e.target.value);
                                setShowProgramSuggestions(true);
                              }}
                            />
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            {showProgramSuggestions && programSearchTerm.trim().length > 0 ? (
                              <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
                                {filteredProgramOptions.length > 0 ? (
                                  filteredProgramOptions.map((option) => (
                                    <button
                                      key={option.label}
                                      type="button"
                                      className="w-full px-3 py-2 text-left hover:bg-violet-50 border-b border-slate-100 last:border-b-0"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        setSelectedProgramSuggestion(option.label);
                                        setProgramSearchTerm(option.label);
                                        setShowProgramSuggestions(false);
                                      }}
                                    >
                                      <p className="text-sm font-medium text-slate-800">{option.label}</p>
                                      <p className="text-xs text-slate-500">{option.reason}</p>
                                    </button>
                                  ))
                                ) : (
                                  <div className="px-3 py-2 text-sm text-slate-500">
                                    No preset matches. Use this as a custom StoryWeaver recommendation.
                                  </div>
                                )}
                              </div>
                            ) : null}
                          </div>
                          <p className="text-xs text-slate-500 inline-flex items-center gap-1">
                            <BookOpen className="h-3.5 w-3.5" />
                            {selectedProgramReason || "Custom suggestion entered by teacher."}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="physical-suggestion">Physical Book Recommendation (Search Title)</Label>
                          <div className="relative">
                            <Input
                              id="physical-suggestion"
                              placeholder="Type a book title (example: Wonder by R.J. Palacio)"
                              value={physicalSearchTerm}
                              onFocus={() => setShowPhysicalSuggestions(true)}
                              onBlur={() => setTimeout(() => setShowPhysicalSuggestions(false), 120)}
                              onChange={(e) => {
                                setPhysicalSearchTerm(e.target.value);
                                setSelectedPhysicalSuggestion(e.target.value);
                                setShowPhysicalSuggestions(true);
                              }}
                            />
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            {showPhysicalSuggestions && physicalSearchTerm.trim().length > 0 ? (
                              <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
                                <div className="px-3 py-2 text-xs text-cyan-700 bg-cyan-50 border-b border-slate-100">
                                  Amazon query: {physicalSearchTerm}
                                </div>
                                {filteredPhysicalOptions.length > 0 ? (
                                  filteredPhysicalOptions.map((option) => (
                                    <button
                                      key={option.label}
                                      type="button"
                                      className="w-full px-3 py-2 text-left hover:bg-cyan-50 border-b border-slate-100 last:border-b-0"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        setSelectedPhysicalSuggestion(option.label);
                                        setPhysicalSearchTerm(option.label);
                                        setShowPhysicalSuggestions(false);
                                      }}
                                    >
                                      <p className="text-sm font-medium text-slate-800">{option.label}</p>
                                      <p className="text-xs text-slate-500">{option.reason}</p>
                                    </button>
                                  ))
                                ) : (
                                  <div className="px-3 py-2 text-sm text-slate-500">
                                    No preset matches. This title will be searched directly on Amazon.
                                  </div>
                                )}
                              </div>
                            ) : null}
                          </div>
                          <p className="text-xs text-slate-500 inline-flex items-center gap-1">
                            <Brain className="h-3.5 w-3.5" />
                            {selectedPhysicalReason || "Custom title entered. Amazon search will use this title."}
                          </p>
                        </div>

                        <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-3">
                          <p className="text-xs text-cyan-700 font-semibold uppercase tracking-wider">Live Search Query</p>
                          <p className="text-sm text-cyan-900 mt-1">{amazonQuery || "Type a book title to generate query"}</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="teacher-note">Teacher Note</Label>
                          <Input
                            id="teacher-note"
                            placeholder="Example: Focus on inference and citing clues from the text."
                            value={teacherNote}
                            onChange={(e) => setTeacherNote(e.target.value)}
                          />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button className="bg-gradient-to-r from-emerald-600 to-cyan-600" onClick={saveRecommendation}>
                            Save Recommendation
                          </Button>

                          {amazonQuery ? (
                            <Button
                              variant="outline"
                              onClick={() => window.open(getAmazonLink(amazonQuery), "_blank", "noopener,noreferrer")}
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Open Amazon Used Link
                            </Button>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>

                    {savedRecommendations[selectedStudent.id] ? (
                      <Card className="border border-emerald-200 bg-emerald-50 shadow-sm">
                        <CardContent className="pt-4 pb-4 space-y-1.5">
                          <p className="text-sm font-semibold text-emerald-900">Latest Saved Recommendation</p>
                          <p className="text-sm text-emerald-800">Program: {savedRecommendations[selectedStudent.id].storyweaverSuggestion}</p>
                          <p className="text-sm text-emerald-800">Physical Book: {savedRecommendations[selectedStudent.id].amazonSuggestion}</p>
                          {savedRecommendations[selectedStudent.id].teacherNote ? (
                            <p className="text-sm text-emerald-800">Note: {savedRecommendations[selectedStudent.id].teacherNote}</p>
                          ) : null}
                          <p className="text-xs text-emerald-700">Saved {new Date(savedRecommendations[selectedStudent.id].assignedAt).toLocaleString()}</p>
                        </CardContent>
                      </Card>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No students available yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
