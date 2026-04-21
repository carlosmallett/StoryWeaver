import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { BookOpen, Target, TrendingUp, Award, MessageCircle, Lightbulb, Info, LogOut, ChevronDown, ChevronUp, ShoppingCart, Sparkles } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LexileChartModal } from "../components/LexileChartModal";
import { clearCurrentUser, getStoredAccounts } from "../utils/localAuth";

interface Metrics {
  totalWordsRead: number;
  totalPagesRead: number;
  totalQuestionsAnswered: number;
  totalQuestionsCorrect: number;
  byLexileLevel: Record<string, {
    wordsRead: number;
    pagesRead: number;
    questionsAnswered: number;
    questionsCorrect: number;
  }>;
}

interface StoryRecord {
  id: string;
  title: string;
  lexileLevel: string;
  wordsRead: number;
  dateRead: string;
  accuracy: number;
  questionsAnswered: number;
  questionsCorrect: number;
  summary: string;
  discussionQuestions: string[];
}

interface HomeRecommendedBook {
  id: string;
  title: string;
  author: string;
  lexile: string;
  teacherName: string;
  note: string;
  amazonQuery: string;
  childName?: string;
  fitReason?: string;
}

interface BookClubClassSummary {
  code: string;
}

interface LinkedChildSummary {
  id: string;
  name: string;
  lexileLevel: string;
  interests: string[];
  minutesRead: number;
  storyLanguage?: string;
}

interface FamilyChallenge {
  title: string;
  goal: number;
  progress: number;
  progressLabel: string;
  note: string;
}

const DEMO_STORY_HISTORY: StoryRecord[] = [
  {
    id: "story-1",
    title: "Robot Friends",
    lexileLevel: "1000L",
    wordsRead: 512,
    dateRead: "3/25/2026",
    accuracy: 100,
    questionsAnswered: 4,
    questionsCorrect: 4,
    summary: "A heartwarming tale about a young inventor who builds a robot companion to help around the house. Together, they learn that true friendship comes from caring and loyalty, not from being perfect.",
    discussionQuestions: [
      "If you could build a robot, what would you want it to help you with?",
      "How do you think the inventor felt when the robot first came to life?",
      "What does the story teach us about friendship and caring for others?",
      "Can you think about how the inventor and robot worked together as a team?",
      "Would you want a robot friend? Why or why not?"
    ]
  },
  {
    id: "story-2",
    title: "Lost Treasure I",
    lexileLevel: "300L",
    wordsRead: 287,
    dateRead: "3/22/2026",
    accuracy: 61,
    questionsAnswered: 5,
    questionsCorrect: 3,
    summary: "An exciting adventure where a young explorer discovers an old map leading to hidden treasure. Along the journey, they face challenges and make new friends, learning that the real treasure is the friendships made along the way.",
    discussionQuestions: [
      "What would you pack if you went on a treasure hunt?",
      "How did the explorer feel when they found the map?",
      "What was the most exciting part of the story for you?",
      "If you found a real treasure map, who would you take with you?",
      "What did the explorer learn by the end of their journey?"
    ]
  },
  {
    id: "story-3",
    title: "Ancient Egypt",
    lexileLevel: "400L",
    wordsRead: 456,
    dateRead: "3/20/2026",
    accuracy: 93,
    questionsAnswered: 5,
    questionsCorrect: 4,
    summary: "A fascinating journey through Ancient Egypt where we meet a young pyramid builder and learn about the incredible engineering, culture, and mysteries of one of history's greatest civilizations.",
    discussionQuestions: [
      "What surprised you most about how Ancient Egypt worked?",
      "How do you think people built the pyramids without modern tools?",
      "If you lived in Ancient Egypt, what job would you want to have?",
      "What was the most interesting thing you learned about Egyptian culture?",
      "Why do you think people still visit the pyramids today?"
    ]
  },
  {
    id: "story-4",
    title: "Dinosaur Discovery",
    lexileLevel: "500L",
    wordsRead: 389,
    dateRead: "3/18/2026",
    accuracy: 75,
    questionsAnswered: 4,
    questionsCorrect: 3,
    summary: "A thrilling adventure where a young paleontologist uncovers dinosaur fossils and learns surprising facts about these ancient creatures. The story blends science with wonder, showing how curiosity leads to amazing discoveries.",
    discussionQuestions: [
      "Which dinosaur would you like to learn more about and why?",
      "How do scientists figure out what dinosaurs looked like from fossils?",
      "If dinosaurs still existed, how do you think the world would be different?",
      "What fossil would you most like to discover?",
      "What did the paleontologist discover that surprised them the most?"
    ]
  },
  {
    id: "story-5",
    title: "Mission to Mars",
    lexileLevel: "600L",
    wordsRead: 478,
    dateRead: "3/15/2026",
    accuracy: 75,
    questionsAnswered: 4,
    questionsCorrect: 3,
    summary: "An inspiring science fiction story about humanity's first mission to Mars. Astronauts work together to overcome challenges, conduct experiments, and make groundbreaking discoveries that change our understanding of space.",
    discussionQuestions: [
      "What do you think it would be like to travel to Mars?",
      "What skills would an astronaut need for a mission like this?",
      "If you could bring one item to Mars, what would it be?",
      "What was the biggest challenge the astronauts faced?",
      "How might living on Mars be different from living on Earth?"
    ]
  },
  {
    id: "story-6",
    title: "Super Bowl 2026 Highlights",
    lexileLevel: "500L",
    wordsRead: 121,
    dateRead: "3/26/2026",
    accuracy: 0,
    questionsAnswered: 1,
    questionsCorrect: 0,
    summary: "The stadium hummed with a restless energy that felt almost electric. For Leo, the weight of the golden trophy seemed to press down on his shoulders even before he touched the ball. This was the World...",
    discussionQuestions: [
      "What sports are you interested in or enjoy playing?",
      "How do you think the main character felt about this big moment?",
      "What does teamwork mean in sports?",
      "If you were playing in the Super Bowl, how would you feel?",
      "What's your favorite sports moment you've seen or experienced?"
    ]
  }
];

const TEACHER_HOME_RECOMMENDATIONS: Record<string, HomeRecommendedBook[]> = {
  WILSON2026: [
    {
      id: "hatchet",
      title: "Hatchet",
      author: "Gary Paulsen",
      lexile: "1020L",
      teacherName: "Mrs. Wilson",
      note: "Excellent for resilience and survival-theme discussions at home.",
      amazonQuery: "Hatchet Gary Paulsen used",
    },
    {
      id: "one-and-only-ivan",
      title: "The One and Only Ivan",
      author: "Katherine Applegate",
      lexile: "570L",
      teacherName: "Mrs. Wilson",
      note: "Great for empathy conversations between parents and kids.",
      amazonQuery: "The One and Only Ivan Katherine Applegate used",
    },
  ],
  SMITH7TH: [
    {
      id: "the-giver",
      title: "The Giver",
      author: "Lois Lowry",
      lexile: "760L",
      teacherName: "Mr. Smith",
      note: "Ideal for deeper conversations about choices and community.",
      amazonQuery: "The Giver Lois Lowry used",
    },
    {
      id: "holes",
      title: "Holes",
      author: "Louis Sachar",
      lexile: "660L",
      teacherName: "Mr. Smith",
      note: "A fun mystery with strong themes of perseverance.",
      amazonQuery: "Holes Louis Sachar used",
    },
  ],
  JONES3RD: [
    {
      id: "charlottes-web",
      title: "Charlotte's Web",
      author: "E.B. White",
      lexile: "680L",
      teacherName: "Ms. Jones",
      note: "Perfect for read-aloud bonding and character discussions.",
      amazonQuery: "Charlotte's Web EB White used",
    },
    {
      id: "dinosaurs-before-dark",
      title: "Dinosaurs Before Dark",
      author: "Mary Pope Osborne",
      lexile: "510L",
      teacherName: "Ms. Jones",
      note: "Short chapters make nightly reading easy and consistent.",
      amazonQuery: "Dinosaurs Before Dark Mary Pope Osborne used",
    },
  ],
};

const FALLBACK_HOME_RECOMMENDATIONS: HomeRecommendedBook[] = [
  {
    id: "because-of-winn-dixie",
    title: "Because of Winn-Dixie",
    author: "Kate DiCamillo",
    lexile: "610L",
    teacherName: "StoryWeaver AI",
    note: "A warm and accessible family pick for home reading.",
    amazonQuery: "Because of Winn-Dixie Kate DiCamillo used",
  },
  {
    id: "mercy-watson",
    title: "Mercy Watson",
    author: "Kate DiCamillo",
    lexile: "450L",
    teacherName: "StoryWeaver AI",
    note: "A playful option for building confidence and joy in reading.",
    amazonQuery: "Mercy Watson Kate DiCamillo used",
  },
];

const FAMILY_BOOK_CATALOG: Array<HomeRecommendedBook & {
  minLexile: number;
  maxLexile: number;
  keywords: string[];
}> = [
  {
    id: "frog-and-toad",
    title: "Frog and Toad Are Friends",
    author: "Arnold Lobel",
    lexile: "400L",
    teacherName: "StoryWeaver Family Picks",
    note: "Short chapters and warm humor make this great for early confidence-building.",
    amazonQuery: "Frog and Toad Are Friends used",
    minLexile: 250,
    maxLexile: 500,
    keywords: ["friendship", "family", "animals"],
  },
  {
    id: "magic-tree-house-moon",
    title: "Magic Tree House: Midnight on the Moon",
    author: "Mary Pope Osborne",
    lexile: "490L",
    teacherName: "StoryWeaver Family Picks",
    note: "Adventure plus science makes this a strong bridge for curious readers.",
    amazonQuery: "Magic Tree House Midnight on the Moon used",
    minLexile: 350,
    maxLexile: 560,
    keywords: ["science", "space", "adventure"],
  },
  {
    id: "winn-dixie",
    title: "Because of Winn-Dixie",
    author: "Kate DiCamillo",
    lexile: "610L",
    teacherName: "StoryWeaver Family Picks",
    note: "Strong for empathy, discussion, and family read-aloud time.",
    amazonQuery: "Because of Winn-Dixie used",
    minLexile: 520,
    maxLexile: 700,
    keywords: ["friendship", "family", "animals"],
  },
  {
    id: "one-only-ivan-family",
    title: "The One and Only Ivan",
    author: "Katherine Applegate",
    lexile: "570L",
    teacherName: "StoryWeaver Family Picks",
    note: "High-interest animal story with powerful emotional conversations.",
    amazonQuery: "The One and Only Ivan used",
    minLexile: 500,
    maxLexile: 700,
    keywords: ["animals", "friendship"],
  },
  {
    id: "the-crossover-family",
    title: "The Crossover",
    author: "Kwame Alexander",
    lexile: "750L",
    teacherName: "StoryWeaver Family Picks",
    note: "Excellent sports-driven option for older readers who want momentum.",
    amazonQuery: "The Crossover used",
    minLexile: 650,
    maxLexile: 850,
    keywords: ["sports", "competition"],
  },
  {
    id: "hatchet-family",
    title: "Hatchet",
    author: "Gary Paulsen",
    lexile: "1020L",
    teacherName: "StoryWeaver Family Picks",
    note: "A strong stretch pick for older adventure readers ready for stamina.",
    amazonQuery: "Hatchet used",
    minLexile: 820,
    maxLexile: 1100,
    keywords: ["adventure", "survival", "explore"],
  },
];

function getAmazonUsedLink(query: string): string {
  return `https://www.amazon.com/s?k=${encodeURIComponent(query)}&i=stripbooks`;
}

function parseLexileMidpoint(level?: string): number {
  if (!level) return 500;
  const cleaned = level.replace(/L/gi, "");
  if (cleaned.includes('-')) {
    const [min, max] = cleaned.split('-').map((value) => Number(value.trim()));
    if (Number.isFinite(min) && Number.isFinite(max)) {
      return Math.round((min + max) / 2);
    }
  }

  const parsed = Number(cleaned.trim());
  return Number.isFinite(parsed) ? parsed : 500;
}

function buildFamilyChallenge(children: LinkedChildSummary[]): FamilyChallenge | null {
  if (children.length === 0) return null;

  const totalMinutes = children.reduce((sum, child) => sum + child.minutesRead, 0);
  if (children.length > 1) {
    const statesUnlocked = Math.min(50, Math.round(totalMinutes / 10));
    return {
      title: 'Read Across America Family Challenge',
      goal: 50,
      progress: statesUnlocked,
      progressLabel: `${statesUnlocked} / 50 states unlocked`,
      note: 'Every 10 minutes of family reading unlocks another state on the route.',
    };
  }

  return {
    title: 'Reading Minutes to the Top of Mt. Everest',
    goal: 290,
    progress: Math.min(290, totalMinutes),
    progressLabel: `${Math.min(290, totalMinutes)} / 290 summit minutes`,
    note: 'Keep climbing. Each reading minute moves this reader higher up the mountain.',
  };
}

function buildFamilyBookRecommendations(children: LinkedChildSummary[]): HomeRecommendedBook[] {
  return children.flatMap((child) => {
    const childLexile = parseLexileMidpoint(child.lexileLevel);
    const interestText = child.interests.join(' ').toLowerCase();

    const matches = FAMILY_BOOK_CATALOG
      .map((book) => {
        const lexileFit = childLexile >= book.minLexile && childLexile <= book.maxLexile;
        const keywordFit = book.keywords.some((keyword) => interestText.includes(keyword));
        const score = (lexileFit ? 2 : 0) + (keywordFit ? 1 : 0) - Math.abs(parseLexileMidpoint(book.lexile) - childLexile) / 500;
        return {
          ...book,
          score,
          fitReason: keywordFit ? 'Matches interests and reading level' : 'Strong Lexile fit for current reading level',
          childName: child.name,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);

    return matches;
  });
}

export function ParentDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentReading, setCurrentReading] = useState<any>(null);
  const [showLexileChart, setShowLexileChart] = useState(false);
  const [readingHistory, setReadingHistory] = useState<StoryRecord[]>([]);
  const [expandedStories, setExpandedStories] = useState<Set<string>>(new Set());
  const [homeRecommendations, setHomeRecommendations] = useState<HomeRecommendedBook[]>([]);
  const [linkedChildren, setLinkedChildren] = useState<LinkedChildSummary[]>([]);
  const [familyChallenge, setFamilyChallenge] = useState<FamilyChallenge | null>(null);

  const safeParse = <T,>(raw: string | null, fallback: T): T => {
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  };

  const buildMetricsFromHistory = (history: StoryRecord[]): Metrics => {
    const byLexileLevel: Metrics['byLexileLevel'] = {};
    let totalWordsRead = 0;
    let totalPagesRead = 0;
    let totalQuestionsAnswered = 0;
    let totalQuestionsCorrect = 0;

    for (const entry of history) {
      const level = entry.lexileLevel?.replace(/L$/i, '') || '400-600';
      if (!byLexileLevel[level]) {
        byLexileLevel[level] = {
          wordsRead: 0,
          pagesRead: 0,
          questionsAnswered: 0,
          questionsCorrect: 0,
        };
      }

      const wordsRead = Number(entry.wordsRead || 0);
      const questionsAnswered = Number(entry.questionsAnswered || 0);
      const questionsCorrect = Number(entry.questionsCorrect || 0);
      const pagesRead = Math.max(1, Math.ceil(wordsRead / 180));

      byLexileLevel[level].wordsRead += wordsRead;
      byLexileLevel[level].pagesRead += pagesRead;
      byLexileLevel[level].questionsAnswered += questionsAnswered;
      byLexileLevel[level].questionsCorrect += questionsCorrect;

      totalWordsRead += wordsRead;
      totalPagesRead += pagesRead;
      totalQuestionsAnswered += questionsAnswered;
      totalQuestionsCorrect += questionsCorrect;
    }

    return {
      totalWordsRead,
      totalPagesRead,
      totalQuestionsAnswered,
      totalQuestionsCorrect,
      byLexileLevel,
    };
  };

  const normalizeStudentHistory = (studentId: string): StoryRecord[] => {
    const storedHistory = safeParse<StoryRecord[]>(localStorage.getItem(`readingHistory-${studentId}`), []);
    const currentReading = safeParse<Record<string, unknown> | null>(localStorage.getItem(`currentReading-${studentId}`), null);

    if (!currentReading) {
      return storedHistory;
    }

    const currentTitle = String(currentReading.title || 'Reading Session');
    const currentTimestamp = String(currentReading.timestamp || new Date().toISOString());
    const currentStory = String(currentReading.story || '');
    const currentQuestionsAnswered = Number(currentReading.questionsAnswered || 0);
    const currentQuestionsCorrect = Number(currentReading.questionsCorrect || 0);
    const currentWordsRead = Number(currentReading.wordsRead || (currentStory ? currentStory.split(/\s+/).length : 0));
    const currentLexile = String(currentReading.lexileLevel || '400-600');

    const currentEntry: StoryRecord = {
      id: `current-${studentId}`,
      title: currentTitle,
      lexileLevel: currentLexile,
      wordsRead: currentWordsRead,
      dateRead: new Date(currentTimestamp).toLocaleDateString(),
      accuracy: currentQuestionsAnswered > 0 ? Math.round((currentQuestionsCorrect / currentQuestionsAnswered) * 100) : 0,
      questionsAnswered: currentQuestionsAnswered,
      questionsCorrect: currentQuestionsCorrect,
      summary: currentStory ? `${currentStory.slice(0, 220)}${currentStory.length > 220 ? '...' : ''}` : 'Current reading session',
      discussionQuestions: [
        'What do you think will happen next?',
        'Which detail from the story helped you most?',
        'What would you do differently than the main character?',
      ],
    };

    const hasCurrent = storedHistory.some((entry) => entry.title === currentEntry.title && entry.dateRead === currentEntry.dateRead);
    if (hasCurrent) {
      return storedHistory;
    }

    return [currentEntry, ...storedHistory];
  };

  useEffect(() => {
    const currentUserData = localStorage.getItem("currentUser");
    const parsedCurrentUser = safeParse<{ id?: string } | null>(currentUserData, null);
    const recommendationUserId = parsedCurrentUser?.id || localStorage.getItem("userId") || "guest";

    const allAccounts = getStoredAccounts();
    const childAccounts = allAccounts.filter(
      (account) => account.role === 'student' && account.linkedParentId === parsedCurrentUser?.id,
    );
    const childSummaries: LinkedChildSummary[] = childAccounts.map((child) => {
      const childProfileRaw = localStorage.getItem(`userProfile-${child.id}`);
      const childProfile = childProfileRaw ? JSON.parse(childProfileRaw) : {};
      const childMinutes = Number(localStorage.getItem(`bookclub-minutes-${child.id}`) || '0');

      return {
        id: child.id,
        name: child.name,
        lexileLevel: childProfile.lexileLevel || '400-600',
        interests: childProfile.interests || [],
        minutesRead: childMinutes,
        storyLanguage: childProfile.storyLanguage || childProfile.homeLanguage || 'English',
      };
    });
    setLinkedChildren(childSummaries);
    setFamilyChallenge(buildFamilyChallenge(childSummaries));

    const storedClasses = localStorage.getItem(`bookclub-classes-${recommendationUserId}`);
    const joinedClasses: BookClubClassSummary[] = storedClasses ? JSON.parse(storedClasses) : [];
    const teacherBookList = joinedClasses.flatMap((cls) => TEACHER_HOME_RECOMMENDATIONS[cls.code] ?? []);
    const familyBooks = buildFamilyBookRecommendations(childSummaries);
    const resolvedBooks = [...teacherBookList, ...familyBooks, ...(teacherBookList.length === 0 && familyBooks.length === 0 ? FALLBACK_HOME_RECOMMENDATIONS : [])];
    const dedupedBooks = Array.from(new Map(resolvedBooks.map((book) => [book.id, book])).values());
    setHomeRecommendations(dedupedBooks);

    const prioritizedChild = childAccounts.find((child) => /bra(y)?den/i.test(child.name)) ?? childAccounts[0];

    if (prioritizedChild) {
      const childProfile = safeParse<Record<string, unknown>>(localStorage.getItem(`userProfile-${prioritizedChild.id}`), {});
      const childCurrentReading = safeParse<Record<string, unknown> | null>(
        localStorage.getItem(`currentReading-${prioritizedChild.id}`) ?? localStorage.getItem('currentReading'),
        null,
      );
      const childHistory = normalizeStudentHistory(prioritizedChild.id);

      if (childHistory.length > 0) {
        localStorage.setItem(`readingHistory-${prioritizedChild.id}`, JSON.stringify(childHistory));
      }

      setProfile({
        ...childProfile,
        name: prioritizedChild.name,
      });
      setCurrentReading(childCurrentReading);
      setReadingHistory(childHistory);
      setMetrics(buildMetricsFromHistory(childHistory));
    } else {
      const fallbackProfile = safeParse<Record<string, unknown>>(localStorage.getItem('userProfile'), {});
      const fallbackCurrentReading = safeParse<Record<string, unknown> | null>(localStorage.getItem('currentReading'), null);
      const fallbackHistory = safeParse<StoryRecord[]>(localStorage.getItem('readingHistory'), []);
      setProfile(fallbackProfile);
      setCurrentReading(fallbackCurrentReading);
      setReadingHistory(fallbackHistory);
      setMetrics(buildMetricsFromHistory(fallbackHistory));
    }

    setLoading(false);
  }, []);

  const accuracyPercentage = metrics?.totalQuestionsAnswered
    ? Math.round((metrics.totalQuestionsCorrect / metrics.totalQuestionsAnswered) * 100)
    : 0;

  const diagnostic = profile?.diagnostic;
  const diagnosticScore = diagnostic?.scorePercentage ?? 0;
  const diagnosticNextBand = (() => {
    const levels = ["200-400", "400-600", "600-800", "800-1000"];
    const current = profile?.lexileLevel;
    const idx = levels.indexOf(current);
    if (idx === -1) return current || "400-600";

    if (diagnosticScore >= 85 && accuracyPercentage >= 75 && idx < levels.length - 1) {
      return levels[idx + 1];
    }
    if (diagnosticScore < 45 && idx > 0) {
      return levels[idx - 1];
    }
    return levels[idx];
  })();

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      '200-400': 'bg-pink-500',
      '400-600': 'bg-orange-500',
      '600-800': 'bg-green-500',
      '800-1000': 'bg-blue-500',
    };
    return colors[level] || 'bg-gray-500';
  };

  const getLineChartColor = (lexile: string) => {
    const colors: Record<string, string> = {
      '1000L': '#FF6B6B',
      '300L': '#00D9A3',
      '400L': '#4ECDC4',
      '500L': '#A78BFA',
      '600L': '#F59E0B',
      '700L': '#EF4444',
    };
    return colors[lexile] || '#888888';
  };

  // Prepare chart data for accuracy by story
  const prepareChartData = () => {
    const chartData = readingHistory.map((story) => ({
      name: story.title.length > 12 ? story.title.substring(0, 10) + '...' : story.title,
      fullName: story.title,
      [story.lexileLevel]: story.accuracy,
    }));

    // Group by story title and merge lexile data
    const mergedData: Record<string, any> = {};
    readingHistory.forEach((story) => {
      const key = story.title;
      if (!mergedData[key]) {
        mergedData[key] = {
          name: story.title.length > 12 ? story.title.substring(0, 10) + '...' : story.title,
          fullName: story.title,
        };
      }
      mergedData[key][story.lexileLevel] = story.accuracy;
    });

    return Object.values(mergedData);
  };

  const toggleStoryExpanded = (storyId: string) => {
    const newSet = new Set(expandedStories);
    if (newSet.has(storyId)) {
      newSet.delete(storyId);
    } else {
      newSet.add(storyId);
    }
    setExpandedStories(newSet);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="text-center">
          <p className="text-xl text-gray-600">Loading progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
            Reading Progress Dashboard
          </h1>
          {profile && (
            <p className="text-lg text-gray-600">
              Tracking progress for <strong>{profile.name}</strong>
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              clearCurrentUser();
              localStorage.removeItem('selectedTopic');
              localStorage.removeItem('currentReading');
              navigate('/login');
            }}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>

        </div>
      </div>

      {/* Currently Reading Summary - For Parent-Child Conversation */}
      {currentReading && (
        <Card className="border-2 shadow-xl mb-8 bg-gradient-to-br from-amber-50 to-orange-50">
          <CardHeader className="bg-gradient-to-r from-amber-100 to-orange-100 border-b-2 border-orange-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-6 h-6 text-orange-600" />
                <div>
                  <CardTitle className="text-2xl text-orange-900">Currently Reading Together</CardTitle>
                  <CardDescription className="text-orange-700">
                    Conversation starters for quality reading time with {profile?.name || 'your child'}
                  </CardDescription>
                </div>
              </div>
              <Badge className="bg-orange-500 text-white">
                {currentReading.wordsRead} words
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Story Title & Quick Summary */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-5 h-5 text-orange-600" />
                  <h3 className="text-xl font-bold text-gray-800">{currentReading.title}</h3>
                  <Badge variant="outline" className="text-xs">
                    Lexile {currentReading.lexileLevel}
                  </Badge>
                </div>
                <div className="bg-white p-5 rounded-lg border-2 border-orange-200 shadow-sm">
                  <p className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                    <span className="text-xl">📖</span>
                    What {profile?.name || 'Your Child'} Just Read:
                  </p>
                  <p className="text-base text-gray-700 leading-relaxed">
                    {currentReading.storyExcerpt || currentReading.story?.substring(0, 300) + '...'}
                  </p>
                </div>
              </div>

              {/* Key Vocabulary Words */}
              {currentReading.importantWords && currentReading.importantWords.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-5 h-5 text-amber-600" />
                    <h4 className="text-lg font-semibold text-gray-800">Key Words They Encountered:</h4>
                  </div>
                  <div className="bg-white p-4 rounded-lg border-2 border-orange-200 shadow-sm">
                    <div className="flex flex-wrap gap-2">
                      {currentReading.importantWords.slice(0, 15).map((word: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-sm px-3 py-1.5 bg-amber-50 border-amber-300 text-amber-900 font-medium">
                          {word}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 mt-3 italic">
                      💡 These words were highlighted during reading to build vocabulary and comprehension
                    </p>
                  </div>
                </div>
              )}

              {/* Conversation Starter Questions - UNIVERSAL FOR ANY STORY */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle className="w-5 h-5 text-purple-600" />
                  <h4 className="text-lg font-semibold text-gray-800">Open-Ended Conversation Starters:</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4 italic bg-purple-50 p-3 rounded-lg border border-purple-200">
                  💬 Use these questions to naturally discuss the story during bedtime, car rides, or quality time together. 
                  <strong> Let your child lead the conversation</strong> — there are no wrong answers!
                </p>
                
                <div className="space-y-3">
                  {/* Universal Question 1: Personal Connection */}
                  <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500 shadow-sm hover:shadow-md transition-shadow">
                    <p className="font-semibold text-purple-900 mb-2">
                      💭 "What part of the story could you picture most clearly in your mind? Can you describe what you imagined?"
                    </p>
                    <p className="text-xs text-gray-600 italic">
                      → Helps them visualize and engage with narrative imagery
                    </p>
                  </div>
                  
                  {/* Universal Question 2: Favorite Moment */}
                  <div className="bg-white p-4 rounded-lg border-l-4 border-pink-500 shadow-sm hover:shadow-md transition-shadow">
                    <p className="font-semibold text-pink-900 mb-2">
                      ❤️ "What was your favorite part of the story? Why did that part stand out to you?"
                    </p>
                    <p className="text-xs text-gray-600 italic">
                      → Encourages personal preferences and recall of specific details
                    </p>
                  </div>
                  
                  {/* Universal Question 3: Vocabulary Exploration */}
                  {currentReading.importantWords && currentReading.importantWords.length > 0 && (
                    <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500 shadow-sm hover:shadow-md transition-shadow">
                      <p className="font-semibold text-blue-900 mb-2">
                        🔤 "I see the story used the word '<strong>{currentReading.importantWords[Math.floor(Math.random() * Math.min(5, currentReading.importantWords.length))]}</strong>.' Can you explain what that means in your own words? Can you think of another way to use that word?"
                      </p>
                      <p className="text-xs text-gray-600 italic">
                        → Builds vocabulary by connecting new words to prior knowledge
                      </p>
                    </div>
                  )}
                  
                  {/* Universal Question 4: Emotional Understanding */}
                  <div className="bg-white p-4 rounded-lg border-l-4 border-green-500 shadow-sm hover:shadow-md transition-shadow">
                    <p className="font-semibold text-green-900 mb-2">
                      🎭 "How do you think the characters felt during the story? Have you ever felt that way about something?"
                    </p>
                    <p className="text-xs text-gray-600 italic">
                      → Develops emotional intelligence and empathy
                    </p>
                  </div>
                  
                  {/* Universal Question 5: Prediction & Extension */}
                  <div className="bg-white p-4 rounded-lg border-l-4 border-orange-500 shadow-sm hover:shadow-md transition-shadow">
                    <p className="font-semibold text-orange-900 mb-2">
                      🔮 "If the story continued, what do you think would happen next? What would you want to happen?"
                    </p>
                    <p className="text-xs text-gray-600 italic">
                      → Sparks creativity and predictive thinking
                    </p>
                  </div>
                  
                  {/* Universal Question 6: Problem-Solving */}
                  <div className="bg-white p-4 rounded-lg border-l-4 border-teal-500 shadow-sm hover:shadow-md transition-shadow">
                    <p className="font-semibold text-teal-900 mb-2">
                      🤔 "Was there a problem or challenge in the story? How was it solved? Would you have done anything differently?"
                    </p>
                    <p className="text-xs text-gray-600 italic">
                      → Encourages critical thinking and alternative perspectives
                    </p>
                  </div>
                  
                  {/* Universal Question 7: Personal Connection */}
                  <div className="bg-white p-4 rounded-lg border-l-4 border-indigo-500 shadow-sm hover:shadow-md transition-shadow">
                    <p className="font-semibold text-indigo-900 mb-2">
                      🌟 "Does this story remind you of anything from your own life? Any experiences, people, or places?"
                    </p>
                    <p className="text-xs text-gray-600 italic">
                      → Builds text-to-self connections that deepen comprehension
                    </p>
                  </div>
                </div>
              </div>

              {/* Reading Performance Summary */}
              {(currentReading.questionsAnswered > 0) && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-lg border-2 border-green-200">
                  <p className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Reading Performance This Session:
                  </p>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="bg-white p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {currentReading.questionsCorrect || 0}/{currentReading.questionsAnswered || 0}
                      </p>
                      <p className="text-xs text-gray-600">Questions Correct</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {currentReading.questionsAnswered > 0 
                          ? Math.round((currentReading.questionsCorrect / currentReading.questionsAnswered) * 100) 
                          : 0}%
                      </p>
                      <p className="text-xs text-gray-600">Comprehension</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Parent Tips */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-5 rounded-lg border-2 border-blue-200">
                <p className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  💡 Parent Tips for Effective Conversations:
                </p>
                <ul className="text-sm text-blue-800 leading-relaxed space-y-2 ml-1">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">•</span>
                    <span><strong>Follow their lead:</strong> Let your child talk more than you do. Show genuine curiosity about their thoughts.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">•</span>
                    <span><strong>No "yes/no" questions:</strong> Use "how," "why," and "what" to encourage detailed responses.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">•</span>
                    <span><strong>Build on their answers:</strong> Ask follow-up questions like "Tell me more about that" or "What made you think of that?"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">•</span>
                    <span><strong>Keep it relaxed:</strong> This isn't a test—it's quality time that naturally strengthens reading comprehension and your relationship.</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards - Reorganized */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card className="border-2 shadow-lg">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Words Read (2 weeks)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">
              {metrics?.totalWordsRead.toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-lg">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Questions Answered (2 weeks)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {metrics?.totalQuestionsAnswered || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-lg">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              Accuracy (2 weeks)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">
              {accuracyPercentage}%
            </p>
          </CardContent>
        </Card>
      </div>

      {familyChallenge && (
        <Card className="border-2 shadow-lg mb-8 bg-gradient-to-r from-emerald-50 to-cyan-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-900">
              <Target className="w-5 h-5" />
              {familyChallenge.title}
            </CardTitle>
            <CardDescription>{familyChallenge.note}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2 text-sm text-slate-700">
                <span>Family progress</span>
                <span className="font-semibold">{familyChallenge.progressLabel}</span>
              </div>
              <Progress value={(familyChallenge.progress / familyChallenge.goal) * 100} className="h-3" />
            </div>

            {linkedChildren.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {linkedChildren.map((child) => (
                  <div key={child.id} className="rounded-lg border border-emerald-200 bg-white p-4">
                    <p className="font-semibold text-slate-900">{child.name}</p>
                    <p className="text-xs text-slate-500 mt-1">Lexile {child.lexileLevel} · {child.storyLanguage}</p>
                    <p className="text-sm text-emerald-700 mt-2 font-medium">{child.minutesRead} reading minutes</p>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Accuracy by Story Line Chart */}
      <Card className="border-2 shadow-lg mb-8">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Accuracy by Story
          </CardTitle>
          <CardDescription>
            Comprehension performance across reading levels
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {readingHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={prepareChartData()} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value) => `${value}%`}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }}
                />
                <Legend />
                {Array.from(new Set(readingHistory.map(s => s.lexileLevel))).map((lexile) => (
                  <Line
                    key={lexile}
                    type="monotone"
                    dataKey={lexile}
                    stroke={getLineChartColor(lexile)}
                    strokeWidth={3}
                    dot={{ fill: getLineChartColor(lexile), r: 5 }}
                    activeDot={{ r: 7 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No reading history yet</p>
            </div>
          )}
        </CardContent>
      </Card>
      {diagnostic && (
        <Card className="border-2 shadow-lg mb-8">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardTitle>Diagnostic Report Card</CardTitle>
            <CardDescription>
              Results from onboarding diagnostic tailored by grade and interests
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="p-4 bg-white rounded-lg border">
                <p className="text-xs text-gray-600 mb-1">Starting Lexile</p>
                <p className="text-xl font-bold text-gray-800">{diagnostic.startingLexile}L</p>
              </div>
              <div className="p-4 bg-white rounded-lg border">
                <p className="text-xs text-gray-600 mb-1">Diagnostic Accuracy</p>
                <p className="text-xl font-bold text-indigo-600">{diagnostic.scorePercentage}%</p>
              </div>
              <div className="p-4 bg-white rounded-lg border">
                <p className="text-xs text-gray-600 mb-1">Current Lexile</p>
                <p className="text-xl font-bold text-purple-700">{profile.lexileLevel}L</p>
              </div>
              <div className="p-4 bg-white rounded-lg border">
                <p className="text-xs text-gray-600 mb-1">Recommended Next Band</p>
                <p className="text-xl font-bold text-blue-700">{diagnosticNextBand}L</p>
              </div>
            </div>

            {Array.isArray(diagnostic.byPassage) && diagnostic.byPassage.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Passage-by-passage performance</p>
                <div className="space-y-3">
                  {diagnostic.byPassage.map((item: any, idx: number) => (
                    <div key={item.passageId} className="p-4 rounded-lg border bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-gray-800">Passage {idx + 1}</p>
                        <p className="text-sm text-gray-600">{item.correct}/{item.questions} correct</p>
                      </div>
                      <Progress value={item.accuracy} className="h-2 mb-1" />
                      <p className="text-xs text-gray-600">Accuracy: {item.accuracy}%</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reading History with Summaries & Discussion Questions */}
      <Card className="border-2 shadow-lg mb-8">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Reading History
          </CardTitle>
          <CardDescription>
            Stories completed and discussion questions for parent-child bonding
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {readingHistory.length > 0 ? (
            <div className="space-y-4">
              {readingHistory.map((story) => (
                <div key={story.id} className="border-2 border-gray-200 rounded-lg overflow-hidden hover:border-green-300 transition-colors">
                  {/* Story Header - Always Visible */}
                  <button
                    onClick={() => toggleStoryExpanded(story.id)}
                    className="w-full p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-green-50 hover:to-emerald-50 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 text-left">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{story.title}</h3>
                        <p className="text-xs text-gray-600 mt-1">
                          {story.dateRead} • {story.wordsRead} words • Lexile {story.lexileLevel}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-purple-600">{story.accuracy}%</p>
                        <p className="text-xs text-gray-600">Accuracy</p>
                      </div>
                      {expandedStories.has(story.id) ? (
                        <ChevronUp className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {expandedStories.has(story.id) && (
                    <div className="bg-white border-t-2 border-gray-200 p-6 space-y-6">
                      {/* Summary Section */}
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-green-600" />
                          Summary
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed bg-green-50 p-4 rounded-lg border border-green-200">
                          {story.summary}
                        </p>
                      </div>

                      {/* Performance Stats */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-center">
                          <p className="text-lg font-bold text-blue-600">{story.questionsCorrect}/{story.questionsAnswered}</p>
                          <p className="text-xs text-gray-600">Questions Correct</p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 text-center">
                          <p className="text-lg font-bold text-purple-600">{story.accuracy}%</p>
                          <p className="text-xs text-gray-600">Accuracy</p>
                        </div>
                        <div className="bg-orange-50 p-3 rounded-lg border border-orange-200 text-center">
                          <p className="text-lg font-bold text-orange-600">{story.wordsRead}</p>
                          <p className="text-xs text-gray-600">Words Read</p>
                        </div>
                      </div>

                      {/* Discussion Questions */}
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-purple-600" />
                          Discussion Questions for Parent & Child
                        </h4>
                        <p className="text-xs text-gray-600 mb-3 italic bg-purple-50 p-3 rounded-lg border border-purple-200">
                          💬 Use these questions to have meaningful conversations about the story. Let your child lead—there are no wrong answers! This is quality bonding time that strengthens comprehension and your relationship.
                        </p>
                        <div className="space-y-3">
                          {story.discussionQuestions.map((question, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-lg border-l-4 border-purple-500 shadow-sm hover:shadow-md transition-shadow">
                              <p className="font-semibold text-gray-800 text-sm">
                                {question}
                              </p>
                              <p className="text-xs text-gray-600 mt-2 italic">
                                → Ask follow-up questions like "Tell me more about that" or "How did that make you feel?"
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Parent Tips */}
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border-2 border-blue-200">
                        <p className="text-xs font-semibold text-blue-900 mb-2 flex items-center gap-2">
                          <Lightbulb className="w-4 h-4" />
                          💡 Tips for This Conversation:
                        </p>
                        <ul className="text-xs text-blue-800 space-y-1 ml-1">
                          <li>• <strong>Follow their lead:</strong> Let them talk more than you do</li>
                          <li>• <strong>Ask "how" and "why"</strong> instead of yes/no questions</li>
                          <li>• <strong>Listen actively:</strong> Show genuine interest in their thoughts</li>
                          <li>• <strong>Make it fun:</strong> This is about connection, not testing</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg text-gray-600 mb-2">No reading history yet</p>
              <p className="text-sm text-gray-500">Stories will appear here as your child completes them</p>
            </div>
          )}
        </CardContent>
      </Card>
      {profile && (
        <Card className="border-2 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50">
            <div className="flex items-center justify-between">
              <CardTitle>Student Profile</CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-400 transition-colors"
                onClick={() => setShowLexileChart(true)}
              >
                <Info className="w-4 h-4" />
                What is Lexile?
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Name</p>
                <p className="text-lg font-semibold text-gray-800">{profile.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Grade</p>
                <p className="text-lg font-semibold text-gray-800">Grade {profile.grade}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Current Reading Level</p>
                <div className="flex items-center gap-2">
                  <Badge className="text-base px-3 py-1 bg-purple-500">
                    {profile.lexileLevel}L
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Interests</p>
                <div className="flex flex-wrap gap-2">
                  {profile.interests?.slice(0, 5).map((interest: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Story Language</p>
                <p className="text-lg font-semibold text-gray-800">{profile.storyLanguage || profile.homeLanguage || 'English'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Home Book Recommendations */}
      <Card className="border-2 shadow-lg mt-8 mb-8">
        <CardHeader className="bg-gradient-to-r from-violet-50 to-pink-50">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-600" />
            Teacher Recommended Books for Home
          </CardTitle>
          <CardDescription>
            Purchase ideas ranked from teacher picks plus each child&apos;s Lexile level, interests, and family setup
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {homeRecommendations.map((book) => (
              <div key={book.id} className="rounded-xl border border-violet-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <Badge className="bg-slate-900 text-white">{book.teacherName}</Badge>
                  <Badge variant="outline" className="font-semibold">{book.lexile}</Badge>
                </div>
                {book.childName ? (
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-2">
                    Great for {book.childName}
                  </p>
                ) : null}
                <h3 className="text-xl font-bold text-slate-900 leading-tight">{book.title}</h3>
                <p className="text-sm text-slate-500 mb-2">{book.author}</p>
                <p className="text-sm text-violet-700 italic mb-4">{book.note}</p>
                {book.fitReason ? (
                  <p className="text-xs text-slate-500 mb-4">{book.fitReason}</p>
                ) : null}
                <Button
                  className="w-full bg-slate-900 hover:bg-slate-800"
                  onClick={() => window.open(getAmazonUsedLink(book.amazonQuery), "_blank", "noopener,noreferrer")}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Buy Used on Amazon
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lexile Chart Modal */}
      {showLexileChart && profile && (
        <LexileChartModal
          onClose={() => setShowLexileChart(false)}
          childName={profile.name}
          currentLevel={profile.lexileLevel}
        />
      )}
    </div>
  );
}