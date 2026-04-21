import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  BookOpen,
  Users,
  Plus,
  X,
  Trophy,
  Clock,
  Copy,
  Check,
  School,
  Zap,
  Star,
  Sparkles,
  ShoppingCart,
  Heart,
  ArrowRight,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { getStoredAccounts } from "../utils/localAuth";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Friend {
  id: string;
  name: string;
  code: string;
  addedAt: string;
  minutesRead: number;
}

interface JoinedClass {
  code: string;
  teacherName: string;
  className: string;
  emoji: string;
  joinedAt: string;
  recommendedTopicIds: string[];
  challengeGoal?: number;
  challengeDeadline?: string;
  challengeName?: string;
}

interface ChallengeEntry {
  name: string;
  minutes: number;
  isMe: boolean;
}

interface RecommendedBook {
  id: string;
  title: string;
  author: string;
  lexile: string;
  teacherName: string;
  blurb: string;
  amazonQuery: string;
  coverClassName: string;
  crowdRating?: number;
  crowdVotes?: number;
  matchNote?: string;
}

interface StudentProfile {
  interests?: string[];
  lexileLevel?: string;
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

// ── Static seed data ───────────────────────────────────────────────────────────
const KNOWN_CLASSES: Record<string, Omit<JoinedClass, "joinedAt">> = {
  RIVERA2026: {
    code: "RIVERA2026",
    teacherName: "Ms. Rivera",
    className: "Rivera Reading Crew",
    emoji: "📘",
    recommendedTopicIds: ["ancient-egypt", "space-science", "sports-champions"],
    challengeGoal: 120,
    challengeDeadline: "May 15, 2026",
    challengeName: "Rivera Spring Reading Sprint",
  },
  WILSON2026: {
    code: "WILSON2026",
    teacherName: "Mrs. Wilson",
    className: "Room 4B Reading",
    emoji: "📚",
    recommendedTopicIds: ["ancient-egypt", "dinosaur-discovery", "time-travelers"],
    challengeGoal: 100,
    challengeDeadline: "April 30, 2026",
    challengeName: "Spring Reading Race 🏁",
  },
  SMITH7TH: {
    code: "SMITH7TH",
    teacherName: "Mr. Smith",
    className: "7th Grade Lit",
    emoji: "✍️",
    recommendedTopicIds: ["space-science", "underwater-adventure", "sports-champions"],
    challengeGoal: 120,
    challengeDeadline: "May 15, 2026",
    challengeName: "Galaxy Readers Sprint 🚀",
  },
  JONES3RD: {
    code: "JONES3RD",
    teacherName: "Ms. Jones",
    className: "3rd Grade Stars",
    emoji: "⭐",
    recommendedTopicIds: ["animal-habitats", "super-bowl-2026", "weather-science"],
    challengeGoal: 80,
    challengeDeadline: "May 1, 2026",
    challengeName: "Reading Rockstars 🎸",
  },
};

const TOPIC_INFO: Record<string, { title: string; image: string }> = {
  "super-bowl-2026": {
    title: "Super Bowl 2026",
    image: "https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=400&q=80",
  },
  "ancient-egypt": {
    title: "Ancient Egypt",
    image: "https://images.unsplash.com/photo-1539768942893-daf53e448371?auto=format&fit=crop&w=400&q=80",
  },
  "dinosaur-discovery": {
    title: "Discovering Dinosaurs",
    image: "https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?auto=format&fit=crop&w=400&q=80",
  },
  "time-travelers": {
    title: "The Time Travelers",
    image: "https://images.unsplash.com/photo-1501139083538-0139583c060f?auto=format&fit=crop&w=400&q=80",
  },
  "space-science": {
    title: "Solar System",
    image: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=400&q=80",
  },
  "underwater-adventure": {
    title: "Underwater Adventure",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=400&q=80",
  },
  "sports-champions": {
    title: "Sports Champions",
    image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=400&q=80",
  },
  "animal-habitats": {
    title: "Animal Habitats",
    image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=400&q=80",
  },
  "weather-science": {
    title: "How Weather Works",
    image: "https://images.unsplash.com/photo-1500674425229-f692875b0ab7?auto=format&fit=crop&w=400&q=80",
  },
};

const RACE_BAR_COLORS = [
  "bg-orange-400",
  "bg-violet-400",
  "bg-emerald-400",
  "bg-sky-400",
  "bg-rose-400",
];

const TEACHER_RECOMMENDATIONS: Record<string, RecommendedBook[]> = {
  RIVERA2026: [
    {
      id: "rivera-crossover",
      title: "The Crossover",
      author: "Kwame Alexander",
      lexile: "750L",
      teacherName: "Ms. Rivera",
      blurb: "Fast-paced and perfect for sports readers building stamina.",
      amazonQuery: "The Crossover Kwame Alexander used",
      coverClassName: "from-violet-700 to-fuchsia-500",
    },
    {
      id: "rivera-ivan",
      title: "The One and Only Ivan",
      author: "Katherine Applegate",
      lexile: "570L",
      teacherName: "Ms. Rivera",
      blurb: "Great for empathy and discussion while staying highly engaging.",
      amazonQuery: "The One and Only Ivan Katherine Applegate used",
      coverClassName: "from-amber-900 to-amber-700",
    },
  ],
  WILSON2026: [
    {
      id: "hatchet",
      title: "Hatchet",
      author: "Gary Paulsen",
      lexile: "1020L",
      teacherName: "Mrs. Wilson",
      blurb: "Perfect for your level, survival adventure!",
      amazonQuery: "Hatchet Gary Paulsen used",
      coverClassName: "from-emerald-800 to-emerald-600",
    },
    {
      id: "ivan",
      title: "The One and Only Ivan",
      author: "Katherine Applegate",
      lexile: "570L",
      teacherName: "Mrs. Wilson",
      blurb: "This one made me cry. In a good way.",
      amazonQuery: "The One and Only Ivan Katherine Applegate used",
      coverClassName: "from-amber-900 to-amber-700",
    },
    {
      id: "wonder",
      title: "Wonder",
      author: "R.J. Palacio",
      lexile: "790L",
      teacherName: "Mrs. Wilson",
      blurb: "A powerful story about kindness and courage.",
      amazonQuery: "Wonder RJ Palacio used",
      coverClassName: "from-teal-700 to-cyan-500",
    },
  ],
  SMITH7TH: [
    {
      id: "giver",
      title: "The Giver",
      author: "Lois Lowry",
      lexile: "760L",
      teacherName: "Mr. Smith",
      blurb: "A great pick if you like big ideas and twists.",
      amazonQuery: "The Giver Lois Lowry used",
      coverClassName: "from-slate-800 to-slate-600",
    },
    {
      id: "holes",
      title: "Holes",
      author: "Louis Sachar",
      lexile: "660L",
      teacherName: "Mr. Smith",
      blurb: "Funny, mysterious, and impossible to put down.",
      amazonQuery: "Holes Louis Sachar used",
      coverClassName: "from-orange-700 to-amber-500",
    },
  ],
  JONES3RD: [
    {
      id: "charlotte",
      title: "Charlotte's Web",
      author: "E.B. White",
      lexile: "680L",
      teacherName: "Ms. Jones",
      blurb: "A cozy classic for family read-aloud time.",
      amazonQuery: "Charlotte's Web EB White used",
      coverClassName: "from-rose-700 to-pink-500",
    },
    {
      id: "magic-tree-house",
      title: "Dinosaurs Before Dark",
      author: "Mary Pope Osborne",
      lexile: "510L",
      teacherName: "Ms. Jones",
      blurb: "Short, exciting, and perfect for building reading confidence.",
      amazonQuery: "Dinosaurs Before Dark Mary Pope Osborne used",
      coverClassName: "from-violet-700 to-fuchsia-500",
    },
  ],
};

const FALLBACK_RECOMMENDATIONS: RecommendedBook[] = [
  {
    id: "because-of-winn-dixie",
    title: "Because of Winn-Dixie",
    author: "Kate DiCamillo",
    lexile: "610L",
    teacherName: "StoryWeaver AI",
    blurb: "Warm, funny, and great for talking about friendship.",
    amazonQuery: "Because of Winn-Dixie Kate DiCamillo used",
    coverClassName: "from-sky-700 to-blue-500",
  },
  {
    id: "mercy-watson",
    title: "Mercy Watson",
    author: "Kate DiCamillo",
    lexile: "450L",
    teacherName: "StoryWeaver AI",
    blurb: "A playful choice for newer readers and read-aloud nights.",
    amazonQuery: "Mercy Watson Kate DiCamillo used",
    coverClassName: "from-red-600 to-orange-500",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function getFriendCode(userId: string, name: string): string {
  const prefix = (name || "USR")
    .replace(/\s+/g, "")
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, "X");
  const digits = userId.replace(/\D/g, "").slice(-3).padStart(3, "0");
  return `${prefix}${digits}`;
}

function getAvatarGradient(name: string): string {
  const gradients = [
    "from-violet-500 to-purple-600",
    "from-orange-400 to-red-500",
    "from-emerald-400 to-teal-500",
    "from-sky-400 to-blue-500",
    "from-pink-400 to-rose-500",
    "from-amber-400 to-orange-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = (hash * 31 + name.charCodeAt(i)) % gradients.length;
  return gradients[Math.abs(hash) % gradients.length];
}

function getAmazonUsedLink(query: string): string {
  return `https://www.amazon.com/s?k=${encodeURIComponent(query)}&i=stripbooks`;
}

function getChallengeTheme(code?: string): { title: string; note: string } {
  if (code === 'RIVERA2026') {
    return {
      title: 'Reading Minutes to the Top of Mt. Everest',
      note: 'Each minute climbs the class a little higher toward the summit.',
    };
  }

  return {
    title: 'Read Across America Challenge',
    note: 'Every block of minutes helps the class cross another stretch of the map.',
  };
}

function parseBandMidpoint(level?: string): number | null {
  if (!level) return null;
  const cleaned = level.replace(/L/gi, "").trim();
  if (cleaned.includes("-")) {
    const [min, max] = cleaned.split("-").map((value) => Number(value.trim()));
    if (Number.isFinite(min) && Number.isFinite(max)) return Math.round((min + max) / 2);
    return null;
  }
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseBookLexile(lexile: string): number | null {
  const parsed = Number(lexile.replace(/L/gi, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeBookKey(book: RecommendedBook): string {
  return book.title.toLowerCase().trim();
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function BookClubPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [myMinutes, setMyMinutes] = useState(0);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [classes, setClasses] = useState<JoinedClass[]>([]);
  const [friendCode, setFriendCode] = useState("");
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [recentTitleSignals, setRecentTitleSignals] = useState<string[]>([]);
  const [communityRatings, setCommunityRatings] = useState<Record<string, CommunityRatingEntry>>({});
  const [allAccounts, setAllAccounts] = useState<ReturnType<typeof getStoredAccounts>>([]);

  // Dialog state
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showJoinClass, setShowJoinClass] = useState(false);
  const [friendInput, setFriendInput] = useState("");
  const [classInput, setClassInput] = useState("");
  const [friendError, setFriendError] = useState("");
  const [classError, setClassError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("currentUser");
    if (!userStr) return;
    const user = JSON.parse(userStr);
    setCurrentUser(user);
    const accounts = getStoredAccounts();
    setAllAccounts(accounts);

    const code = getFriendCode(user.id, user.name || user.email);
    setFriendCode(code);

    // Minutes read
    const storedMinutes = localStorage.getItem(`bookclub-minutes-${user.id}`);
    if (storedMinutes) {
      setMyMinutes(parseInt(storedMinutes, 10));
    } else {
      const seed = user.id === "student-demo-001" ? 45 : Math.floor(Math.random() * 35 + 15);
      localStorage.setItem(`bookclub-minutes-${user.id}`, String(seed));
      setMyMinutes(seed);
    }

    // Friends
    const storedFriends = localStorage.getItem(`bookclub-friends-${user.id}`);
    if (storedFriends) {
      setFriends(JSON.parse(storedFriends));
    } else if (user.id === "student-demo-001") {
      const demoFriends: Friend[] = [
        { id: "demo-f-1", name: "Sammy", code: "SAM001", addedAt: new Date(2026, 0, 15).toISOString(), minutesRead: 78 },
        { id: "demo-f-2", name: "Alex T", code: "ALE002", addedAt: new Date(2026, 0, 20).toISOString(), minutesRead: 65 },
        { id: "demo-f-3", name: "Lana", code: "LAN003", addedAt: new Date(2026, 1, 1).toISOString(), minutesRead: 52 },
      ];
      localStorage.setItem(`bookclub-friends-${user.id}`, JSON.stringify(demoFriends));
      setFriends(demoFriends);
    }

    // Classes
    const storedClasses = localStorage.getItem(`bookclub-classes-${user.id}`);
    if (storedClasses) {
      const parsedClasses = JSON.parse(storedClasses) as JoinedClass[];
      if (user.id === "student-demo-001" && !parsedClasses.some((cls) => cls.code === "RIVERA2026")) {
        const withRivera = [...parsedClasses, { ...KNOWN_CLASSES.RIVERA2026, joinedAt: new Date(2026, 0, 10).toISOString() }];
        localStorage.setItem(`bookclub-classes-${user.id}`, JSON.stringify(withRivera));
        setClasses(withRivera);
      } else {
        setClasses(parsedClasses);
      }
    } else if (user.id === "student-demo-001") {
      const demoClasses: JoinedClass[] = [
        { ...KNOWN_CLASSES.RIVERA2026, joinedAt: new Date(2026, 0, 10).toISOString() },
      ];
      localStorage.setItem(`bookclub-classes-${user.id}`, JSON.stringify(demoClasses));
      setClasses(demoClasses);
    }

    const perUserProfile = localStorage.getItem(`userProfile-${user.id}`);
    const fallbackProfile = localStorage.getItem("userProfile");
    const profileData = perUserProfile ?? fallbackProfile;
    if (profileData) {
      try {
        setProfile(JSON.parse(profileData));
      } catch {
        setProfile(null);
      }
    }

    const perUserHistory = localStorage.getItem(`readingHistory-${user.id}`);
    const fallbackHistory = localStorage.getItem("readingHistory");
    const historyData = perUserHistory ?? fallbackHistory;
    if (historyData) {
      try {
        const parsed = JSON.parse(historyData) as Array<{ title?: string; topicId?: string }>;
        setRecentTitleSignals(
          parsed
            .slice(0, 10)
            .map((entry) => `${entry.title || ""} ${entry.topicId || ""}`.toLowerCase())
            .filter(Boolean),
        );
      } catch {
        setRecentTitleSignals([]);
      }
    }

    const ratingData = localStorage.getItem(COMMUNITY_RATINGS_KEY);
    if (ratingData) {
      try {
        setCommunityRatings(JSON.parse(ratingData));
      } catch {
        setCommunityRatings({});
      }
    }
  }, []);

  const persistFriends = (updated: Friend[]) => {
    setFriends(updated);
    if (currentUser)
      localStorage.setItem(`bookclub-friends-${currentUser.id}`, JSON.stringify(updated));
  };

  const persistClasses = (updated: JoinedClass[]) => {
    setClasses(updated);
    if (currentUser)
      localStorage.setItem(`bookclub-classes-${currentUser.id}`, JSON.stringify(updated));
  };

  const handleAddFriend = () => {
    const code = friendInput.trim().toUpperCase();
    setFriendError("");
    if (!code) { setFriendError("Please enter a friend code."); return; }
    if (code === friendCode) { setFriendError("That's your own code!"); return; }
    if (friends.some((f) => f.code === code)) {
      setFriendError("You've already added this friend.");
      return;
    }

    // Try to match a real local account by code
    const accounts = getStoredAccounts();
    const match = accounts.find((a) => getFriendCode(a.id, a.name) === code);

    const newFriend: Friend = {
      id: match?.id ?? `friend-${Date.now()}`,
      name: match?.name ?? `Reader ${code.slice(0, 3)}`,
      code,
      addedAt: new Date().toISOString(),
      minutesRead: Math.floor(Math.random() * 50 + 10),
    };

    persistFriends([...friends, newFriend]);
    setFriendInput("");
    setShowAddFriend(false);
  };

  const handleRemoveFriend = (id: string) => {
    persistFriends(friends.filter((f) => f.id !== id));
  };

  const handleJoinClass = () => {
    const code = classInput.trim().toUpperCase();
    setClassError("");
    if (!code) { setClassError("Please enter a class code."); return; }
    if (classes.some((c) => c.code === code)) {
      setClassError("You're already in this class.");
      return;
    }
    const classData = KNOWN_CLASSES[code];
    if (!classData) {
      setClassError("Class code not found. Double-check with your teacher.");
      return;
    }
    persistClasses([...classes, { ...classData, joinedAt: new Date().toISOString() }]);
    setClassInput("");
    setShowJoinClass(false);
  };

  const handleLeaveClass = (code: string) => {
    persistClasses(classes.filter((c) => c.code !== code));
  };

  const copyCode = () => {
    navigator.clipboard.writeText(friendCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const buildLeaderboard = (cls: JoinedClass): ChallengeEntry[] => {
    const roster = allAccounts.find((account) => account.role === "teacher")
      ? Object.values(localStorage)
      : [];

    // Prefer full class roster when available so students see everyone in class.
    const rosterEntry = allAccounts
      .filter((account) => account.role === "teacher")
      .map((teacher) => {
        try {
          return JSON.parse(localStorage.getItem(`teacher-class-roster-${teacher.id}`) || "null") as {
            classCode?: string;
            studentIds?: string[];
          } | null;
        } catch {
          return null;
        }
      })
      .find((entry) => entry?.classCode === cls.code && Array.isArray(entry?.studentIds));

    if (rosterEntry?.studentIds?.length) {
      const entries = rosterEntry.studentIds
        .map((studentId) => {
          const account = allAccounts.find((candidate) => candidate.id === studentId && candidate.role === "student");
          if (!account) return null;

          const minutesRaw = localStorage.getItem(`bookclub-minutes-${studentId}`);
          const minutes = Number.isFinite(Number(minutesRaw)) && minutesRaw !== null
            ? Number(minutesRaw)
            : Math.floor(Math.random() * 35 + 15);

          return {
            name: (account.name || "Reader").split(" ")[0],
            minutes,
            isMe: currentUser?.id === studentId,
          } as ChallengeEntry;
        })
        .filter(Boolean) as ChallengeEntry[];

      return entries.sort((a, b) => b.minutes - a.minutes);
    }

    const all: ChallengeEntry[] = [
      { name: (currentUser?.name || "You").split(" ")[0], minutes: myMinutes, isMe: true },
      ...friends.map((f) => ({ name: f.name.split(" ")[0], minutes: f.minutesRead, isMe: false })),
    ];
    return all.sort((a, b) => b.minutes - a.minutes);
  };

  const activeClasses = classes.filter((c) => c.challengeGoal);
  const featuredClass = activeClasses[0] ?? classes[0] ?? null;
  const featuredLeaderboard = featuredClass ? buildLeaderboard(featuredClass) : [];
  const featuredChallengeTheme = getChallengeTheme(featuredClass?.code);
  const recommendedBooks = useMemo(() => {
    const seeded = Array.from(
      new Map(
        (classes.length > 0
          ? classes.flatMap((cls) => TEACHER_RECOMMENDATIONS[cls.code] ?? [])
          : FALLBACK_RECOMMENDATIONS
        ).map((book) => [book.id, book])
      ).values()
    );

    const studentLexile = parseBandMidpoint(profile?.lexileLevel);
    const interestText = (profile?.interests || []).join(" ").toLowerCase();

    return seeded
      .map((book) => {
        const crowd = communityRatings[normalizeBookKey(book)];
        const lexile = parseBookLexile(book.lexile);
        const lexileDistance = studentLexile && lexile ? Math.abs(studentLexile - lexile) : 220;
        const lexileScore = Math.max(0, 1 - Math.min(1, lexileDistance / 500));

        const contentBlob = `${book.title} ${book.blurb}`.toLowerCase();
        const interestHit = interestText && contentBlob
          ? interestText.split(/\s+/).some((word) => word.length > 3 && contentBlob.includes(word))
          : false;
        const shortPassageSignal = recentTitleSignals.some((recent) =>
          recent.split(/\s+/).some((token) => token.length > 4 && contentBlob.includes(token)),
        );

        const crowdScore = crowd?.average ? crowd.average / 5 : 0.45;
        const finalScore = lexileScore * 0.45 + (interestHit ? 0.25 : 0) + (shortPassageSignal ? 0.1 : 0) + crowdScore * 0.2;

        return {
          ...book,
          crowdRating: crowd?.average,
          crowdVotes: crowd?.count,
          matchNote: interestHit
            ? "Interest match"
            : shortPassageSignal
              ? "Based on recent passages"
              : "Lexile-aligned pick",
          _score: finalScore,
        };
      })
      .sort((a, b) => b._score - a._score)
      .map(({ _score, ...book }) => book);
  }, [classes, communityRatings, profile, recentTitleSignals]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.10),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(167,139,250,0.12),_transparent_30%),linear-gradient(180deg,_#fff8f0_0%,_#fdf4ff_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-5 lg:px-6 xl:px-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-pink-500 text-white shadow-lg shadow-orange-200">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-orange-500">
                StoryWeaver
              </p>
              <h1 className="text-3xl font-black text-slate-900">The Book Club</h1>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => navigate("/library")}
            >
              <BookOpen className="mr-1.5 h-4 w-4" />
              Story Library
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => navigate("/quiz")}
            >
              Home
            </Button>
          </div>
        </div>

        {/* ── Class Competition Hub ── */}
        <Card className="rounded-3xl border border-slate-200 bg-slate-900 text-white shadow-xl overflow-hidden">
          <CardContent className="pt-5 pb-5 space-y-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-200">
                  Classroom Reading Race
                </p>
                <div>
                  <h2 className="text-2xl font-black leading-tight">
                    Join your class with a code and compete with classmates.
                  </h2>
                  <p className="text-sm text-slate-300 mt-1 max-w-xl">
                    {featuredChallengeTheme.title} keeps the race fresh, with the live leaderboard right below.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                className="rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 text-white gap-1.5"
                onClick={() => {
                  setClassInput("");
                  setClassError("");
                  setShowJoinClass(true);
                }}
              >
                <School className="h-4 w-4" />
                Join Class Code
              </Button>
            </div>

            {featuredClass ? (
              <div className="rounded-2xl bg-white/10 border border-white/10 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-2xl">
                      {featuredClass.emoji}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">{featuredClass.className}</p>
                      <p className="text-xs text-slate-300">
                        {featuredClass.teacherName} · Code {featuredClass.code}
                      </p>
                    </div>
                  </div>
                  <Badge className="rounded-full bg-white text-slate-900">
                    {featuredClass.challengeName ?? "Class Challenge"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Clock className="h-3.5 w-3.5" />
                  Ends {featuredClass.challengeDeadline}
                  {featuredClass.challengeGoal ? ` · ${featuredClass.challengeGoal} minute goal` : ""}
                </div>
                <div className="mt-3 rounded-xl border border-white/10 bg-white/10 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-200">Challenge Theme</p>
                  <p className="mt-1 text-sm font-semibold text-white">{featuredChallengeTheme.title}</p>
                  <p className="mt-1 text-xs text-slate-300">{featuredChallengeTheme.note}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-5 text-center">
                <School className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-white">No class joined yet</p>
                <p className="text-xs text-slate-300 mt-1">
                  Ask your teacher for a class code to unlock the class leaderboard and teacher picks.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          {/* ── Class Leaderboard ── */}
          <Card className="rounded-3xl border border-amber-100 shadow-md overflow-hidden xl:col-span-8">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 pb-3 pt-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <CardTitle className="text-lg font-black text-slate-900">
                    {featuredClass ? `${featuredClass.teacherName}'s Leaderboard` : "Class Leaderboard"}
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-1">
                    {featuredClass
                      ? "See how your reading minutes stack up against your classmates."
                      : "Join a class to start competing with fellow students."}
                  </p>
                </div>
                {featuredClass && (
                  <Button
                    size="sm"
                    className="rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white gap-1"
                    onClick={() => navigate("/library")}
                  >
                    <Zap className="h-3.5 w-3.5" />
                    Keep Reading
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-4 pb-4">
              {featuredClass ? (
                <div className="space-y-3">
                  {featuredLeaderboard.map((entry, i) => {
                    const goal = featuredClass.challengeGoal || 100;
                    const pct = Math.min(100, Math.round((entry.minutes / goal) * 100));
                    const barColor = RACE_BAR_COLORS[i % RACE_BAR_COLORS.length];
                    return (
                      <div key={entry.name + i} className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold bg-gradient-to-br ${getAvatarGradient(entry.name)}`}
                          >
                            {entry.name[0].toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold text-slate-800">
                            {entry.isMe ? `${entry.name} (you)` : entry.name}
                          </span>
                          {i === 0 && (
                            <Badge className="rounded-full bg-amber-400 text-amber-900 text-[10px] px-2 py-0">
                              Leading!
                            </Badge>
                          )}
                          <span className="ml-auto text-xs text-slate-500">
                            {entry.minutes}/{goal} min
                          </span>
                        </div>
                        <div className="relative h-3 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${barColor} transition-all duration-700`}
                            style={{ width: `${pct}%` }}
                          />
                          <div className="absolute right-0.5 top-0 h-full flex items-center">
                            <Trophy className="h-3 w-3 text-amber-400" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex items-center gap-3 pt-1 border-t border-amber-100 text-xs text-slate-500 flex-wrap">
                    <span>{featuredLeaderboard.length} Racer{featuredLeaderboard.length !== 1 ? "s" : ""}</span>
                    <span>·</span>
                    <span>{featuredClass.challengeGoal} min Goal</span>
                    <span>·</span>
                    <span>{featuredClass.challengeName}</span>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-slate-200 py-8 text-center">
                  <Trophy className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-sm text-slate-500">
                    Your leaderboard will appear here after you join a class.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── My Friend Code ── */}
          <Card className="rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 to-pink-50 shadow-sm xl:col-span-4">
            <CardContent className="pt-4 pb-4 flex items-center justify-between gap-4 flex-wrap xl:flex-col xl:items-start xl:justify-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-orange-600 mb-0.5">
                  Your Friend Code
                </p>
                <p className="text-3xl font-black tracking-[0.2em] text-slate-800">{friendCode}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Share this code with friends so they can add you
                </p>
              </div>
              <Button
                variant="outline"
                className="rounded-full border-orange-200 bg-white gap-2 xl:w-full"
                onClick={copyCode}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copied!" : "Copy Code"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ── Recommended Home Books ── */}
        <Card className="rounded-3xl shadow-lg overflow-hidden border border-violet-100">
          <CardHeader className="bg-white pb-4 pt-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <CardTitle className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                  Recommended for You
                </CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  Ranked by teacher picks plus Lexile fit, interests, and student ratings from recent reading signals.
                </p>
              </div>
              <Badge className="rounded-full bg-violet-100 text-violet-700 px-3 py-1">
                Home library picks
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {recommendedBooks.map((book) => (
                <div
                  key={book.id}
                  className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <Badge className="rounded-full bg-slate-900 text-white px-3 py-1 text-xs">
                      <BookOpen className="h-3 w-3 mr-1" />
                      {book.teacherName}
                    </Badge>
                    <Heart className="h-5 w-5 text-slate-200" />
                  </div>
                  <div className={`mx-auto mb-5 flex h-44 w-32 items-center justify-center rounded-md bg-gradient-to-br ${book.coverClassName} px-4 text-center text-white shadow-xl`}>
                    <p className="text-2xl font-black leading-tight drop-shadow-sm">{book.title}</p>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-2xl font-black leading-tight text-slate-900">{book.title}</p>
                      <p className="text-lg text-slate-500">{book.author}</p>
                    </div>
                    <p className="text-lg italic text-violet-500">"{book.blurb}"</p>
                    {book.crowdRating ? (
                      <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                        {book.crowdRating.toFixed(1)} / 5 ({book.crowdVotes || 0} ratings)
                      </div>
                    ) : null}
                    {book.matchNote ? (
                      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">{book.matchNote}</p>
                    ) : null}
                    <div className="inline-flex rounded-full bg-slate-100 px-4 py-1.5 text-lg font-bold text-slate-600">
                      {book.lexile}
                    </div>
                  </div>
                  <Button
                    className="mt-5 w-full rounded-full bg-slate-900 text-white hover:bg-slate-800"
                    onClick={() => window.open(getAmazonUsedLink(book.amazonQuery), "_blank", "noopener,noreferrer")}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Buy Used on Amazon
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* ── Friends ── */}
        <Card className="rounded-2xl shadow-md h-full">
          <CardHeader className="pb-3 pt-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">My Friends</CardTitle>
              <p className="text-xs text-slate-500">
                {friends.length} friend{friends.length !== 1 ? "s" : ""} added
              </p>
            </div>
            <Button
              size="sm"
              className="rounded-full bg-gradient-to-r from-violet-500 to-purple-600 text-white gap-1"
              onClick={() => {
                setFriendInput("");
                setFriendError("");
                setShowAddFriend(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add Friend
            </Button>
          </CardHeader>
          <CardContent className="pb-4 space-y-1">
            {friends.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-slate-200 py-8 text-center">
                <Users className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">
                  No friends yet.
                  <br />
                  Add friends using their code!
                </p>
              </div>
            ) : (
              friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center gap-3 rounded-xl p-3 hover:bg-slate-50 transition-colors"
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white font-bold text-sm bg-gradient-to-br ${getAvatarGradient(friend.name)}`}
                  >
                    {friend.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">
                      {friend.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {friend.minutesRead} min read · Code: {friend.code}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge
                      variant="outline"
                      className="rounded-full text-xs hidden sm:flex"
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {friend.minutesRead} min
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-slate-400 hover:text-red-500"
                      onClick={() => handleRemoveFriend(friend.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* ── Classes ── */}
        <Card className="rounded-2xl shadow-md h-full">
          <CardHeader className="pb-3 pt-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">My Classes</CardTitle>
              <p className="text-xs text-slate-500">
                Join with a class code from your teacher
              </p>
            </div>
            <Button
              size="sm"
              className="rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 text-white gap-1"
              onClick={() => {
                setClassInput("");
                setClassError("");
                setShowJoinClass(true);
              }}
            >
              <School className="h-4 w-4" />
              Join Class
            </Button>
          </CardHeader>
          <CardContent className="pb-4 space-y-4">
            {classes.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-slate-200 py-8 text-center">
                <School className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">
                  Not in any class yet.
                  <br />
                  Ask your teacher for a class code!
                </p>
              </div>
            ) : (
              classes.map((cls) => (
                <div
                  key={cls.code}
                  className="rounded-xl border border-slate-200 overflow-hidden"
                >
                  {/* Class header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-50 to-sky-50 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{cls.emoji}</span>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{cls.className}</p>
                        <p className="text-xs text-slate-500">
                          {cls.teacherName} · Code:{" "}
                          <strong className="font-mono">{cls.code}</strong>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="rounded-full bg-sky-100 text-sky-700 text-xs">
                        Following
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-slate-400 hover:text-red-500"
                        onClick={() => handleLeaveClass(cls.code)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Teacher picks inside class */}
                  <div className="p-3">
                    <p className="text-xs font-semibold text-slate-600 mb-2.5 flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 text-amber-500" />
                      {cls.teacherName}'s Recommended Reads
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {cls.recommendedTopicIds.map((topicId) => {
                        const info = TOPIC_INFO[topicId];
                        if (!info) return null;
                        return (
                          <button
                            key={topicId}
                            onClick={() => {
                              localStorage.setItem(
                                "selectedTopic",
                                JSON.stringify({ id: topicId })
                              );
                              navigate(`/read/${topicId}`);
                            }}
                            className="relative rounded-xl overflow-hidden aspect-[4/3] group focus:outline-none focus:ring-2 focus:ring-violet-500"
                          >
                            <ImageWithFallback
                              src={info.image}
                              alt={info.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                            <p className="absolute bottom-1 left-1 right-1 text-white text-[10px] font-semibold leading-tight line-clamp-2">
                              {info.title}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => {
                        const firstBook = (TEACHER_RECOMMENDATIONS[cls.code] ?? [])[0];
                        if (firstBook) {
                          window.open(getAmazonUsedLink(firstBook.amazonQuery), "_blank", "noopener,noreferrer");
                        }
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-700"
                    >
                      See home book recommendations
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        </div>

        {/* Demo hint */}
        <p className="text-center text-xs text-slate-400 pb-4">
          Demo class codes:{" "}
          <strong>RIVERA2026</strong> · <strong>WILSON2026</strong> · <strong>SMITH7TH</strong> · <strong>JONES3RD</strong>
        </p>
      </div>

      {/* ── Add Friend Dialog ── */}
      <Dialog open={showAddFriend} onOpenChange={setShowAddFriend}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <Users className="h-5 w-5 text-violet-500" />
              Add a Friend
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-slate-600">
              Enter your friend's code. They can find it at the top of their Book Club page.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="friend-code-input">Friend Code</Label>
              <Input
                id="friend-code-input"
                placeholder="e.g. SAM001"
                value={friendInput}
                onChange={(e) => setFriendInput(e.target.value.toUpperCase())}
                maxLength={10}
                className="font-mono tracking-widest text-center text-lg"
                onKeyDown={(e) => e.key === "Enter" && handleAddFriend()}
              />
              {friendError && (
                <p className="text-xs text-red-500">{friendError}</p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAddFriend(false)}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-violet-500 to-purple-600"
              onClick={handleAddFriend}
            >
              Add Friend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Join Class Dialog ── */}
      <Dialog open={showJoinClass} onOpenChange={setShowJoinClass}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <School className="h-5 w-5 text-sky-500" />
              Join a Class
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-slate-600">
              Ask your teacher for the class code. Once you join, you'll see their recommended
              reads and any reading challenges!
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="class-code-input">Class Code</Label>
              <Input
                id="class-code-input"
                placeholder="e.g. WILSON2026"
                value={classInput}
                onChange={(e) => setClassInput(e.target.value.toUpperCase())}
                maxLength={20}
                className="font-mono tracking-widest text-center text-lg"
                onKeyDown={(e) => e.key === "Enter" && handleJoinClass()}
              />
              {classError && (
                <p className="text-xs text-red-500">{classError}</p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowJoinClass(false)}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-sky-500 to-cyan-500"
              onClick={handleJoinClass}
            >
              Join Class
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
