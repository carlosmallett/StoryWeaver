import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Heart,
  Home,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

interface Topic {
  id: string;
  title: string;
  description: string;
  category: "fiction" | "non-fiction";
  isNew?: boolean;
  emoji: string;
  lexileLevels: string[];
  image: string;
  kicker: string;
  accent: string;
}

const TOPICS: Topic[] = [
  {
    id: "super-bowl-2026",
    title: "Super Bowl 2026 Highlights",
    description: "Read about the biggest game of the year!",
    category: "non-fiction",
    isNew: true,
    emoji: "🏈",
    lexileLevels: ["400-600", "600-800"],
    image:
      "https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=1200&q=80",
    kicker: "Sports spotlight",
    accent: "from-fuchsia-500/80 via-purple-500/40 to-slate-950/80",
  },
  {
    id: "new-movie-release",
    title: "Latest Animated Movie",
    description: "Behind the scenes of this month's blockbuster",
    category: "non-fiction",
    isNew: true,
    emoji: "🎬",
    lexileLevels: ["400-600", "600-800"],
    image:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
    kicker: "Behind the scenes",
    accent: "from-amber-500/70 via-orange-400/25 to-slate-950/75",
  },
  {
    id: "dragon-quest",
    title: "The Dragon's Quest",
    description: "A brave knight sets out on an epic adventure",
    category: "fiction",
    emoji: "🐉",
    lexileLevels: ["200-400", "400-600", "600-800"],
    image:
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=1200&q=80",
    kicker: "Epic fantasy",
    accent: "from-violet-500/85 via-fuchsia-500/40 to-indigo-950/80",
  },
  {
    id: "mystery-mansion",
    title: "Mystery at Maple Mansion",
    description: "Can you solve the mystery before it's too late?",
    category: "fiction",
    emoji: "🔍",
    lexileLevels: ["400-600", "600-800"],
    image:
      "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80",
    kicker: "Mystery",
    accent: "from-stone-500/75 via-zinc-700/30 to-slate-950/80",
  },
  {
    id: "space-explorers",
    title: "Space Explorers Unite",
    description: "Journey to distant planets and discover new worlds",
    category: "fiction",
    emoji: "🚀",
    lexileLevels: ["400-600", "600-800", "800-1000"],
    image:
      "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=80",
    kicker: "Sci-fi adventure",
    accent: "from-slate-700/75 via-indigo-600/20 to-black/85",
  },
  {
    id: "forest-friends",
    title: "Friends of the Forest",
    description: "Animals work together to save their home",
    category: "fiction",
    emoji: "🌲",
    lexileLevels: ["200-400", "400-600"],
    image:
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80",
    kicker: "Nature tale",
    accent: "from-emerald-500/70 via-lime-400/20 to-slate-950/75",
  },
  {
    id: "time-travelers",
    title: "The Time Travelers",
    description: "Travel through history and meet famous people",
    category: "fiction",
    emoji: "⏰",
    lexileLevels: ["600-800", "800-1000"],
    image:
      "https://images.unsplash.com/photo-1501139083538-0139583c060f?auto=format&fit=crop&w=1200&q=80",
    kicker: "Time jump",
    accent: "from-cyan-500/75 via-sky-400/15 to-slate-950/80",
  },
  {
    id: "underwater-adventure",
    title: "Underwater Adventure",
    description: "Dive deep and discover ocean secrets",
    category: "fiction",
    emoji: "🌊",
    lexileLevels: ["400-600", "600-800"],
    image:
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80",
    kicker: "Ocean quest",
    accent: "from-cyan-500/75 via-blue-500/20 to-slate-950/85",
  },
  {
    id: "dinosaur-discovery",
    title: "Discovering Dinosaurs",
    description: "Learn about the giants that once roamed Earth",
    category: "non-fiction",
    emoji: "🦕",
    lexileLevels: ["200-400", "400-600", "600-800"],
    image:
      "https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?auto=format&fit=crop&w=1200&q=80",
    kicker: "History of life",
    accent: "from-amber-600/80 via-orange-500/25 to-stone-950/80",
  },
  {
    id: "space-science",
    title: "Exploring Our Solar System",
    description: "Journey through space and learn about planets",
    category: "non-fiction",
    emoji: "🪐",
    lexileLevels: ["400-600", "600-800", "800-1000"],
    image:
      "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200&q=80",
    kicker: "Space science",
    accent: "from-indigo-600/80 via-violet-500/20 to-black/85",
  },
  {
    id: "animal-habitats",
    title: "Amazing Animal Habitats",
    description: "Where do animals live and why?",
    category: "non-fiction",
    emoji: "🦁",
    lexileLevels: ["200-400", "400-600"],
    image:
      "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80",
    kicker: "Wildlife",
    accent: "from-lime-500/70 via-emerald-400/20 to-slate-950/75",
  },
  {
    id: "ancient-egypt",
    title: "Ancient Egypt",
    description: "Pyramids, pharaohs, and fascinating history",
    category: "non-fiction",
    emoji: "🏛️",
    lexileLevels: ["600-800", "800-1000"],
    image:
      "https://images.unsplash.com/photo-1539768942893-daf53e448371?auto=format&fit=crop&w=1200&q=80",
    kicker: "Ancient world",
    accent: "from-yellow-500/75 via-amber-400/20 to-stone-950/85",
  },
  {
    id: "weather-science",
    title: "How Weather Works",
    description: "From rainbows to thunderstorms",
    category: "non-fiction",
    emoji: "⛈️",
    lexileLevels: ["400-600", "600-800"],
    image:
      "https://images.unsplash.com/photo-1500674425229-f692875b0ab7?auto=format&fit=crop&w=1200&q=80",
    kicker: "Weather lab",
    accent: "from-sky-500/75 via-cyan-400/15 to-slate-950/80",
  },
  {
    id: "sports-champions",
    title: "Sports Champions",
    description: "Stories of amazing athletes and their achievements",
    category: "non-fiction",
    emoji: "🏆",
    lexileLevels: ["400-600", "600-800"],
    image:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80",
    kicker: "Athlete focus",
    accent: "from-orange-500/75 via-red-500/20 to-slate-950/80",
  },
];

const FAVORITES_STORAGE_KEY = "storyweaver-favorite-topics";

export function LibraryPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const profileData = localStorage.getItem("userProfile");
    if (profileData) {
      setProfile(JSON.parse(profileData));
    }

    const savedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch {
        setFavorites([]);
      }
    }
  }, []);

  const featuredInterest = profile?.interestIds?.[0] || profile?.interests?.[0] || "reading";
  const profileKeywords = (profile?.interests || []).map((keyword: string) => keyword.toLowerCase());
  const profileLexile = profile?.lexileLevel;

  const scoreTopic = (topic: Topic) => {
    const haystack = `${topic.title} ${topic.description} ${topic.kicker} ${topic.emoji}`.toLowerCase();
    const interestScore = profileKeywords.reduce((score: number, keyword: string) => {
      return haystack.includes(keyword) ? score + 3 : score;
    }, 0);
    const lexileScore = profileLexile && topic.lexileLevels.includes(profileLexile) ? 2 : 0;
    const noveltyScore = topic.isNew ? 1 : 0;
    return interestScore + lexileScore + noveltyScore;
  };

  const personalizedTopics = [...TOPICS].sort((a, b) => scoreTopic(b) - scoreTopic(a));
  const lexileMatched = profileLexile
    ? personalizedTopics.filter((topic) => topic.lexileLevels.includes(profileLexile))
    : personalizedTopics;
  const curatedTopics = lexileMatched.length >= 6 ? lexileMatched : personalizedTopics;
  const newTopics = curatedTopics.slice(0, 3);
  const storyTopics = curatedTopics.slice(3).length > 0 ? curatedTopics.slice(3) : curatedTopics;
  const fictionTopics = storyTopics.filter((topic) => topic.category === "fiction");
  const nonFictionTopics = storyTopics.filter((topic) => topic.category === "non-fiction");
  const favoriteTopics = curatedTopics.filter((topic) => favorites.includes(topic.id));

  const handleTopicSelect = (topicId: string) => {
    const selectedTopic = curatedTopics.find((topic) => topic.id === topicId);
    if (selectedTopic) {
      localStorage.setItem("selectedTopic", JSON.stringify(selectedTopic));
    }
    navigate(`/read/${topicId}`);
  };

  const toggleFavorite = (topicId: string) => {
    setFavorites((current) => {
      const next = current.includes(topicId)
        ? current.filter((id) => id !== topicId)
        : [...current, topicId];
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(141,87,255,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(255,170,107,0.18),_transparent_30%),linear-gradient(180deg,_#fff8fb_0%,_#fff7ef_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="mb-8 rounded-[2rem] border border-white/70 bg-white/65 p-5 shadow-[0_24px_70px_rgba(236,72,153,0.08)] backdrop-blur md:p-7">
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-200">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-violet-500">StoryWeaver</p>
                  <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">Story Library</h1>
                </div>
              </div>

              <p className="max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                Fresh reads, bold covers, and hand-picked adventures built around {featuredInterest}.
                {profile ? ` Welcome back, ${profile.name}.` : ""}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                {profile?.lexileLevel ? (
                  <Badge className="rounded-full bg-violet-600 px-4 py-2 text-sm text-white">
                    Reading level {profile.lexileLevel}L
                  </Badge>
                ) : null}
                <Badge
                  variant="outline"
                  className="rounded-full border-orange-200 bg-orange-50 px-4 py-2 text-sm text-orange-700"
                >
                  {favorites.length} favorite{favorites.length === 1 ? "" : "s"} saved
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 self-start">
              <Button variant="outline" className="rounded-full bg-white/80" onClick={() => navigate("/quiz")}>
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
              <Button variant="outline" className="rounded-full bg-white/80" onClick={() => navigate("/book-club")}>
                <Users className="mr-2 h-4 w-4" />
                Book Club
              </Button>
              <Button variant="outline" className="rounded-full bg-white/80" onClick={() => navigate("/dashboard")}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Progress
              </Button>
            </div>
          </div>

          {newTopics.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                <h2 className="text-2xl font-bold text-slate-900">
                  This Week in {String(featuredInterest).replace(/(^.|\s.)/g, (match: string) => match.toUpperCase())}
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {newTopics.map((topic) => (
                  <FeatureTile
                    key={topic.id}
                    topic={topic}
                    isFavorite={favorites.includes(topic.id)}
                    onSelect={handleTopicSelect}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/70 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur md:p-6">
          <Tabs defaultValue="all" className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <TabsList className="grid w-full grid-cols-4 rounded-full bg-slate-100/90 p-1 lg:max-w-2xl">
                <TabsTrigger value="all" className="rounded-full">All Stories</TabsTrigger>
                <TabsTrigger value="favorites" className="rounded-full">Favorites</TabsTrigger>
                <TabsTrigger value="fiction" className="rounded-full">Fiction</TabsTrigger>
                <TabsTrigger value="non-fiction" className="rounded-full">Non-Fiction</TabsTrigger>
              </TabsList>
              <p className="text-sm text-slate-500">Tap the heart to build a shelf of favorites.</p>
            </div>

            <TabsContent value="all">
              <StoryGrid
                topics={storyTopics}
                favorites={favorites}
                onSelect={handleTopicSelect}
                onToggleFavorite={toggleFavorite}
              />
            </TabsContent>

            <TabsContent value="favorites">
              <StoryGrid
                topics={favoriteTopics}
                favorites={favorites}
                onSelect={handleTopicSelect}
                onToggleFavorite={toggleFavorite}
                emptyMessage="No favorites yet. Tap the heart on any cover to save it here."
              />
            </TabsContent>

            <TabsContent value="fiction">
              <StoryGrid
                topics={fictionTopics}
                favorites={favorites}
                onSelect={handleTopicSelect}
                onToggleFavorite={toggleFavorite}
              />
            </TabsContent>

            <TabsContent value="non-fiction">
              <StoryGrid
                topics={nonFictionTopics}
                favorites={favorites}
                onSelect={handleTopicSelect}
                onToggleFavorite={toggleFavorite}
              />
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </div>
  );
}

function StoryGrid({
  topics,
  favorites,
  onSelect,
  onToggleFavorite,
  emptyMessage = "No stories found in this shelf yet.",
}: {
  topics: Topic[];
  favorites: string[];
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  emptyMessage?: string;
}) {
  if (topics.length === 0) {
    return (
      <Card className="rounded-[1.75rem] border-dashed border-slate-200 bg-slate-50/80">
        <CardContent className="flex min-h-52 flex-col items-center justify-center gap-3 text-center">
          <Heart className="h-8 w-8 text-slate-300" />
          <p className="text-lg font-semibold text-slate-700">Shelf is empty</p>
          <p className="max-w-md text-sm text-slate-500">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {topics.map((topic, index) => (
        <TopicCard
          key={topic.id}
          topic={topic}
          featured={index === 0}
          isFavorite={favorites.includes(topic.id)}
          onSelect={onSelect}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}

function FeatureTile({
  topic,
  isFavorite,
  onSelect,
  onToggleFavorite,
}: {
  topic: Topic;
  isFavorite: boolean;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}) {
  return (
    <Card
      className="group relative overflow-hidden rounded-[1.6rem] border-0 text-white shadow-[0_18px_50px_rgba(15,23,42,0.18)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(15,23,42,0.22)]"
      onClick={() => onSelect(topic.id)}
    >
      <div className="relative h-[17rem]">
        <ImageWithFallback
          src={topic.image}
          alt={topic.title}
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${topic.accent}`} />
        <div className="absolute inset-0 bg-black/10" />

        <button
          type="button"
          aria-label={isFavorite ? `Remove ${topic.title} from favorites` : `Add ${topic.title} to favorites`}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-rose-500 shadow-lg transition hover:scale-105"
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite(topic.id);
          }}
        >
          <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
        </button>

        <div className="absolute inset-x-0 bottom-0 z-10 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Badge className="rounded-full bg-white/18 px-3 py-1 text-white backdrop-blur">{topic.kicker}</Badge>
          </div>
          <h3 className="max-w-xs text-2xl font-black leading-tight drop-shadow-sm">{topic.title}</h3>
          <p className="mt-2 max-w-sm text-sm text-white/85">{topic.description}</p>
        </div>
      </div>
    </Card>
  );
}

function TopicCard({
  topic,
  featured,
  isFavorite,
  onSelect,
  onToggleFavorite,
}: {
  topic: Topic;
  featured?: boolean;
  isFavorite: boolean;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}) {
  return (
    <Card
      className={`group relative overflow-hidden rounded-[1.7rem] border-0 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.10)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_60px_rgba(15,23,42,0.16)] ${featured ? "md:col-span-2 xl:col-span-1" : ""}`}
      onClick={() => onSelect(topic.id)}
    >
      <div className="relative h-72">
        <ImageWithFallback
          src={topic.image}
          alt={topic.title}
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${topic.accent}`} />
        <div className="absolute inset-0 bg-black/10" />

        <button
          type="button"
          aria-label={isFavorite ? `Remove ${topic.title} from favorites` : `Add ${topic.title} to favorites`}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/96 text-rose-500 shadow-lg transition hover:scale-105"
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite(topic.id);
          }}
        >
          <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
        </button>

        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-4">
          <Badge className="rounded-full bg-white/14 px-3 py-1 text-white capitalize backdrop-blur">
            {topic.category}
          </Badge>
          <Badge className="rounded-full bg-black/25 px-3 py-1 text-white backdrop-blur">
            {topic.lexileLevels[0]}+
          </Badge>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 p-5 text-white">
          <div className="mb-3 flex items-center gap-2 text-sm text-white/80">
            <span className="text-lg">{topic.emoji}</span>
            <span className="font-semibold uppercase tracking-[0.2em]">{topic.kicker}</span>
          </div>
          <h3 className="text-3xl font-black leading-tight drop-shadow-sm">{topic.title}</h3>
          <p className="mt-2 max-w-sm text-sm leading-6 text-white/85">{topic.description}</p>
          <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-white">
            <Sparkles className="h-4 w-4" />
            <span>Open story</span>
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
      </div>
      <CardContent className="hidden" />
    </Card>
  );
}
