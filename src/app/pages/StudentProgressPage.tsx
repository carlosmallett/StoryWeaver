import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { BookOpen, Brain, Trophy, ArrowLeft, Star, CalendarDays } from "lucide-react";

interface ReadingEntry {
  topicId?: string;
  title: string;
  wordsRead: number;
  lexileLevel?: string;
  questionsAnswered?: number;
  questionsCorrect?: number;
  timestamp?: string;
  studentRating?: number;
}

interface CommunityRatingEntry {
  topicId?: string;
  title: string;
  total: number;
  count: number;
  average: number;
  updatedAt: string;
}

const COMMUNITY_RATINGS_KEY = "storyweaver-community-ratings-v1";

function getHistoryStorageKey(userId: string | null): string {
  return userId ? `readingHistory-${userId}` : "readingHistory";
}

function getEntryKey(entry: ReadingEntry, index: number): string {
  return `${entry.topicId || entry.title}-${entry.timestamp || index}`;
}

function getBookKey(entry: ReadingEntry): string {
  return (entry.topicId || entry.title || "unknown-book").toLowerCase();
}

const DEMO_HISTORY: ReadingEntry[] = [
  {
    topicId: "robot-friends",
    title: "Robot Friends",
    wordsRead: 512,
    lexileLevel: "1000L",
    questionsAnswered: 4,
    questionsCorrect: 4,
    timestamp: "2026-03-25T10:30:00.000Z",
  },
  {
    topicId: "lost-treasure",
    title: "Lost Treasure I",
    wordsRead: 287,
    lexileLevel: "300L",
    questionsAnswered: 5,
    questionsCorrect: 3,
    timestamp: "2026-03-22T09:00:00.000Z",
  },
  {
    topicId: "ancient-egypt",
    title: "Ancient Egypt",
    wordsRead: 456,
    lexileLevel: "400L",
    questionsAnswered: 5,
    questionsCorrect: 4,
    timestamp: "2026-03-20T17:45:00.000Z",
  },
];

function getAccuracy(entry: ReadingEntry): number {
  if (!entry.questionsAnswered || entry.questionsAnswered === 0) return 0;
  return Math.round(((entry.questionsCorrect || 0) / entry.questionsAnswered) * 100);
}

function getReadingMood(accuracy: number): { label: string; color: string } {
  if (accuracy >= 85) return { label: "Reading Hero", color: "bg-emerald-500" };
  if (accuracy >= 65) return { label: "Strong Explorer", color: "bg-sky-500" };
  return { label: "Keep Growing", color: "bg-amber-500" };
}

export function StudentProgressPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<ReadingEntry[]>([]);
  const [visibleCount, setVisibleCount] = useState(6);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const currentUserRaw = localStorage.getItem("currentUser");
    const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;
    const studentHistoryKey = getHistoryStorageKey(currentUser?.id || null);
    setCurrentUserId(currentUser?.id || null);

    const stored = localStorage.getItem(studentHistoryKey) ?? localStorage.getItem("readingHistory");
    const parsedHistory: ReadingEntry[] = stored ? JSON.parse(stored) : [];

    if (parsedHistory.length > 0) {
      setHistory(parsedHistory);
      return;
    }

    const currentReading = localStorage.getItem("currentReading");
    if (currentReading) {
      const current = JSON.parse(currentReading);
      setHistory([current]);
      return;
    }

    setHistory(DEMO_HISTORY);
  }, []);

  const saveRating = (target: ReadingEntry, nextRating: number, fallbackIndex: number) => {
    const targetKey = getEntryKey(target, fallbackIndex);
    const previousRating = typeof target.studentRating === "number" ? target.studentRating : null;

    const updatedHistory = history.map((entry, index) => {
      if (getEntryKey(entry, index) !== targetKey) return entry;
      return {
        ...entry,
        studentRating: nextRating,
      };
    });

    setHistory(updatedHistory);

    const storageKey = getHistoryStorageKey(currentUserId);
    localStorage.setItem(storageKey, JSON.stringify(updatedHistory));
    localStorage.setItem("readingHistory", JSON.stringify(updatedHistory));

    const communityRatingsRaw = localStorage.getItem(COMMUNITY_RATINGS_KEY);
    const communityRatings: Record<string, CommunityRatingEntry> = communityRatingsRaw
      ? JSON.parse(communityRatingsRaw)
      : {};

    const bookKey = getBookKey(target);
    const existing = communityRatings[bookKey] || {
      topicId: target.topicId,
      title: target.title,
      total: 0,
      count: 0,
      average: 0,
      updatedAt: new Date().toISOString(),
    };

    const adjustedTotal = existing.total - (previousRating || 0) + nextRating;
    const adjustedCount = previousRating ? existing.count : existing.count + 1;

    communityRatings[bookKey] = {
      ...existing,
      topicId: target.topicId || existing.topicId,
      title: target.title || existing.title,
      total: adjustedTotal,
      count: adjustedCount,
      average: adjustedCount > 0 ? Number((adjustedTotal / adjustedCount).toFixed(2)) : 0,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(COMMUNITY_RATINGS_KEY, JSON.stringify(communityRatings));
  };

  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()),
    [history],
  );

  const totalStories = sortedHistory.length;
  const totalWords = sortedHistory.reduce((sum, entry) => sum + (entry.wordsRead || 0), 0);
  const totalQuestions = sortedHistory.reduce((sum, entry) => sum + (entry.questionsAnswered || 0), 0);
  const totalCorrect = sortedHistory.reduce((sum, entry) => sum + (entry.questionsCorrect || 0), 0);
  const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const mood = getReadingMood(overallAccuracy);
  const visibleHistory = sortedHistory.slice(0, visibleCount);
  const hasMoreHistory = visibleCount < sortedHistory.length;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(147,51,234,0.14),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.15),_transparent_30%),linear-gradient(180deg,_#fff9ff_0%,_#f8fbff_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Button variant="outline" className="rounded-full bg-white mb-5" onClick={() => navigate("/library")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Library
        </Button>

        <Card className="rounded-[28px] border border-violet-100 shadow-lg mb-6">
          <CardHeader className="bg-gradient-to-r from-violet-50 to-indigo-50">
            <CardTitle className="text-3xl font-black text-slate-900">My Reading Progress</CardTitle>
            <CardDescription className="text-base text-slate-600">
              Your story wins, word power, and reading journey all in one place.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-violet-100 bg-white p-4">
                <p className="text-xs uppercase tracking-wider text-violet-500 font-semibold">Stories Finished</p>
                <p className="text-4xl font-black text-slate-900 mt-1">{totalStories}</p>
              </div>
              <div className="rounded-2xl border border-sky-100 bg-white p-4">
                <p className="text-xs uppercase tracking-wider text-sky-500 font-semibold">Words Read</p>
                <p className="text-4xl font-black text-slate-900 mt-1">{totalWords.toLocaleString()}</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                <p className="text-xs uppercase tracking-wider text-emerald-500 font-semibold">Questions Answered</p>
                <p className="text-4xl font-black text-slate-900 mt-1">{totalQuestions}</p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-white p-4">
                <p className="text-xs uppercase tracking-wider text-amber-500 font-semibold">Accuracy</p>
                <p className="text-4xl font-black text-slate-900 mt-1">{overallAccuracy}%</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Badge className={`${mood.color} text-white text-sm px-3 py-1.5`}>{mood.label}</Badge>
              <Badge variant="outline" className="text-sm px-3 py-1.5">
                <Star className="h-3.5 w-3.5 mr-1" />
                Keep going, you are building a strong reading brain
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border border-slate-200 shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-black text-slate-900">Past Reading Adventures</CardTitle>
            <CardDescription className="text-slate-600">Simple snapshots of what you have read.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pb-6">
            {sortedHistory.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center">
                <BookOpen className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="text-slate-600">No stories yet. Start your first reading adventure!</p>
              </div>
            ) : (
              visibleHistory.map((entry, index) => {
                const accuracy = getAccuracy(entry);
                const exactDate = entry.timestamp
                  ? new Date(entry.timestamp).toLocaleString(undefined, {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : "Recently";
                return (
                  <div key={`${entry.topicId || entry.title}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xl font-black text-slate-900">{entry.title || "Story"}</p>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <BookOpen className="h-3.5 w-3.5" />
                            {entry.wordsRead || 0} words
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Brain className="h-3.5 w-3.5" />
                            {entry.questionsCorrect || 0}/{entry.questionsAnswered || 0} correct
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Trophy className="h-3.5 w-3.5" />
                            {accuracy}%
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        {entry.lexileLevel ? (
                          <Badge className="bg-violet-600 text-white">{entry.lexileLevel}</Badge>
                        ) : null}
                        <p className="mt-2 text-xs text-slate-500 inline-flex items-center gap-1 text-right justify-end">
                          <CalendarDays className="h-3 w-3" />
                          {exactDate}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Rate this story</p>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((value) => {
                          const active = (entry.studentRating || 0) >= value;
                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() => saveRating(entry, value, index)}
                              aria-label={`Rate ${entry.title} ${value} stars`}
                              className="rounded-md p-1 transition-transform hover:scale-105"
                            >
                              <Star className={`h-5 w-5 ${active ? "fill-amber-400 text-amber-500" : "text-slate-300"}`} />
                            </button>
                          );
                        })}
                        <span className="ml-2 text-xs text-slate-500">
                          {entry.studentRating ? `${entry.studentRating}/5` : "Tap to rate"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {hasMoreHistory ? (
              <div className="pt-2 text-center">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full px-6"
                  onClick={() => setVisibleCount((current) => current + 6)}
                >
                  See More Stories
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
