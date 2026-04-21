import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { BookOpen, Sparkles, ArrowRight } from "lucide-react";
import { mcpStorageMSetLocal } from "../utils/mcpStorage";

type LexileBand = "200-400" | "400-600" | "600-800" | "800-1000";

interface InterestCategory {
  id: string;
  label: string;
  keywords: string[];
  theme: {
    place: string;
    activity: string;
    tool: string;
    goal: string;
    challenge: string;
    discovery: string;
  };
}

interface DiagnosticPassage {
  id: number;
  text: string;
}

interface DiagnosticQuestion {
  passageId: number;
  question: string;
  options: string[];
  correct: number;
  difficulty: "easy" | "medium" | "hard";
}

interface DiagnosticSet {
  passages: DiagnosticPassage[];
  questions: DiagnosticQuestion[];
}

const INTEREST_CATEGORIES: InterestCategory[] = [
  {
    id: "adventure",
    label: "🗺️ Adventures & Exploration",
    keywords: ["adventure", "explore", "quest", "journey"],
    theme: {
      place: "a mountain trail",
      activity: "mapping a route",
      tool: "a compass",
      goal: "find an old lookout point",
      challenge: "thick fog on the path",
      discovery: "a hidden stone marker",
    },
  },
  {
    id: "animals",
    label: "🦁 Animals & Nature",
    keywords: ["animals", "wildlife", "nature", "environment"],
    theme: {
      place: "a wildlife reserve",
      activity: "tracking animal footprints",
      tool: "a field journal",
      goal: "observe nesting behaviors",
      challenge: "a sudden rain shower",
      discovery: "fresh owl tracks near a tree",
    },
  },
  {
    id: "science",
    label: "🔬 Science & Discovery",
    keywords: ["science", "space", "technology", "experiments"],
    theme: {
      place: "the school science lab",
      activity: "testing simple reactions",
      tool: "a microscope",
      goal: "record accurate observations",
      challenge: "a result that did not match expectations",
      discovery: "a pattern in repeated trials",
    },
  },
  {
    id: "sports",
    label: "⚽ Sports & Games",
    keywords: ["sports", "games", "competition", "team"],
    theme: {
      place: "the practice field",
      activity: "timing sprint drills",
      tool: "a stopwatch",
      goal: "improve team performance",
      challenge: "strong wind slowing passes",
      discovery: "a better passing strategy",
    },
  },
  {
    id: "fantasy",
    label: "🏰 Fantasy & Magic",
    keywords: ["fantasy", "magic", "dragons", "wizards"],
    theme: {
      place: "an ancient library tower",
      activity: "decoding enchanted maps",
      tool: "a glowing crystal",
      goal: "unlock a forgotten room",
      challenge: "a tricky riddle gate",
      discovery: "symbols that lit up in sequence",
    },
  },
  {
    id: "history",
    label: "📜 History & Culture",
    keywords: ["history", "ancient", "culture", "civilizations"],
    theme: {
      place: "a local history museum",
      activity: "studying old artifacts",
      tool: "a timeline chart",
      goal: "connect events across centuries",
      challenge: "missing dates in the records",
      discovery: "a clue hidden in an inscription",
    },
  },
  {
    id: "friendship",
    label: "👥 Friendship & Family",
    keywords: ["friendship", "family", "relationships", "kindness"],
    theme: {
      place: "a neighborhood community center",
      activity: "planning a team project",
      tool: "a shared checklist",
      goal: "help younger students after school",
      challenge: "different ideas causing disagreement",
      discovery: "a plan that combined everyone's strengths",
    },
  },
  {
    id: "mystery",
    label: "🔍 Mysteries & Puzzles",
    keywords: ["mystery", "detective", "clues", "solve"],
    theme: {
      place: "an old town library",
      activity: "following a trail of clues",
      tool: "a magnifying glass",
      goal: "solve a missing-book puzzle",
      challenge: "misleading clues in the hallway",
      discovery: "a coded note inside a catalog drawer",
    },
  },
];

const LEXILE_LEVELS: LexileBand[] = ["200-400", "400-600", "600-800", "800-1000"];

const STARTING_LEXILE_BY_GRADE: Record<number, LexileBand> = {
  1: "200-400",
  2: "200-400",
  3: "400-600",
  4: "600-800",
  5: "800-1000",
};

const COMMON_LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "Mandarin Chinese",
  "Arabic",
  "Hindi",
  "Portuguese",
  "Haitian Creole",
];

const UNKNOWN_ANSWER_VALUE = -1;

interface TutorialCardContent {
  title: string;
  description: string;
  tip: string;
  emoji: string;
  cta: string;
}

function getInterestCategoryById(id: string): InterestCategory {
  return INTEREST_CATEGORIES.find((category) => category.id === id) ?? INTEREST_CATEGORIES[0];
}

function getComplexityTier(grade: number): "early" | "middle" | "advanced" {
  if (grade <= 2) return "early";
  if (grade <= 4) return "middle";
  return "advanced";
}

function getQuestionOrderByGrade(grade: number): number[] {
  const sequenceByGrade: Record<number, number[]> = {
    1: [0, 1, 3, 4, 8, 9],
    2: [0, 1, 2, 3, 4, 5, 8, 9],
    3: [0, 1, 2, 3, 4, 5, 8, 9, 6, 10],
    4: [0, 1, 2, 3, 4, 5, 8, 9, 6, 7, 10],
    5: [0, 1, 2, 3, 4, 5, 8, 9, 6, 7, 10, 11],
  };

  return sequenceByGrade[grade] ?? sequenceByGrade[3];
}

function getTutorialCardForQuestion(questionIndex: number, questions: DiagnosticQuestion[]): TutorialCardContent | null {
  if (questionIndex === 0) {
    return {
      title: "How this check-in works",
      description: "Read the passage part, then pick the best answer. It starts easy and gets harder slowly.",
      tip: "You can choose 'I don't know / I don't remember yet' and keep going.",
      emoji: "🧭",
      cta: "Start",
    };
  }

  const current = questions[questionIndex];
  const previous = questions[questionIndex - 1];

  if (current && previous && current.passageId !== previous.passageId) {
    return {
      title: "Next story part",
      description: "Nice work. You are moving to the next passage part.",
      tip: "Read first, then answer using clue words.",
      emoji: "📖",
      cta: "Open Next Part",
    };
  }

  if (questionIndex % 3 === 0) {
    return {
      title: "Quick reminder",
      description: "This is low-stakes practice. Take your time and do your best.",
      tip: "If two answers seem close, choose the one supported by the text.",
      emoji: "✨",
      cta: "Continue",
    };
  }

  return null;
}

function buildDiagnosticSet(grade: number, primaryInterestId: string): DiagnosticSet {
  const interest = getInterestCategoryById(primaryInterestId);
  const tier = getComplexityTier(grade);

  const passages: DiagnosticPassage[] = [
    {
      id: 0,
      text:
        tier === "early"
          ? `On Tuesday, our class visited ${interest.theme.place}. We practiced ${interest.theme.activity}. I carried ${interest.theme.tool} and wrote short notes. Our goal was to ${interest.theme.goal}. Then we faced ${interest.theme.challenge}. We stayed calm and helped each other. At the end, we found ${interest.theme.discovery}.`
          : tier === "middle"
            ? `Our class spent the afternoon at ${interest.theme.place}, where we focused on ${interest.theme.activity}. Using ${interest.theme.tool}, we recorded details so we could check our work later. The team wanted to ${interest.theme.goal}, but ${interest.theme.challenge} made progress slower than expected. Instead of quitting, we adjusted our plan and compared evidence. By the final checkpoint, we identified ${interest.theme.discovery}, which confirmed we were heading in the right direction.`
            : `During a structured field session at ${interest.theme.place}, we concentrated on ${interest.theme.activity}. I relied on ${interest.theme.tool} to capture precise observations while our group attempted to ${interest.theme.goal}. Midway through, ${interest.theme.challenge} disrupted our timeline and forced us to reevaluate assumptions. After debating alternatives and revisiting our notes, we uncovered ${interest.theme.discovery}. That finding strengthened our conclusion and demonstrated the value of persistence under uncertainty.`,
    },
    {
      id: 1,
      text:
        tier === "early"
          ? `The next day, we met again to share ideas. First, we read our notes out loud. Next, we made a big chart. We wanted to explain what we learned at ${interest.theme.place}. Some classmates had different answers. We used our notes and ${interest.theme.tool} to check facts. At last, everyone agreed on the best explanation.`
          : tier === "middle"
            ? `The following session was dedicated to analysis. We reviewed our notes from ${interest.theme.place} and organized them into a chart so patterns were easier to spot. Although several classmates interpreted the data differently, we used evidence from ${interest.theme.tool} to justify each claim. As we compared explanations, we noticed which ideas were strongly supported and which depended on guesses. By the end, we agreed on a clearer interpretation.`
            : `In the debrief, our team synthesized evidence gathered at ${interest.theme.place} and transformed scattered observations into a coherent model. Competing interpretations surfaced immediately, particularly around whether ${interest.theme.discovery} was a coincidence or a meaningful signal. To evaluate those claims, we cross-referenced entries captured with ${interest.theme.tool} and challenged unsupported assumptions. This process narrowed the argument to the most defensible explanation and sharpened our final reasoning.`,
    },
    {
      id: 2,
      text:
        tier === "early"
          ? `At the end of the week, we taught another class what we learned. I explained how ${interest.theme.challenge} made the task hard at first. My partner showed pictures and read our chart. We told them why ${interest.theme.discovery} was important. The younger students asked good questions, and we answered with examples. Teaching others helped me understand the topic even better.`
          : tier === "middle"
            ? `At the end of the week, our group presented what we had learned to younger students. I explained how ${interest.theme.challenge} changed our strategy and why we needed to revise our first plan. My partner shared visuals while I described why ${interest.theme.discovery} mattered to our final conclusion. The audience asked thoughtful questions, so we responded with specific examples from our notes. Presenting the process helped us understand the topic more deeply.`
            : `By week's end, we converted our findings into a short seminar for younger classes. I outlined how ${interest.theme.challenge} exposed weaknesses in our initial approach and why strategic revision was essential. My partner contextualized ${interest.theme.discovery}, showing how that evidence influenced our final claim. Audience questions required us to defend decisions with precise references, not broad summaries. The teaching experience reinforced both conceptual understanding and communication discipline.`,
    },
  ];

  const allQuestions: DiagnosticQuestion[] = [
    {
      passageId: 0,
      question: "Where did the class activity take place?",
      options: ["At a shopping mall", `At ${interest.theme.place}`, "At a movie theater", "At a beach resort"],
      correct: 1,
      difficulty: "easy",
    },
    {
      passageId: 0,
      question: "What tool did the student use?",
      options: [interest.theme.tool, "A video game controller", "A musical instrument", "A paintbrush"],
      correct: 0,
      difficulty: "easy",
    },
    {
      passageId: 0,
      question: "What challenge did the group face?",
      options: ["No one came to class", interest.theme.challenge, "They lost the building key", "The topic was canceled"],
      correct: 1,
      difficulty: "medium",
    },
    {
      passageId: 0,
      question: "Why did the group keep notes during the activity?",
      options: ["To decorate the classroom", "To remember details and check ideas", "To count how many chairs were in class", "To avoid talking"],
      correct: 1,
      difficulty: "medium",
    },
    {
      passageId: 1,
      question: "What was the main purpose of the second session?",
      options: ["To play games", "To analyze and compare evidence", "To practice singing", "To clean the room"],
      correct: 1,
      difficulty: "easy",
    },
    {
      passageId: 1,
      question: "Why did classmates disagree at first?",
      options: ["They had no notes", "They had different interpretations", "They were absent", "They forgot the topic"],
      correct: 1,
      difficulty: "medium",
    },
    {
      passageId: 1,
      question: "How did the group decide which explanation was strongest?",
      options: ["They guessed randomly", "They voted for the funniest answer", "They used evidence from notes and tools", "They asked another class to decide"],
      correct: 2,
      difficulty: "hard",
    },
    {
      passageId: 1,
      question: "What does 'supported by evidence' mean in this context?",
      options: ["Based on facts from observations", "Based on a rumor", "Based on one opinion only", "Based on speed"],
      correct: 0,
      difficulty: "hard",
    },
    {
      passageId: 2,
      question: "Why did the group present to younger students?",
      options: ["To skip homework", "To share what they learned", "To leave class early", "To sell supplies"],
      correct: 1,
      difficulty: "easy",
    },
    {
      passageId: 2,
      question: `Why was ${interest.theme.discovery} important?`,
      options: ["It helped support their final conclusion", "It ended the school year", "It made the class shorter", "It changed the weather"],
      correct: 0,
      difficulty: "medium",
    },
    {
      passageId: 2,
      question: "What skill improved when students answered audience questions?",
      options: ["Cooking skills", "Communication and reasoning", "Drawing cartoons", "Jumping ability"],
      correct: 1,
      difficulty: "hard",
    },
    {
      passageId: 2,
      question: "Which choice best summarizes the whole diagnostic passages?",
      options: ["A team gathered evidence, revised ideas, and explained conclusions", "A class watched movies all week", "A student avoided working with others", "A project ended before it started"],
      correct: 0,
      difficulty: "hard",
    },
  ];

  const questionOrder = getQuestionOrderByGrade(grade);
  const questions = questionOrder
    .map((questionIndex) => allQuestions[questionIndex])
    .filter((question): question is DiagnosticQuestion => Boolean(question));

  return { passages, questions };
}

function calculateLexileFromDiagnostic(
  grade: number,
  startingLexile: LexileBand,
  questions: DiagnosticQuestion[],
  answers: (number | null)[],
): LexileBand {
  const weightedScores = questions.map((question, index) => {
    const answer = answers[index];
    const difficultyWeight = question.difficulty === "hard" ? 1.25 : question.difficulty === "medium" ? 1 : 0.85;
    const progressionWeight = 1 + (index / Math.max(questions.length - 1, 1)) * 0.2;
    const weight = difficultyWeight * progressionWeight;

    if (answer === null) return { earned: 0, max: weight };
    if (answer === question.correct) return { earned: weight, max: weight };
    if (answer === UNKNOWN_ANSWER_VALUE) return { earned: -0.1 * weight, max: weight };
    return { earned: 0, max: weight };
  });

  const totalEarned = weightedScores.reduce((sum, item) => sum + item.earned, 0);
  const totalPossible = weightedScores.reduce((sum, item) => sum + item.max, 0);
  const percentage = totalPossible > 0 ? Math.max(0, Math.min(100, (totalEarned / totalPossible) * 100)) : 0;
  const startIndex = LEXILE_LEVELS.indexOf(startingLexile);
  let shift = 0;

  const upwardAccelerationByGrade: Record<number, number> = {
    1: 1,
    2: 1,
    3: 2,
    4: 2,
    5: 3,
  };
  const downwardAccelerationByGrade: Record<number, number> = {
    1: 1,
    2: 1,
    3: 2,
    4: 2,
    5: 3,
  };
  const upShift = upwardAccelerationByGrade[grade] ?? 1;
  const downShift = downwardAccelerationByGrade[grade] ?? 1;

  if (percentage >= 95) shift = upShift;
  else if (percentage >= 82) shift = Math.min(1, upShift);
  else if (percentage < 35) shift = -downShift;
  else if (percentage < 52) shift = -Math.min(1, downShift);

  let targetIndex = Math.min(LEXILE_LEVELS.length - 1, Math.max(0, startIndex + shift));

  const maxByGrade: Record<number, number> = {
    1: 1,
    2: 2,
    3: 2,
    4: 3,
    5: 3,
  };

  const minByGrade: Record<number, number> = {
    1: 0,
    2: 0,
    3: 1,
    4: 1,
    5: 2,
  };

  targetIndex = Math.max(minByGrade[grade], Math.min(maxByGrade[grade], targetIndex));
  return LEXILE_LEVELS[targetIndex];
}

export function InterestQuiz() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [homeLanguage, setHomeLanguage] = useState("English");
  const [storyLanguage, setStoryLanguage] = useState("English");
  const [interests, setInterests] = useState<string[]>([]);
  const [diagnostic, setDiagnostic] = useState<DiagnosticSet | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [diagnosticComplete, setDiagnosticComplete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tutorialCard, setTutorialCard] = useState<TutorialCardContent | null>(null);

  const safeParse = <T,>(raw: string | null, fallback: T): T => {
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  };

  const gradeNumber = Number(grade || "0");
  const selectedInterestCategory = useMemo(
    () => INTEREST_CATEGORIES.find((category) => interests.includes(category.id)) ?? INTEREST_CATEGORIES[0],
    [interests],
  );

  const handleInterestToggle = (id: string) => {
    setInterests((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleDiagnosticAnswer = (answer: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentQuestion] = answer;
      return next;
    });
  };

  const startDiagnostic = () => {
    if (!gradeNumber || interests.length < 2) return;
    const built = buildDiagnosticSet(gradeNumber, selectedInterestCategory.id);
    setDiagnostic(built);
    setAnswers(Array.from({ length: built.questions.length }, () => null));
    setCurrentQuestion(0);
    setDiagnosticComplete(false);
    setTutorialCard(getTutorialCardForQuestion(0, built.questions));
    setStep(3);
  };

  const handleComplete = async () => {
    if (!diagnostic || !gradeNumber) return;
    setSaving(true);

    const startingLexile = STARTING_LEXILE_BY_GRADE[gradeNumber] ?? "400-600";
    const finalLevel = calculateLexileFromDiagnostic(gradeNumber, startingLexile, diagnostic.questions, answers);
    const selectedCategories = INTEREST_CATEGORIES.filter((category) => interests.includes(category.id));

    const correctAnswers = answers.reduce((count, answer, index) => {
      return answer !== null && answer === diagnostic.questions[index].correct ? count + 1 : count;
    }, 0);
    const questionsAnswered = answers.filter((answer) => answer !== null).length;
    const scorePercentage = questionsAnswered > 0 ? Math.round((correctAnswers / questionsAnswered) * 100) : 0;

    const byPassage = diagnostic.passages.map((passage) => {
      const passageQuestions = diagnostic.questions
        .map((question, index) => ({ question, answer: answers[index] }))
        .filter(({ question }) => question.passageId === passage.id);

      const passageCorrect = passageQuestions.reduce((count, item) => {
        return item.answer !== null && item.answer === item.question.correct ? count + 1 : count;
      }, 0);

      return {
        passageId: passage.id,
        questions: passageQuestions.length,
        correct: passageCorrect,
        accuracy: passageQuestions.length > 0 ? Math.round((passageCorrect / passageQuestions.length) * 100) : 0,
      };
    });

    const profile = {
      name,
      grade: gradeNumber,
      homeLanguage,
      storyLanguage,
      interestIds: selectedCategories.map((category) => category.id),
      interests: selectedCategories.flatMap((category) => category.keywords),
      lexileLevel: finalLevel,
      diagnostic: {
        startingLexile,
        recommendedLexile: finalLevel,
        questionsAnswered,
        totalQuestions: diagnostic.questions.length,
        correctAnswers,
        scorePercentage,
        byPassage,
      },
      createdAt: new Date().toISOString(),
    };

    const currentUserRaw = localStorage.getItem("currentUser");
    const currentUser = safeParse<{ id?: string } | null>(currentUserRaw, null);
    const profileKey = currentUser?.id ? `userProfile-${currentUser.id}` : "userProfile";

    localStorage.setItem(profileKey, JSON.stringify(profile));
    localStorage.setItem("userProfile", JSON.stringify(profile));
    await mcpStorageMSetLocal([
      { key: profileKey, value: profile },
      { key: "userProfile", value: profile },
    ]);
    setSaving(false);
    navigate("/library");
  };

  const currentQuestionData = diagnostic?.questions[currentQuestion] ?? null;
  const currentPassage =
    currentQuestionData && diagnostic
      ? diagnostic.passages.find((passage) => passage.id === currentQuestionData.passageId)
      : null;
  const currentPassageIndex =
    currentPassage && diagnostic
      ? diagnostic.passages.findIndex((passage) => passage.id === currentPassage.id)
      : 0;

  const progressPercentage = diagnostic
    ? Math.round(((currentQuestion + 1) / diagnostic.questions.length) * 100)
    : 0;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 text-center">
        <div className="mb-4 flex items-center justify-center gap-2">
          <BookOpen className="h-10 w-10 text-purple-600" />
          <h1 className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-4xl font-bold text-transparent">
            Let's Get to Know You!
          </h1>
        </div>
        <p className="text-gray-600">We use your grade + interests + a quick reading check-in to personalize your stories.</p>
      </div>

      {step === 1 ? (
        <Card className="border-2 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              About You
            </CardTitle>
            <CardDescription>Tell us a little about yourself.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base font-semibold">
                What's your name?
              </Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-12 text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">What grade are you in?</Label>
              <RadioGroup value={grade} onValueChange={setGrade}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <div key={value} className="flex items-center space-x-2">
                    <RadioGroupItem value={String(value)} id={`grade-${value}`} />
                    <Label htmlFor={`grade-${value}`} className="cursor-pointer text-lg">
                      Grade {value}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="homeLanguage" className="text-base font-semibold">
                What language is spoken most at home?
              </Label>
              <Select value={homeLanguage} onValueChange={setHomeLanguage}>
                <SelectTrigger id="homeLanguage" className="h-12 text-lg">
                  <SelectValue placeholder="Choose a home language" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_LANGUAGES.map((language) => (
                    <SelectItem key={language} value={language}>
                      {language}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="storyLanguage" className="text-base font-semibold">
                What language should StoryWeaver use for stories?
              </Label>
              <Select value={storyLanguage} onValueChange={setStoryLanguage}>
                <SelectTrigger id="storyLanguage" className="h-12 text-lg">
                  <SelectValue placeholder="Choose a story language" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_LANGUAGES.map((language) => (
                    <SelectItem key={language} value={language}>
                      {language}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-slate-500">
                We will try to generate the story, questions, and vocabulary support in this language.
              </p>
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={!name.trim() || !grade || !homeLanguage.trim() || !storyLanguage.trim()}
              className="h-12 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-lg"
            >
              Next <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card className="border-2 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              What Do You Like?
            </CardTitle>
            <CardDescription>Pick at least 2 interests so we can personalize your get-to-know-you check.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {INTEREST_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleInterestToggle(category.id)}
                  className={`rounded-lg border-2 p-4 text-left transition-all ${
                    interests.includes(category.id)
                      ? "border-purple-600 bg-purple-50 shadow-md"
                      : "border-gray-200 hover:border-purple-300"
                  }`}
                >
                  <span className="text-lg font-medium">{category.label}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="h-12 flex-1">
                Back
              </Button>
              <Button
                onClick={startDiagnostic}
                disabled={interests.length < 2}
                className="h-12 flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-lg"
              >
                Start Check-In <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === 3 && diagnostic ? (
        <Card className="border-2 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Get-to-Know-You Check ({diagnostic.questions.length} Questions)
            </CardTitle>
            <CardDescription>
              Starts at a grade-appropriate level and uses your {selectedInterestCategory.label.replace(/^\S+\s/, "").toLowerCase()} interests.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {!diagnosticComplete ? (
              <>
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <p className="text-sm font-semibold text-green-800">Low-stakes check-in</p>
                  <p className="text-xs text-green-700">No pressure. This helps us pick a comfortable starting level.</p>
                </div>

                {tutorialCard ? (
                  <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-5">
                    <div className="mb-3 flex items-center gap-3">
                      <span className="text-2xl" aria-hidden>
                        {tutorialCard.emoji}
                      </span>
                      <p className="text-lg font-bold text-cyan-900">{tutorialCard.title}</p>
                    </div>
                    <p className="text-cyan-900">{tutorialCard.description}</p>
                    <p className="mt-2 text-sm font-medium text-cyan-800">Tip: {tutorialCard.tip}</p>
                    <Button className="mt-4 bg-gradient-to-r from-cyan-600 to-blue-600" onClick={() => setTutorialCard(null)}>
                      {tutorialCard.cta}
                    </Button>
                  </div>
                ) : null}

                <div className="mb-2">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">
                      Question {currentQuestion + 1} of {diagnostic.questions.length}
                    </span>
                    <span className="text-sm text-gray-500">{progressPercentage}% Complete</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300"
                      style={{ width: `${((currentQuestion + 1) / diagnostic.questions.length) * 100}%` }}
                    />
                  </div>
                </div>

                <p className="text-gray-700">Read the passage and answer the question.</p>

                <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3">
                  <p className="text-sm font-semibold text-indigo-800">
                    Passage Part {currentPassageIndex + 1} of {diagnostic.passages.length}
                  </p>
                  <p className="text-xs text-indigo-700">More parts are coming as you continue.</p>
                </div>

                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                  <p className="text-lg leading-relaxed">{currentPassage?.text}</p>
                </div>

                {currentQuestionData ? (
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">{currentQuestionData.question}</Label>
                    <RadioGroup
                      value={answers[currentQuestion] !== null ? String(answers[currentQuestion]) : undefined}
                      onValueChange={(value) => handleDiagnosticAnswer(Number(value))}
                    >
                      {currentQuestionData.options.map((option, optionIndex) => (
                        <div key={option} className="flex items-center space-x-2">
                          <RadioGroupItem value={String(optionIndex)} id={`q${currentQuestion}-a${optionIndex}`} />
                          <Label htmlFor={`q${currentQuestion}-a${optionIndex}`} className="cursor-pointer">
                            {option}
                          </Label>
                        </div>
                      ))}
                      <div className="flex items-center space-x-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-2">
                        <RadioGroupItem value={String(UNKNOWN_ANSWER_VALUE)} id={`q${currentQuestion}-unknown`} />
                        <Label htmlFor={`q${currentQuestion}-unknown`} className="cursor-pointer font-medium text-slate-700">
                          I don't know / I don't remember yet
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                ) : null}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)} className="h-12 flex-1">
                    Back
                  </Button>
                  <Button
                    onClick={() => {
                      if (currentQuestion < diagnostic.questions.length - 1) {
                        const nextQuestion = currentQuestion + 1;
                        setCurrentQuestion(nextQuestion);
                        setTutorialCard(getTutorialCardForQuestion(nextQuestion, diagnostic.questions));
                      } else {
                        setDiagnosticComplete(true);
                      }
                    }}
                    disabled={answers[currentQuestion] === null}
                    className="h-12 flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-lg"
                  >
                    {currentQuestion < diagnostic.questions.length - 1 ? "Next" : "Finish"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="py-6 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <span className="text-3xl">✓</span>
                  </div>
                  <p className="mb-2 text-xl font-semibold text-gray-800">Great job, {name}!</p>
                  <p className="text-gray-600">We finished your check-in and can now personalize your library.</p>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)} className="h-12 flex-1">
                    Back
                  </Button>
                  <Button
                    onClick={handleComplete}
                    disabled={saving}
                    className="h-12 flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-lg"
                  >
                    {saving ? "Saving..." : "Start Reading!"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : null}

      <div className="mt-6 flex justify-center gap-2">
        {[1, 2, 3].map((value) => (
          <div
            key={value}
            className={`h-3 w-3 rounded-full transition-colors ${
              value === step ? "bg-purple-600" : value < step ? "bg-purple-300" : "bg-gray-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
