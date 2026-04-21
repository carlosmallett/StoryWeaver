
import { useState, useEffect, useRef } from "react";
import * as tf from '@tensorflow/tfjs';
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Loader2, ArrowLeft, ArrowRight, CheckCircle, XCircle, HelpCircle, BookOpen, Volume2, Languages, X } from "lucide-react";
import { ApiKeyInstructions } from "../components/ApiKeyInstructions";
import { hasApiKey, generateStory as aiGenerateStory, generateQuestions as aiGenerateQuestions, breakdownQuestion as aiBreakdownQuestion, getWordInsight as aiGetWordInsight, getStoryRequirementsForLexile, normalizeImportantWords, type WordInsight } from "../utils/openai";

export function ReadingSession() {
  // Webcam and model state (must be inside component)
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [modelLabels, setModelLabels] = useState<string[]>([]);
  const [predictedLabel, setPredictedLabel] = useState<string>("");
  const [showHelpPrompt, setShowHelpPrompt] = useState(false);
  const [showHelpText, setShowHelpText] = useState(false);
  const [listeningForHelp, setListeningForHelp] = useState(false);

  // Load TFJS model and labels, setup webcam (wait for videoRef.current)
  useEffect(() => {
    if (!videoRef.current) return;
    let webcamStream: MediaStream | null = null;
    let stop = false;
    async function setupModel() {
      try {
        // Load model
        const loadedModel = await tf.loadLayersModel('/tm-my-image-model/model.json');
        setModel(loadedModel);
        // Load labels from metadata.json
        const metadataResp = await fetch('/tm-my-image-model/metadata.json');
        const metadata = await metadataResp.json();
        setModelLabels(metadata.labels || []);
        // Setup webcam
        if (videoRef.current) {
          webcamStream = await navigator.mediaDevices.getUserMedia({ video: true });
          videoRef.current.srcObject = webcamStream;
          videoRef.current.play();
        } else {
          console.error('videoRef.current is null, video element not found');
        }
      } catch (e) {
        console.error('Error in setupModel:', e);
      }
    }
    setupModel();
    // Cleanup
    return () => {
      stop = true;
      if (webcamStream) webcamStream.getTracks().forEach(track => track.stop());
    };
  }, [videoRef.current]);

  // Run inference loop using tfjs
  useEffect(() => {
    let animationId: number;
    async function predictLoop() {
      if (model && videoRef.current && videoRef.current.readyState === 4) {
        // Capture frame from video
        const video = videoRef.current;
        const inputTensor = tf.browser.fromPixels(video).resizeBilinear([224, 224]).toFloat().div(255).expandDims(0);
        const prediction = model.predict(inputTensor) as tf.Tensor;
        const predictionArr = await prediction.data();
        inputTensor.dispose();
        prediction.dispose();
        // Find the label with the highest probability
        let maxIdx = 0;
        for (let i = 1; i < predictionArr.length; i++) {
          if (predictionArr[i] > predictionArr[maxIdx]) maxIdx = i;
        }
        const label = modelLabels[maxIdx] || "";
        setPredictedLabel(label);
        if (label.toLowerCase().includes('raise') || label.toLowerCase().includes('hand')) {
          setShowHelpPrompt(true);
        } else {
          setShowHelpPrompt(false);
          setShowHelpText(false);
          setListeningForHelp(false);
        }
      }
      animationId = requestAnimationFrame(predictLoop);
    }
    if (model && modelLabels.length > 0) predictLoop();
    return () => cancelAnimationFrame(animationId);
  }, [model, modelLabels]);

  // Listen for user response if help prompt is shown
  useEffect(() => {
    if (showHelpPrompt && !listeningForHelp) {
      setListeningForHelp(true);
      setTimeout(async () => {
        const needsHelp = window.confirm('Do you need help?');
        if (needsHelp) {
          setShowHelpText(true);
          // Trigger second-chance question UI for current question
          if (currentQuestionIndex === null && questions.length > 0) {
            setCurrentQuestionIndex(questionsAnswered); // Show next question if not already showing
          }
          // Mark as second chance for this question
          setRetryQuestionIndex(questionsAnswered);
          setSelectedAnswer(null);
          setIsAnswerRevealed(false);
          // Load hint for this question
          let hint = null;
          if (!hasApiKey()) {
            const demo = DEMO_STORIES[currentLevel] ?? DEMO_STORIES['400-600'];
            const breakdown = demo.breakdowns[questionsAnswered];
            hint = breakdown?.hint ?? null;
          } else {
            try {
              const breakdown = await aiBreakdownQuestion(
                questions[questionsAnswered].question,
                story,
                currentLevel,
                storyLanguage,
              );
              hint = breakdown?.hint ?? null;
            } catch {}
          }
          setRetryHint(hint ?? "Use clue words in the story text and eliminate options that are not supported.");
          setShowHint(true);
        }
        setListeningForHelp(false);
      }, 500);
    }
  }, [showHelpPrompt, listeningForHelp]);


  // Helper: handle emotion dialog resume
  function handleEmotionResume() {
    setShowEmotionDialog(false);
    setEmotionPaused(false);
  }

  // Helper: stub for pronunciation logic
  function startPronunciationTest() {
    if (!activeWord) return;
    setIsListening(true);
    setRecognitionResult(null);
    setRecognitionScore(null);
    setRecognitionError(null);

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setRecognitionError('Speech recognition is not supported in this browser.');
      setIsListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = LANGUAGE_VOICE_HINTS[storyLanguage] || 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.trim();
      setRecognitionResult(transcript);
      // Simple scoring: exact match (case-insensitive, ignore punctuation)
      const normalize = (str: string) => str.toLowerCase().replace(/[^a-z\u00C0-\u024F\u1E00-\u1EFF\s]/gi, '').trim();
      const expected = normalize(activeWord);
      const actual = normalize(transcript);
      const score = expected === actual ? 1 : 0;
      setRecognitionScore(score);
      setPronunciationFeedback(score === 1 ? 'success' : 'fail');
      setIsListening(false);
    };
    recognition.onerror = (event: any) => {
      setRecognitionError(event.error || 'Recognition error');
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    recognition.start();
  }

  // --- All state, refs, and hooks must be declared first ---
  const navigate = useNavigate();
  const FONT_STYLES = [
    { font: 'inherit', color: '#d97706', transform: 'none' },
    { font: 'inherit', color: '#2563eb', transform: 'none' },
    { font: 'inherit', color: '#059669', transform: 'none' },
    { font: 'inherit', color: '#db2777', transform: 'none' },
    { font: 'inherit', color: '#7c3aed', transform: 'none' },
    { font: 'inherit', color: '#dc2626', transform: 'none' },
    { font: 'inherit', color: '#f59e42', transform: 'none' },
    { font: 'inherit', color: '#0ea5e9', transform: 'none' },
    { font: 'inherit', color: '#10b981', transform: 'none' },
    { font: 'inherit', color: '#f43f5e', transform: 'none' },
    { font: 'inherit', color: '#a21caf', transform: 'none' },
    { font: 'inherit', color: '#fbbf24', transform: 'none' },
  ];

  const [showEmotionDialog, setShowEmotionDialog] = useState(false);
  const [emotionPaused, setEmotionPaused] = useState(false);
  const [pronunciationFeedback, setPronunciationFeedback] = useState<'none' | 'success' | 'fail'>('none');

  // Hide pronunciation feedback overlay after 2 seconds
  useEffect(() => {
    if (pronunciationFeedback === 'success' || pronunciationFeedback === 'fail') {
      const timeout = setTimeout(() => setPronunciationFeedback('none'), 2000);
      return () => clearTimeout(timeout);
    }
  }, [pronunciationFeedback]);
  const [isListening, setIsListening] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState<string | null>(null);
  const [recognitionScore, setRecognitionScore] = useState<number | null>(null);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const WORD_INSIGHT_CACHE_KEY = 'storyweaver-word-insights-v3';
  const LANGUAGE_VOICE_HINTS: Record<string, string> = {
    English: 'en-US', Spanish: 'es-ES', French: 'fr-FR', 'Mandarin Chinese': 'zh-CN', Arabic: 'ar-SA', Hindi: 'hi-IN', Portuguese: 'pt-BR', 'Haitian Creole': 'ht-HT',
  };
  type Question = { question: string; options: string[]; correctIndex: number; explanation?: string; };
  type SimplifiedQuestion = { simplifiedQuestion: string; options: string[]; correctIndex: number; hint?: string; };
  const { topicId } = useParams();
  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsApiKey, setNeedsApiKey] = useState(false);
  const [importantWords, setImportantWords] = useState<string[]>([]);
  const [wordsRead, setWordsRead] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [questionsCorrect, setQuestionsCorrect] = useState(0);
  const [consecutiveWrong, setConsecutiveWrong] = useState(0);
  const mcpStorageSetLocal = (typeof window !== 'undefined' && (window as any).mcpStorageSetLocal) || (() => {});
  const mcpStorageMSetLocal = (typeof window !== 'undefined' && (window as any).mcpStorageMSetLocal) || (() => {});
  // Removed pose model and help prompt state
  // Removed videoRef for camera
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number | null>(null);
  const [story, setStory] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentLevel, setCurrentLevel] = useState<string>("400-600");
  const [storyLanguage, setStoryLanguage] = useState("English");
  const [wordInsightCache, setWordInsightCache] = useState<Record<string, WordInsight>>({});
  const [activeWord, setActiveWord] = useState<string | null>(null);
  const [wordInsightError, setWordInsightError] = useState<string | null>(null);
  const [activeWordInsight, setActiveWordInsight] = useState<WordInsight | null>(null);
  const [wordInsightLoading, setWordInsightLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [retryHint, setRetryHint] = useState<string | null>(null);
  const [retryQuestionIndex, setRetryQuestionIndex] = useState<number | null>(null);
  const [storyChunks, setStoryChunks] = useState<string[]>([]);
  const [currentStoryChunkIndex, setCurrentStoryChunkIndex] = useState(0);
  // ...add any other missing state as needed











  // Removed help prompt UI and logic
  const safeParse = <T,>(raw: string | null, fallback: T): T => {
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  };

    const getWordCacheKey = (word: string, language: string) => `${language.toLowerCase()}::${word.toLowerCase()}`;

    const persistWordInsightCache = (nextCache: Record<string, WordInsight>) => {
      setWordInsightCache(nextCache);
      localStorage.setItem(WORD_INSIGHT_CACHE_KEY, JSON.stringify(nextCache));
    };

    const speakWord = (word: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = LANGUAGE_VOICE_HINTS[storyLanguage] ?? LANGUAGE_VOICE_HINTS.English;
      window.speechSynthesis.speak(utterance);
    };

    const handleWordClick = async (word: string) => {
      const cleanedWord = word.replace(/[^\p{L}\p{N}'-]/gu, '');
      if (!cleanedWord) return;

      setActiveWord(cleanedWord);
      setWordInsightError(null);

      const cacheKey = getWordCacheKey(cleanedWord, storyLanguage);
      const cachedInsight = wordInsightCache[cacheKey];
      if (cachedInsight) {
        setActiveWordInsight(cachedInsight);
        return;
      }

      setActiveWordInsight(null);
      setWordInsightLoading(true);
      try {
        const insight = await aiGetWordInsight(cleanedWord, story, storyLanguage);
        const nextCache = {
          ...wordInsightCache,
          [cacheKey]: insight,
        };
        persistWordInsightCache(nextCache);
        setActiveWordInsight(insight);
      } catch {
        setWordInsightError('We could not load word help right now.');
      } finally {
        setWordInsightLoading(false);
      }
    };
    const countWords = (text: string) => (text.match(/[A-Za-z][A-Za-z'-]*/g) ?? []).length;

    const splitStoryIntoChunks = (storyText: string, chunkCount: number, lexileLevel: string): string[] => {
      if (!storyText.trim()) return [];
      if (chunkCount <= 1) return [storyText.trim()];

      const splitWordsEvenly = (text: string, desiredChunkCount: number): string[] => {
        const words = text.trim().split(/\s+/).filter(Boolean);
        if (words.length === 0) return [];

        const evenChunks: string[] = [];
        let start = 0;

        for (let i = 0; i < desiredChunkCount; i++) {
          const remainingWords = words.length - start;
          const remainingChunks = desiredChunkCount - i;
          const size = Math.max(1, Math.ceil(remainingWords / remainingChunks));
          evenChunks.push(words.slice(start, start + size).join(' '));
          start += size;
        }

        return evenChunks.filter(Boolean);
      };

      const normalizeChunkCount = (candidateChunks: string[]): string[] => {
        const nonEmptyChunks = candidateChunks.map((chunk) => chunk.trim()).filter(Boolean);

        if (nonEmptyChunks.length === chunkCount) {
          return nonEmptyChunks;
        }

        if (nonEmptyChunks.length > chunkCount) {
          const merged = [...nonEmptyChunks.slice(0, chunkCount - 1)];
          merged.push(nonEmptyChunks.slice(chunkCount - 1).join('\n\n'));
          return merged;
        }

        return splitWordsEvenly(storyText, chunkCount);
      };

      const requirements = getStoryRequirementsForLexile(lexileLevel);
      const minChunkWords = requirements.minWordsPerParagraph;
      const targetChunkWords = Math.max(minChunkWords, Math.floor(countWords(storyText) / chunkCount));

      // Prefer paragraph-based splitting — AI generates \n\n-separated paragraphs
      const paragraphs = storyText
        .split(/\n\n+/)
        .map((p) => p.trim())
        .filter(Boolean);

      if (
        paragraphs.length >= chunkCount &&
        paragraphs.slice(0, chunkCount).every((paragraph) => countWords(paragraph) >= minChunkWords)
      ) {
        const chunks: string[] = [];
        let pStart = 0;
        for (let i = 0; i < chunkCount; i++) {
          const remaining = paragraphs.length - pStart;
          const remainingChunks = chunkCount - i;
          const size = Math.ceil(remaining / remainingChunks);
          const group = paragraphs.slice(pStart, pStart + size);
          if (group.length > 0) chunks.push(group.join('\n\n'));
          pStart += size;
        }
        return normalizeChunkCount(chunks);
      }

      // Fall back to sentence-based balancing so each revealed chunk is substantial.
      const sentences = storyText
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);

      const chunks: string[] = [];
      let currentChunk: string[] = [];
      let currentChunkWordCount = 0;

      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];
        const sentenceWordCount = countWords(sentence);
        const remainingSentences = sentences.length - (i + 1);
        const remainingChunks = chunkCount - chunks.length - 1;

        currentChunk.push(sentence);
        currentChunkWordCount += sentenceWordCount;

        const enoughWords = currentChunkWordCount >= targetChunkWords;
        const shouldReserveRemainingSentences = remainingChunks > 0 && remainingSentences >= remainingChunks;

        if ((enoughWords && shouldReserveRemainingSentences) || chunks.length === chunkCount - 1) {
          chunks.push(currentChunk.join(' '));
          currentChunk = [];
          currentChunkWordCount = 0;
        }
      }

      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
      }

      return normalizeChunkCount(chunks);
    };

    useEffect(() => {
      if (!story) {
        setStoryChunks([]);
        setCurrentStoryChunkIndex(0);
        return;
      }

      const chunkCount = Math.max(1, questions.length + 1);
      const chunks = splitStoryIntoChunks(story, chunkCount, currentLevel);
      setStoryChunks(chunks);
      setCurrentStoryChunkIndex(0);
      setCurrentQuestionIndex(null);
      setRetryQuestionIndex(null);
      setSelectedAnswer(null);
      setIsAnswerRevealed(false);
      setRetryHint(null);
      setShowHint(false);
    }, [story, questions.length, currentLevel]);

  
  

  // Demo story for Super Bowl 2026 (no API needed)
  // Demo stories for Super Bowl 2026 — one variant per lexile level (used when no API key)
  const DEMO_STORIES: Record<string, { story: string; importantWords: string[]; questions: Question[]; breakdowns: SimplifiedQuestion[] }> = {
    '200-400': {
      story: `The Super Bowl was finally here! Two teams ran onto the big green field. Thousands of fans cheered from every seat. Big colorful banners waved in the air. Everyone had waited all year for this special game to begin.

The quarterback grabbed the ball and threw it high into the air. It spun fast as it flew across the field. The receiver ran as fast as his legs could carry him. He jumped up and caught it! All the fans screamed with joy.

Players ran to each other and gave big hugs. They jumped up and down on the field. Their coach grinned from ear to ear. Teammates poured cold water on his head as a joke. Everyone laughed and shouted together.

Sparkly confetti fell from above like colorful snow. The gold trophy shined bright under the stadium lights. Every player had worked so hard all year. Today was the best day of their lives.`,
      importantWords: ["cheered", "colorful", "quarterback", "receiver", "jumped", "screamed", "grinned", "confetti", "sparkly", "trophy", "shined", "special"],
      questions: [
        {
          question: "What did the quarterback do with the ball?",
          options: ["Kicked it far away", "Threw it high into the air", "Handed it to a teammate", "Put it on the ground"],
          correctIndex: 1,
          explanation: "The story says the quarterback 'grabbed the ball and threw it high into the air,' and then the receiver caught it."
        },
        {
          question: "How did the coach react when his team celebrated?",
          options: ["He walked off the field", "He looked sad and upset", "He grinned from ear to ear", "He sat quietly on the bench"],
          correctIndex: 2,
          explanation: "The story tells us 'Their coach grinned from ear to ear,' which means he was smiling very widely because he was so happy."
        },
        {
          question: "What fell from the sky at the end of the story?",
          options: ["Balloons", "Snowflakes", "Confetti", "Streamers"],
          correctIndex: 2,
          explanation: "The story says 'Sparkly confetti fell from above like colorful snow,' describing the celebration at the end."
        }
      ],
      breakdowns: [
        {
          simplifiedQuestion: "Did the quarterback kick the ball or throw it?",
          options: ["He kicked it far away", "He threw it up into the air", "He gave it to a teammate", "He dropped it"],
          correctIndex: 1,
          hint: "Find the sentence about the quarterback. What action word comes after the word 'ball'?"
        },
        {
          simplifiedQuestion: "Was the coach happy or sad after the win?",
          options: ["He walked away", "He looked sad", "He smiled a really big smile", "He sat still"],
          correctIndex: 2,
          hint: "'Grinned from ear to ear' — think about what it looks like when someone smiles that big."
        },
        {
          simplifiedQuestion: "What kind of thing fell like snow at the celebration?",
          options: ["Balloons", "Snowflakes", "Confetti", "Ribbons"],
          correctIndex: 2,
          hint: "Look for the sentence about what 'fell from above like colorful snow.'"
        }
      ]
    },
    '400-600': {
      story: `Super Bowl 2026 was the most exciting championship game ever played! The stadium was packed with thousands of screaming fans, their voices echoing like thunder across every seat. Both teams had battled fiercely all season just to reach this moment. With only seconds left on the clock, the veteran quarterback took a deep breath, surveyed the field, and launched a perfect spiral through the night air.

The receiver sprinted at lightning speed, pushing every muscle to the absolute limit. He leaped high and hauled in the football with breathtaking precision. The crowd went absolutely wild! Fans jumped to their feet, screaming and hugging complete strangers beside them. The deafening roar was so powerful that players could barely hear their coaches shouting instructions from the sidelines.

Brilliant confetti exploded from cannons all around the stadium as the final whistle blew. Red, blue, gold, and silver pieces swirled through the air like a dazzling blizzard. Cheerleaders danced wildly as photographers and reporters sprinted across the field. Tears of happiness streamed down faces throughout every section of the stadium as the reality of victory slowly sank in for the players and their families.

The gleaming championship trophy sparkled brilliantly under the blazing stadium lights — a magnificent symbol of hard work, dedication, and teamwork. The winning quarterback stood at the podium, his voice trembling with emotion as he thanked his teammates and coaches. Across the country, millions of fans celebrated from their living rooms, sharing one of the greatest moments in sports history. It was a night that everyone who witnessed it would treasure forever.`,
      importantWords: ["championship", "stadium", "veteran", "quarterback", "spiral", "receiver", "precision", "deafening", "confetti", "dazzling", "gleaming", "magnificent", "dedication", "trembling"],
      questions: [
        {
          question: "What did the quarterback do with only seconds left on the clock?",
          options: ["Called a timeout to rest his team", "Handed the ball to a running back", "Launched a perfect spiral through the air", "Ran with the ball himself toward the end zone"],
          correctIndex: 2,
          explanation: "The story says the quarterback 'launched a perfect spiral through the night air' with only seconds remaining, leading to the game-winning catch."
        },
        {
          question: "How did the crowd react when the receiver made the catch?",
          options: ["They remained seated and applauded politely", "They left the stadium in surprise", "They went absolutely wild, screaming and hugging strangers", "They chanted the receiver's name quietly"],
          correctIndex: 2,
          explanation: "The story states 'The crowd went absolutely wild! Fans jumped to their feet, screaming and hugging complete strangers,' showing an extremely enthusiastic reaction."
        },
        {
          question: "What does the trophy at the end of the story represent?",
          options: ["The most expensive award in professional sports", "Hard work, dedication, and teamwork", "The achievement of the best individual player", "A reward presented only to the coaches"],
          correctIndex: 1,
          explanation: "The story describes the trophy as 'a magnificent symbol of hard work, dedication, and teamwork,' directly telling us its deeper meaning."
        }
      ],
      breakdowns: [
        {
          simplifiedQuestion: "With seconds to go, what did the quarterback throw?",
          options: ["He called time out", "He handed off to a running back", "He threw a perfect spiral down the field", "He ran with it himself"],
          correctIndex: 2,
          hint: "Look for the sentence that says the quarterback 'launched' something. What did he launch?"
        },
        {
          simplifiedQuestion: "Were the fans calm or excited when the catch happened?",
          options: ["Calm — they clapped quietly", "They walked out", "Wildly excited — screaming and hugging strangers", "Quietly chanting"],
          correctIndex: 2,
          hint: "The story says the crowd went 'absolutely wild' — what does that tell you about how people were feeling?"
        },
        {
          simplifiedQuestion: "What idea does the shiny trophy stand for?",
          options: ["It is the most expensive thing in sports", "Hard work, dedication, and teamwork", "It belongs only to the best individual player", "It is given only to the coaches"],
          correctIndex: 1,
          hint: "Find the sentence that describes the trophy. What words come right after 'symbol of'?"
        }
      ]
    },
    '600-800': {
      story: `Super Bowl 2026 drew the largest television audience in American sports history, with over two hundred million viewers watching from around the globe. Inside the stadium, eighty thousand fans created an almost physical atmosphere of anticipation — a current of collective excitement that buzzed through every crowded corridor and packed seat in the upper deck. Players from both teams moved through their pre-game routines with studied composure designed to mask the reality that this contest represented the culmination of an entire season of grinding preparation. The stakes were absolute and everyone present understood that what was about to unfold would be discussed for decades.

Down by three points with forty seconds remaining, the veteran quarterback jogged onto the field carrying the calm of someone who had engineered improbable comebacks before. He surveyed the defense carefully, identified a vulnerability on the left side of the field, and immediately adjusted the play at the line of scrimmage. Snapping the ball with fluid efficiency, he planted his back foot and delivered a perfectly weighted throw that cut through the stadium air with extraordinary precision.

The wide receiver, running a sharp route toward the back corner of the end zone, never broke stride as the football found his outstretched hands. The catch was almost anticlimactic in its cleanness — two sure hands, body control maintained despite a defender's last-second challenge, both feet confirmed inbounds by the officials. What followed was anything but anticlimactic. The noise that erupted from eighty thousand people simultaneously produced a sound wave unlike anything most spectators had ever experienced.

Inside the locker room an hour later, the atmosphere had shifted from explosive celebration to something quieter and more profound. Veterans who had spent entire careers without reaching this moment sat with emotions visibly washing over them — not performing joy for cameras but experiencing something evidently private. Younger players moved through the room looking genuinely overwhelmed, trying to absorb an event their imaginations had rehearsed countless times but had never fully prepared them for. Coaches who had maintained strict composure all season had abandoned it entirely, embracing players and staff with authentic warmth.

When the championship trophy was carried onto the field beneath cascading confetti, the crowd's response was renewed and immediate — another surge of sound from fans who had apparently believed they had no more energy to spend. The winning quarterback's address to the microphone was brief but eloquent: a clear acknowledgment that championships are won collectively, by entire organizations rather than individuals, and that the true satisfaction was not the trophy itself but the shared journey it represented. The team had arrived at this moment together, and together was how they would always remember it.`,
      importantWords: ["anticipation", "composure", "culmination", "improbable", "vulnerability", "anticlimactic", "simultaneously", "profound", "overwhelmed", "cascading", "eloquent", "collectively", "acknowledgment", "extraordinary"],
      questions: [
        {
          question: "What did the quarterback do when he identified a vulnerability in the defense?",
          options: ["He called a timeout to discuss with his coach", "He threw the ball immediately without changing the plan", "He adjusted the play at the line of scrimmage to exploit it", "He handed the ball to the running back instead"],
          correctIndex: 2,
          explanation: "The story says he 'identified a vulnerability on the left side of the field, and immediately adjusted the play,' demonstrating quick strategic thinking under pressure."
        },
        {
          question: "What does calling the catch 'almost anticlimactic in its cleanness' suggest?",
          options: ["That the catch was disappointing to watch", "That the receiver barely held on to the ball", "That the catch looked almost effortless because it was made so cleanly", "That the fans were not very excited by it"],
          correctIndex: 2,
          explanation: "The author uses 'anticlimactic in its cleanness' to suggest the catch was executed so smoothly that it seemed almost easy — a striking contrast with the enormous pressure of the moment."
        },
        {
          question: "How had the atmosphere in the locker room changed from the on-field celebration?",
          options: ["It had become louder and more chaotic than on the field", "It had shifted from explosive celebration to something quieter and more personal", "Players were already focused on preparing for next season", "Veterans and rookies celebrated in separate areas"],
          correctIndex: 1,
          explanation: "The story describes the atmosphere as having 'shifted from explosive celebration to something quieter and more profound,' with players experiencing private emotional moments rather than performing for the crowd."
        },
        {
          question: "What did the quarterback mean when he said championships are won 'collectively, by entire organizations rather than individuals'?",
          options: ["That no single player deserves credit for winning", "That the victory belonged to everyone in the organization, not just the stars on the field", "That the owners are more important than the players", "That individual statistics are meaningless in team sports"],
          correctIndex: 1,
          explanation: "By saying the championship was won 'collectively, by entire organizations,' the quarterback acknowledged that the victory was a shared achievement involving coaches, support staff, players, and management — not just individual stars."
        }
      ],
      breakdowns: [
        {
          simplifiedQuestion: "When the quarterback saw a weakness in the defense, what did he do?",
          options: ["He called timeout to ask his coach", "He threw immediately without thinking", "He changed the play on the spot to take advantage", "He handed the ball to the running back"],
          correctIndex: 2,
          hint: "Look for the sentence about the quarterback 'identifying a vulnerability.' What did he do immediately after spotting it?"
        },
        {
          simplifiedQuestion: "The catch was described as 'anticlimactic in its cleanness.' What does this mean?",
          options: ["It was a bad catch", "The receiver almost dropped it", "It looked almost easy because it was so smooth", "The fans didn't care about it"],
          correctIndex: 2,
          hint: "'Anticlimactic' means less exciting than expected. Here the catch looked almost easy — what does that tell you about how well it was made?"
        },
        {
          simplifiedQuestion: "What was different about the mood in the locker room compared to the field?",
          options: ["It was even louder and more excited", "It was quieter with players having private emotional moments", "Players were thinking about next season", "Veterans were in a separate space from rookies"],
          correctIndex: 1,
          hint: "The story says the atmosphere had 'shifted.' What words describe how the locker room felt differently from the loud field celebration?"
        },
        {
          simplifiedQuestion: "When the quarterback said the win was 'collective,' what was he trying to say?",
          options: ["The stars deserve all the credit", "Everyone in the whole organization deserves credit, not just him", "Owners matter more than players", "Individual stats don't matter"],
          correctIndex: 1,
          hint: "'Collectively' means as a whole group. Who does the quarterback say the win really belongs to?"
        }
      ]
    },
    '800-1000': {
      story: `Super Bowl 2026 generated cultural and commercial phenomena of a scale that even professional sports, accustomed to extravagance, rarely produces. Television viewership estimates placed the global simultaneous audience above two hundred and fifty million, with coordinated watch parties spanning forty-six countries and streaming demand crashing several major platforms in the hours preceding kickoff. The economic infrastructure supporting a single three-hour football match had grown impressively over the decades: security personnel numbering in the thousands, media operations occupying dedicated hotel floors, and corporate hospitality suites leased at rates bearing no proportional relationship to the athletic event they nominally existed to celebrate. Inside the stadium itself, however, stripped of those surrounding commercial ecosystems, the essential drama remained refreshingly unchanged from the sport's origins — two teams, a contested field, and the fundamental human desire to witness excellence under pressure.

The quarterback who would ultimately define the game's narrative had spent eleven seasons accumulating the credentials and, more critically, the temperamental qualities necessary to be trusted with such a moment. He had absorbed early-career setbacks with the disciplined equanimity that coaches either discover in a player or spend years attempting to cultivate — a psychological quality considerably more difficult to develop than arm strength or footwork, and correspondingly more valuable under championship pressure. In the final ninety seconds of regulation, trailing by four points and working from his own thirty-one yard line, he exhibited that quality in its purest form: progressing through his reads systematically, filtering out stadium noise registering over one hundred decibels, and locating the coverage breakdown that experienced defenses almost invariably surrender — one opening, brief and sufficient, on the left boundary of the end zone.

The throw itself belonged to that small category of athletic performances that generate the peculiar sensation of watching something being permanently inscribed into collective memory while it is still unfolding. Released at an angle that accounted simultaneously for the receiver's acceleration and the trailing defender's recovered positioning, the football traveled forty-one yards before arriving precisely at the coordinates where the receiver's hands would intersect its path — calculations executed not through conscious deliberation but through the compressed automaticity of thousands of practice repetitions. The receiver's catch, contested at the last instant by a defender applying maximum legal contact, required an additional dimension of athleticism: the capacity to maintain fine motor coordination in the hands while absorbing significant physical disruption to the upper body. He maintained it. Both feet confirmed inbounds. Touchdown, lead, and with it, near-certain championship.

The acoustic response of eighty thousand people expressing a single emotion simultaneously exceeded one hundred and eighteen decibels — louder, the stadium's monitoring systems recorded, than any previous measurement taken at the venue. Crowds at this scale, sharing an uncertain outcome and resolving it instantaneously, produce collective behavioral phenomena that social scientists have studied extensively: individuals partially surrender their ordinary social boundaries, inhibitions dissolved by shared experiences of sufficient intensity to temporarily override the invisible partitions separating strangers. People who had arrived as disconnected individuals found themselves in sustained contact with those around them, the usual negotiation of personal space entirely abandoned in favor of something less calculated and more genuine.

Championship locker rooms, following the cessation of immediate field celebration, reliably reveal character in ways that athletic performance alone cannot. Camera crews documented a range of responses: the veteran lineman quietly calling each member of his position group by name and embracing them individually; the rookie receiver standing at his locker for twenty minutes before opening it, apparently wanting to delay the moment at which the evening would become ordinary through the routine act of changing clothes; the offensive coordinator sitting alone systematically reviewing his play-call sheet with the focused detachment of someone who processes emotional experience only after its stimuli have been methodically catalogued. The head coach moved through the space with quiet deliberateness, exchanging something private with each player — a brief sentence, a hand placed on a shoulder — before moving on. The trophy sat on a table at the room's center, largely ignored by everyone present.

The cultural significance of championships of this magnitude extends considerably beyond the athletic competition that technically produces them. Political scientists and cultural historians have identified a consistent pattern: these events create temporary suspensions of ordinary social divisions — class, geography, political affiliation — in favor of collective emotional experience organized around a symbolic contest whose outcome genuinely cannot be predicted. The function is admittedly temporary; ordinary divisions reliably resume their shape once the shared experience concludes. But the moment itself — the willingness of millions of people to invest genuine emotion in an outcome they cannot control — represents a form of spontaneous social cohesion that is considerably more difficult to manufacture through deliberate means, and whose periodic emergence may be among the more interesting contributions that organized sports make to public life.`,
      importantWords: ["phenomena", "equanimity", "temperamental", "systematically", "inscribed", "accumulated", "simultaneously", "inhibitions", "methodically", "deliberateness", "magnitude", "spontaneous", "cohesion", "proportional", "automaticity"],
      questions: [
        {
          question: "What does the author suggest by saying the quarterback had developed 'equanimity' through absorbing early-career setbacks?",
          options: ["That coaches deliberately create hardships to test their quarterbacks", "That composure under failure is a rare, cultivated quality more valuable than physical skill", "That the quarterback had a naturally easy career with few serious adversities", "That the coaching staff was primarily responsible for his psychological development"],
          correctIndex: 1,
          explanation: "The author says equanimity is 'considerably more difficult to develop than arm strength' and that coaches 'either discover' it or 'spend years attempting to cultivate' it — framing it as rare and hard-won, making the quarterback's composure under championship pressure his most valuable asset."
        },
        {
          question: "The author writes that the throw involved calculations executed 'not through conscious deliberation but through the compressed automaticity of thousands of practice repetitions.' What does this convey?",
          options: ["That elite athletes rely on natural talent rather than practice", "That complex physical skills become automatic through extensive practice, bypassing conscious thought during execution", "That the quarterback was consciously calculating physics while under pressure", "That the receiver, not the quarterback, made the critical in-game adjustments"],
          correctIndex: 1,
          explanation: "The phrase 'compressed automaticity of thousands of practice repetitions' directly explains that the calculation was automatic — not deliberate — because practice had encoded it into muscle memory, illustrating how elite skill transcends conscious thought."
        },
        {
          question: "What social phenomenon does the author describe when analyzing how strangers interacted in the crowd?",
          options: ["The way corporate advertising influences behavior in public spaces", "How shared intense experience can temporarily dissolve ordinary social boundaries between strangers", "The tendency of large sports crowds to become aggressive", "How stadium security manages high-tension crowd situations"],
          correctIndex: 1,
          explanation: "The author describes 'individuals partially surrendering their ordinary social boundaries' with 'inhibitions dissolved by shared experiences of sufficient intensity to temporarily override the invisible partitions separating strangers' — a precise description of how collective emotion breaks down normal social barriers."
        },
        {
          question: "What is the significance of the championship trophy 'sitting on a table at the room's center, largely ignored' in the locker room scene?",
          options: ["It suggests the players were disappointed or indifferent to their achievement", "It implies genuine human connection felt more real and meaningful than the symbolic object representing the goal", "It shows the players had not yet fully registered that they had won", "It indicates the trophy had already been sent elsewhere for engraving"],
          correctIndex: 1,
          explanation: "By contrasting the deeply personal interactions happening throughout the room — private embraces, quiet reflection, delayed rituals — with the ignored trophy at its center, the author suggests authentic achievement resides in human relationships and inner meaning, not in the symbolic object used to represent it."
        },
        {
          question: "According to the final paragraph, what function do championships of this magnitude serve beyond the competition itself?",
          options: ["They generate significant economic activity for host cities and media companies", "They create temporary suspensions of social divisions through shared collective emotional experience", "They demonstrate the superiority of competitive over cooperative social organization", "They produce historical records that serve as benchmarks for future athletic achievement"],
          correctIndex: 1,
          explanation: "The author explicitly identifies the function as 'temporary suspensions of ordinary social divisions — class, geography, political affiliation — in favor of collective emotional experience,' and frames this spontaneous social cohesion as the championship's most meaningful contribution to public life."
        }
      ],
      breakdowns: [
        {
          simplifiedQuestion: "The author says the quarterback showed 'equanimity' after setbacks. What does this tell us about his mental strength?",
          options: ["He demanded trades when things went wrong", "He stayed calm and composed even when facing failure", "He had an easy career with very few real challenges", "His coaches protected him from difficult situations"],
          correctIndex: 1,
          hint: "'Equanimity' means staying calm and balanced under pressure. The text says coaches struggle to develop this quality — why would that make it especially valuable?"
        },
        {
          simplifiedQuestion: "The throw used calculations 'not through conscious deliberation but through automaticity of practice repetitions.' What does this mean about elite athletic skill?",
          options: ["Natural talent matters more than practice", "Thousands of hours of practice turn complex calculations into automatic muscle memory", "The quarterback was consciously doing math during the game", "The receiver was responsible for the adjustments"],
          correctIndex: 1,
          hint: "'Automaticity' means happening automatically without thinking. What turns a hard skill into something you can do without thinking about it?"
        },
        {
          simplifiedQuestion: "The crowd's shared experience 'temporarily overrode the invisible partitions separating strangers.' In simpler terms, what happened?",
          options: ["People became aggressive with strangers", "People sat closer together to save space", "Shared excitement made strangers act like they knew each other", "People forgot what sport they were watching"],
          correctIndex: 2,
          hint: "'Partitions' are invisible walls between people. If the shared excitement dissolved those walls, how would people treat strangers differently?"
        },
        {
          simplifiedQuestion: "Why does the author point out that the trophy in the locker room was 'largely ignored' by everyone?",
          options: ["The players were disappointed by the trophy design", "Genuine personal moments felt more meaningful than the symbolic object", "Nobody knew the trophy was in the room", "The trophy had already been sent for engraving"],
          correctIndex: 1,
          hint: "What are the players doing instead of looking at the trophy? Why might those personal moments feel more real than looking at an object?"
        },
        {
          simplifiedQuestion: "What does the final paragraph say championships do for society beyond the game itself?",
          options: ["They create major economic benefits for host cities", "They temporarily bring together people divided by class, location, or politics", "They prove competition beats cooperation", "They create historical records for future generations"],
          correctIndex: 1,
          hint: "'Suspension of social divisions' means differences between people are temporarily set aside. What kinds of divisions does the author specifically list?"
        }
      ]
    }
  };

  useEffect(() => {
    const selectedTopicData = localStorage.getItem('selectedTopic');
    if (selectedTopicData) {
      try {
        const parsed = JSON.parse(selectedTopicData);
        if (parsed?.id === topicId) {
          setSelectedTopic(parsed);
        }
      } catch {
        setSelectedTopic(null);
      }
    }

    const currentUserData = localStorage.getItem('currentUser');
    const currentUser = safeParse<{ id?: string } | null>(currentUserData, null);
    const profileData = currentUser?.id
      ? localStorage.getItem(`userProfile-${currentUser.id}`) ?? localStorage.getItem('userProfile')
      : localStorage.getItem('userProfile');
    if (profileData) {
      const p = safeParse<Record<string, unknown> | null>(profileData, null);
      if (!p) {
        setStoryLanguage('English');
        if (!hasApiKey()) {
          loadDemoStory("400-600");
        } else {
          generateStory("400-600", [], 'English');
        }
        return;
      }
      setProfile(p);
      const profileLexile = typeof p.lexileLevel === 'string' ? p.lexileLevel : '400-600';
      const profileStoryLanguage = typeof p.storyLanguage === 'string'
        ? p.storyLanguage
        : typeof p.homeLanguage === 'string'
          ? p.homeLanguage
          : 'English';
      const profileInterests = Array.isArray(p.interests) ? (p.interests as string[]) : [];

      setCurrentLevel(profileLexile);
      setStoryLanguage(profileStoryLanguage);
      
      // Check if this is the Super Bowl demo
      const level = profileLexile;
      if (!hasApiKey()) {
        loadDemoStory(level);
      } else {
        generateStory(level, profileInterests, profileStoryLanguage);
      }
    } else {
      setStoryLanguage('English');
      // No profile
      if (!hasApiKey()) {
        loadDemoStory("400-600");
      } else {
        generateStory("400-600", [], 'English');
      }
    }
  }, [topicId]);

  const loadDemoStory = (level: string) => {
    setLoading(true);
    const demo = DEMO_STORIES[level] ?? DEMO_STORIES['400-600'];
    const normalizedImportantWords = normalizeImportantWords(demo.story, demo.importantWords, level);

    setTimeout(() => {
      setStory(demo.story);
      setImportantWords(normalizedImportantWords);
      setQuestions(demo.questions);
      setWordsRead(demo.story.split(/\s+/).length);
      setLoading(false);

      const currentReading = {
        topicId: topicId ?? 'demo',
        title: selectedTopic?.title ?? topicId?.replace(/-/g, ' ') ?? 'Demo Story',
        story: demo.story,
        wordsRead: demo.story.split(/\s+/).length,
        timestamp: Date.now(),
        importantWords: normalizedImportantWords,
        storyLanguage,
      };
      localStorage.setItem('currentReading', JSON.stringify(currentReading));
      void mcpStorageSetLocal('currentReading', currentReading);
    }, 800);
  };

  const generateStory = async (lexileLevel: string, interests: string[], preferredLanguage = 'English') => {
    setLoading(true);
    setNeedsApiKey(false);
    try {
      if (!hasApiKey()) {
        setNeedsApiKey(true);
        setLoading(false);
        return;
      }
      const selectedTopicData = localStorage.getItem('selectedTopic');
      let topicContext = selectedTopic;
      if (selectedTopicData) {
        try {
          const parsed = JSON.parse(selectedTopicData);
          if (parsed?.id === topicId) {
            topicContext = parsed;
          }
        } catch {
          topicContext = selectedTopic;
        }
      }

      const topicLabel = topicContext?.title || topicId?.replace(/-/g, ' ') || 'story';
      const topicDescription = topicContext?.description ? ` | context: ${topicContext.description}` : '';
      const topicTheme = `${topicLabel}${topicDescription} — interests: ${interests.slice(0, 4).join(', ')}`;
      const storyData = await aiGenerateStory(topicTheme, lexileLevel, preferredLanguage);
      setStory(storyData.story);
      setImportantWords(storyData.importantWords);
      setStoryLanguage(preferredLanguage);
      setWordsRead(storyData.story.split(/\s+/).length);
      const questionsData = await aiGenerateQuestions(storyData.story, lexileLevel, preferredLanguage);
      setQuestions(questionsData.questions);
      localStorage.setItem('currentReading', JSON.stringify({
        topicId,
        title: topicContext?.title || topicId?.replace(/-/g, ' ') || 'Story',
        story: storyData.story,
        wordsRead: storyData.story.split(/\s+/).length,
        timestamp: Date.now(),
        importantWords: storyData.importantWords,
        storyLanguage: preferredLanguage,
      }));
      void mcpStorageSetLocal('currentReading', {
        topicId,
        title: topicContext?.title || topicId?.replace(/-/g, ' ') || 'Story',
        story: storyData.story,
        wordsRead: storyData.story.split(/\s+/).length,
        timestamp: Date.now(),
        importantWords: storyData.importantWords,
        storyLanguage: preferredLanguage,
      });
    } catch (err: any) {
      if (err?.message === 'NO_API_KEY' || err?.message === 'INVALID_API_KEY') {
        setNeedsApiKey(true);
      } else {
        setError(err?.message ?? 'Failed to generate story');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShowQuestion = () => {
    const nextQuestionIndex = retryQuestionIndex ?? questionsAnswered;
    if (
      questions.length > 0 &&
      currentQuestionIndex === null &&
      nextQuestionIndex < questions.length
    ) {
      setCurrentQuestionIndex(nextQuestionIndex);
    }
  };

  const handleAnswerSelect = (index: number) => {
    if (!isAnswerRevealed) {
      setSelectedAnswer(index);
    }
  };

  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null) return;

    const currentQ = questions[currentQuestionIndex!];
    const questionIndex = currentQuestionIndex!;
    const isSecondChanceAttempt = retryQuestionIndex === questionIndex;
    const isCorrect = selectedAnswer === currentQ.correctIndex;

    if (isCorrect) {
      setIsAnswerRevealed(true);
      setQuestionsAnswered(prev => prev + 1);

      // Accuracy only counts first-try correctness.
      if (!isSecondChanceAttempt) {
        setQuestionsCorrect(prev => prev + 1);
        setConsecutiveWrong(0);
      } else {
        const newConsecutiveWrong = consecutiveWrong + 1;
        setConsecutiveWrong(newConsecutiveWrong);
        if (newConsecutiveWrong >= 2) {
          adjustReadingLevel(false);
        }
      }

      setRetryQuestionIndex(null);
      setRetryHint(null);
      setShowHint(false);
    } else {
      if (!isSecondChanceAttempt) {
        // First miss: stay on the same question and provide a hint-based second chance.
        setRetryQuestionIndex(questionIndex);
        setSelectedAnswer(null);
        setIsAnswerRevealed(false);

        const hint = await breakdownQuestion();
        setRetryHint(hint ?? "Use clue words in the story text and eliminate options that are not supported.");
        setShowHint(true);
        return;
      }

      setIsAnswerRevealed(true);
      setQuestionsAnswered(prev => prev + 1);
      const newConsecutiveWrong = consecutiveWrong + 1;
      setConsecutiveWrong(newConsecutiveWrong);

      // If persistently struggling (2+ finalized misses), adjust level.
      if (newConsecutiveWrong >= 2) {
        adjustReadingLevel(false);
      }

      setRetryQuestionIndex(null);
      setRetryHint(null);
    }
  };

  const breakdownQuestion = async (): Promise<string | null> => {
    try {
      // For demo story, use pre-made breakdowns
      if (!hasApiKey() && currentQuestionIndex !== null) {
        const demo = DEMO_STORIES[currentLevel] ?? DEMO_STORIES['400-600'];
        const breakdown = demo.breakdowns[currentQuestionIndex];
        return breakdown?.hint ?? null;
      }

      // For API-generated stories, call the AI utility
      const breakdown = await aiBreakdownQuestion(
        questions[currentQuestionIndex!].question,
        story,
        currentLevel,
        storyLanguage,
      );
      return breakdown?.hint ?? null;
    } catch (error) {
      console.error('Error breaking down question:', error);
      return null;
    }
  };

  const adjustReadingLevel = (increase: boolean) => {
    const levels = ["200-400", "400-600", "600-800", "800-1000"];
    const currentIndex = levels.indexOf(currentLevel);
    
    if (increase && currentIndex < levels.length - 1) {
      setCurrentLevel(levels[currentIndex + 1]);
    } else if (!increase && currentIndex > 0) {
      setCurrentLevel(levels[currentIndex - 1]);
    }
  };

  const handleNextQuestion = () => {
    setIsAnswerRevealed(false);
    setSelectedAnswer(null);
    setRetryHint(null);
    setShowHint(false);

    setCurrentQuestionIndex(null);
    setCurrentStoryChunkIndex((prev) => Math.min(prev + 1, Math.max(storyChunks.length - 1, 0)));
  };

  const handleFinishSession = () => {
    // Save detailed reading session for parent dashboard
    const readingSession = {
      title: topicId === 'super-bowl-2026' ? 'Super Bowl 2026 Championship' : 'Reading Adventure',
      topicId,
      story,
      importantWords,
      storyLanguage,
      wordsRead,
      lexileLevel: currentLevel,
      questionsAnswered,
      questionsCorrect,
      timestamp: new Date().toISOString(),
      storyExcerpt: story.substring(0, 300) + (story.length > 300 ? '...' : ''),
    };
    
    // Save to localStorage for parent dashboard
    localStorage.setItem('currentReading', JSON.stringify(readingSession));
    const currentUserData = localStorage.getItem('currentUser');
    const currentUser = safeParse<{ id?: string } | null>(currentUserData, null);
    if (currentUser?.id) {
      localStorage.setItem(`currentReading-${currentUser.id}`, JSON.stringify(readingSession));
    }

    // Append to reading history for student + parent dashboards
    const studentHistoryKey = currentUser?.id ? `readingHistory-${currentUser.id}` : 'readingHistory';
    const existingHistory = localStorage.getItem(studentHistoryKey) ?? localStorage.getItem('readingHistory');
    const parsedHistory = safeParse<Array<Record<string, unknown>>>(existingHistory, []);
    const historyEntry = {
      ...readingSession,
      id: `read-${Date.now()}`,
      dateRead: new Date().toLocaleDateString(),
      accuracy: readingSession.questionsAnswered > 0
        ? Math.round((readingSession.questionsCorrect / readingSession.questionsAnswered) * 100)
        : 0,
      summary: readingSession.story.substring(0, 220) + (readingSession.story.length > 220 ? '...' : ''),
      discussionQuestions: [
        'What do you think will happen next, and what clues make you think that?',
        'If this story had one more chapter, what challenge might the main character face?',
        'What is one big idea this story teaches, and where did you see it in the text?',
      ],
    };

    localStorage.setItem(studentHistoryKey, JSON.stringify([historyEntry, ...parsedHistory]));
    localStorage.setItem('readingHistory', JSON.stringify([historyEntry, ...parsedHistory]));

    const mcpEntries: Array<{ key: string; value: unknown }> = [
      { key: 'currentReading', value: readingSession },
      { key: 'readingHistory', value: [historyEntry, ...parsedHistory] },
    ];

    if (currentUser?.id) {
      mcpEntries.push({ key: `currentReading-${currentUser.id}`, value: readingSession });
      mcpEntries.push({ key: `readingHistory-${currentUser.id}`, value: [historyEntry, ...parsedHistory] });
    }

    void mcpStorageMSetLocal(mcpEntries);
    
    navigate('/library');
  };

  const renderStoryWithEmphasis = (storyText: string) => {
    const paragraphs = storyText.split(/\n\n+/).filter(Boolean);

    return paragraphs.map((paragraph, pIndex) => {
      const words = paragraph.split(/(\s+)/);
      const renderedWords = words.map((word, wIndex) => {
        if (word.match(/^\s+$/)) return <span key={wIndex}>{word}</span>;

        const cleanWord = word.replace(/[^\p{L}\p{N}'-]/gu, '');
        const isImportant = importantWords.some(
          (importantWord) => cleanWord.toLowerCase() === importantWord.toLowerCase()
        );

        if (isImportant) {
          const style = FONT_STYLES[(pIndex * 97 + wIndex) % FONT_STYLES.length];
          return (
            <button
              type="button"
              key={wIndex}
              onClick={() => handleWordClick(cleanWord)}
              className="inline-block mx-1.5 my-0.5 rounded-md transition-all duration-200 hover:scale-110 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-300"
              style={{
                fontFamily: style.font,
                color: style.color,
                transform: style.transform,
                textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                fontWeight: 700,
                padding: '2px 4px',
                background: 'transparent',
              }}
            >
              {word}
            </button>
          );
        }

        return (
          <button
            type="button"
            key={wIndex}
            onClick={() => handleWordClick(cleanWord)}
            className="inline rounded-sm px-0.5 text-inherit hover:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-300"
          >
            {word}
          </button>
        );
      });

      return (
        <p key={pIndex} className="mb-5 last:mb-0">
          {renderedWords}
        </p>
      );
    });
  };

  if (needsApiKey) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Button variant="outline" onClick={() => navigate('/library')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Library
        </Button>
        <ApiKeyInstructions
          onKeySet={() => {
            const profileData = localStorage.getItem('userProfile');
            const p = safeParse<Record<string, unknown> | null>(profileData, null);
            generateStory(String(p?.lexileLevel ?? '400-600'), Array.isArray(p?.interests) ? p?.interests : [], String(p?.storyLanguage ?? p?.homeLanguage ?? 'English'));
          }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Button variant="outline" onClick={() => navigate('/library')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Library
        </Button>
        <Card className="border-2 border-red-200 bg-red-50">
          <CardContent className="pt-6 pb-6 space-y-4">
            <p className="font-semibold text-red-800">Something went wrong generating your story.</p>
            <p className="text-sm text-red-700 font-mono break-words">{error}</p>
            <div className="flex flex-col gap-3 pt-2">
              <Button
                onClick={() => {
                  setError(null);
                  const profileData = localStorage.getItem('userProfile');
                  const p = safeParse<Record<string, unknown> | null>(profileData, null);
                  generateStory(String(p?.lexileLevel ?? '400-600'), Array.isArray(p?.interests) ? p?.interests : [], String(p?.storyLanguage ?? p?.homeLanguage ?? 'English'));
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Try Again
              </Button>
              <ApiKeyInstructions
                onKeySet={() => {
                  setError(null);
                  const profileData = localStorage.getItem('userProfile');
                  const p = safeParse<Record<string, unknown> | null>(profileData, null);
                  generateStory(String(p?.lexileLevel ?? '400-600'), Array.isArray(p?.interests) ? p?.interests : [], String(p?.storyLanguage ?? p?.homeLanguage ?? 'English'));
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl flex items-center justify-center min-h-screen">
        <Card className="border-2 shadow-lg">
          <CardContent className="pt-12 pb-12 px-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
              <p className="text-xl text-gray-700">Writing your story with AI...</p>
              <p className="text-sm text-gray-500">Crafting in the Geronimo Stilton style ✍️</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQ = currentQuestionIndex !== null ? questions[currentQuestionIndex] : null;
  const visibleStory = storyChunks.length > 0
    ? storyChunks.slice(0, currentStoryChunkIndex + 1).join('\n\n')
    : story;
  const currentChunkText = storyChunks[currentStoryChunkIndex] ?? story;
  const progress = questions.length > 0 ? ((questionsAnswered / questions.length) * 100) : 0;

  // Pronunciation feedback overlay
  let feedbackOverlay = null;
  if (pronunciationFeedback === 'success') {
    feedbackOverlay = (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(34,197,94,0.7)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.5s',
        pointerEvents: 'none',
      }}>
        <span style={{
          color: '#fff',
          fontSize: '2.5rem',
          fontWeight: 700,
          textShadow: '2px 2px 8px #16a34a',
        }}>Yay, that's correct!</span>
      </div>
    );
  } else if (pronunciationFeedback === 'fail') {
    feedbackOverlay = (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(239,68,68,0.7)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.5s',
        pointerEvents: 'none',
      }}>
        <span style={{
          color: '#fff',
          fontSize: '2.5rem',
          fontWeight: 700,
          textShadow: '2px 2px 8px #dc2626',
        }}>No, please try again</span>
      </div>
    );
  }

  return (
    <>
      {/* Webcam video for model inference (visible for debugging) */}
      <video ref={videoRef} style={{ display: 'block', border: '2px solid #38bdf8', marginBottom: 16 }} width={224} height={224} autoPlay muted />
      {/* Show help prompt if hand raised */}
      {showHelpPrompt && !showHelpText && (
        <div style={{ position: 'fixed', top: 20, right: 20, background: '#fffbe6', border: '1px solid #facc15', padding: 16, borderRadius: 8, zIndex: 1000 }}>
          <span role="img" aria-label="hand">✋</span> Detected raised hand. Asking if you need help...
        </div>
      )}
      {/* Show help text if user says yes */}
      {showHelpText && (
        <div style={{ position: 'fixed', top: 60, right: 20, background: '#e0f2fe', border: '1px solid #38bdf8', padding: 16, borderRadius: 8, zIndex: 1000 }}>
          <span role="img" aria-label="info">💡</span> Here is some help text! (You can customize this message.)
        </div>
      )}
      <div className="container mx-auto px-4 py-8 max-w-4xl" style={{ position: 'relative' }}>
        {feedbackOverlay}
        {/* Emotion dialog */}
        {showEmotionDialog && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full flex flex-col items-center">
              <span role="img" aria-label="concerned" style={{ fontSize: 48 }}>😟</span>
              <h2 className="text-2xl font-bold mt-4 mb-2 text-red-700">Are you okay?</h2>
              <p className="text-lg text-gray-700 mb-6 text-center">We noticed you might be feeling stressed. Would you like to take a break or continue reading?</p>
              <div className="flex gap-4">
                <button className="px-6 py-2 rounded-lg bg-green-600 text-white font-semibold" onClick={handleEmotionResume}>I'm OK, Continue</button>
                <button className="px-6 py-2 rounded-lg bg-gray-300 text-gray-800 font-semibold" onClick={() => window.location.reload()}>Take a Break</button>
              </div>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={() => navigate('/library')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Library
          </Button>
          <div className="flex items-center gap-3">
            <Badge className="bg-purple-500">{currentLevel}L</Badge>
            <Badge variant="outline">{wordsRead} words</Badge>
          </div>
        </div>
        {/* Progress */}
        {questions.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                Questions: {questionsAnswered} / {questions.length}
              </span>
              <span className="text-sm font-medium text-gray-600">
                Correct: {questionsCorrect}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
        {/* Story Display */}
        {currentQuestionIndex === null && (
          <Card className="border-2 shadow-lg mb-6">
            <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  <CardTitle>Your Story</CardTitle>
                  <Badge variant="outline" className="border-cyan-200 text-cyan-700">
                    <Languages className="mr-1 h-3.5 w-3.5" />
                    {storyLanguage}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="mb-4 rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-3">
                <p className="text-sm font-semibold text-cyan-800">
                  Story Part {Math.min(currentStoryChunkIndex + 1, Math.max(storyChunks.length, 1))} of {Math.max(storyChunks.length, 1)}
                </p>
                <p className="text-xs text-cyan-700">This story has next parts that unlock as you answer questions.</p>
              </div>
              <div
                className="text-xl leading-relaxed mb-6"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                {renderStoryWithEmphasis(visibleStory)}
              </div>
              {questions.length > 0 && questionsAnswered < questions.length && (
                <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <p className="text-sm text-blue-700">
                    Read this part, then answer 1 question to unlock the next part.
                  </p>
                </div>
              )}
              {importantWords.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    ✨ <strong>{importantWords.length} important words</strong> are highlighted, and you can tap any word for a definition, part of speech, and speaker button.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        {/* Question Display */}
        {currentQ && currentQuestionIndex !== null && (
          <div className={retryQuestionIndex === currentQuestionIndex && !isAnswerRevealed ? "fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" : ""}>
            <Card className={retryQuestionIndex === currentQuestionIndex && !isAnswerRevealed ? "border-2 shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col" : "border-2 shadow-lg mb-6"}>
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-blue-600" />
                  Question {currentQuestionIndex + 1}
                </CardTitle>
                {retryQuestionIndex === currentQuestionIndex && !isAnswerRevealed && (
                  <CardDescription className="text-amber-700 font-medium">
                    Second chance: use the text on the left and the hint to answer.
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className={retryQuestionIndex === currentQuestionIndex && !isAnswerRevealed ? "flex-1 flex gap-6 overflow-hidden p-6" : "pt-6 space-y-4"}>
                {retryQuestionIndex === currentQuestionIndex && !isAnswerRevealed ? (
                  <div className="flex w-full">
                    {/* Left side: Story Text */}
                    <div className="w-1/2 flex flex-col bg-gradient-to-b from-amber-50 to-orange-50 rounded-lg border border-amber-200 overflow-hidden">
                      <div className="px-5 py-3 border-b border-amber-200 bg-amber-100">
                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Story Text — Use This</p>
                      </div>
                      <div className="overflow-y-auto flex-1 px-5 py-4 text-sm leading-7">
                        {renderStoryWithEmphasis(currentChunkText)}
                      </div>
                    </div>
                    {/* Right side: Question */}
                    <div className="w-1/2 flex flex-col space-y-4 overflow-y-auto">
                      <div>
                        <p className="text-xl font-bold text-gray-800 mb-4">
                          {currentQ.question}
                        </p>
                        {showHint && retryHint && (
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                            <p className="text-sm text-yellow-800">
                              <strong>Hint:</strong> {retryHint}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3 flex-1">
                        {currentQ.options.map((option: string, index: number) => (
                          <button
                            key={index}
                            onClick={() => handleAnswerSelect(index)}
                            disabled={isAnswerRevealed}
                            className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                              selectedAnswer === index
                                ? isAnswerRevealed
                                  ? index === currentQ.correctIndex
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-red-500 bg-red-50'
                                  : 'border-purple-500 bg-purple-50'
                                : isAnswerRevealed && index === currentQ.correctIndex
                                  ? 'border-green-500 bg-green-50'
                                  : 'border-gray-200 hover:border-purple-300'
                            } ${isAnswerRevealed ? 'cursor-default' : 'cursor-pointer'}`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-purple-600 text-lg">
                                {String.fromCharCode(65 + index)}.
                              </span>
                              <span className="flex-1">{option}</span>
                              {isAnswerRevealed && index === currentQ.correctIndex && (
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                              )}
                              {isAnswerRevealed && selectedAnswer === index && index !== currentQ.correctIndex && (
                                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-3 pt-4 mt-auto border-t">
                        {!isAnswerRevealed ? (
                          <Button
                            onClick={handleSubmitAnswer}
                            disabled={selectedAnswer === null}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                          >
                            Submit Second Chance
                          </Button>
                        ) : (
                          <Button
                            onClick={handleNextQuestion}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                          >
                            <>Continue Story <ArrowRight className="ml-2 w-4 h-4" /></>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-lg font-medium text-gray-800">
                      {currentQ.question}
                    </p>
                    {showHint && retryHint && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <strong>Hint:</strong> {retryHint}
                        </p>
                      </div>
                    )}
                    <div className="space-y-3">
                      {currentQ.options.map((option: string, index: number) => (
                        <button
                          key={index}
                          onClick={() => handleAnswerSelect(index)}
                          disabled={isAnswerRevealed}
                          className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                            selectedAnswer === index
                              ? isAnswerRevealed
                                ? index === currentQ.correctIndex
                                  ? 'border-green-500 bg-green-50'
                                  : 'border-red-500 bg-red-50'
                                : 'border-purple-500 bg-purple-50'
                              : isAnswerRevealed && index === currentQ.correctIndex
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 hover:border-purple-300'
                          } ${isAnswerRevealed ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-purple-600">
                              {String.fromCharCode(65 + index)}.
                            </span>
                            <span className="flex-1">{option}</span>
                            {isAnswerRevealed && index === currentQ.correctIndex && (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            )}
                            {isAnswerRevealed && selectedAnswer === index && index !== currentQ.correctIndex && (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                    {isAnswerRevealed && currentQ.explanation && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Explanation:</strong> {currentQ.explanation}
                        </p>
                      </div>
                    )}
                    <div className="flex gap-3">
                      {!isAnswerRevealed ? (
                        <Button
                          onClick={handleSubmitAnswer}
                          disabled={selectedAnswer === null}
                          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                        >
                          Submit Answer
                        </Button>
                      ) : (
                        <Button
                          onClick={handleNextQuestion}
                          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                        >
                          <>Continue Story <ArrowRight className="ml-2 w-4 h-4" /></>
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        {/* Action Buttons */}
        {currentQuestionIndex === null && story.length > 0 && (
          <div className="flex gap-3">
            {questionsAnswered < questions.length ? (
              <Button
                onClick={handleShowQuestion}
                disabled={questions.length === 0}
                className="flex-1 h-12 text-lg bg-gradient-to-r from-blue-600 to-purple-600"
              >
                {`Answer Question ${questionsAnswered + 1}`}
              </Button>
            ) : null}
            {questions.length > 0 && questionsAnswered >= questions.length && (
              <Button
                onClick={handleFinishSession}
                className="flex-1 h-12 text-lg bg-gradient-to-r from-green-600 to-teal-600"
              >
                <CheckCircle className="mr-2 w-5 h-5" />
                Finish & See Results
              </Button>
            )}
          </div>
        )}
        {activeWord ? (
          <div className="fixed bottom-4 right-4 z-40 w-[calc(100%-2rem)] max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl md:bottom-6 md:right-6">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Word Helper</p>
                <p className="text-2xl font-bold text-slate-900">{activeWord}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-full"
                  onClick={() => activeWord && speakWord(activeWord)}
                >
                  <Volume2 className="mr-2 h-4 w-4" />
                  Hear it
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-full"
                  disabled={isListening}
                  onClick={startPronunciationTest}
                >
                  {isListening ? (
                    <span className="flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Listening...</span>
                  ) : (
                    <span>Try Pronouncing</span>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 rounded-full p-0"
                  onClick={() => {
                    setActiveWord(null);
                    setActiveWordInsight(null);
                    setWordInsightError(null);
                    setRecognitionResult(null);
                    setRecognitionScore(null);
                    setRecognitionError(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-4 p-4">
              {wordInsightLoading ? (
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading word help...
                </div>
              ) : null}
              {wordInsightError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {wordInsightError}
                </div>
              ) : null}
              {activeWordInsight ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-cyan-100 bg-cyan-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">Pronunciation</p>
                    <p className="mt-1 text-lg font-semibold text-cyan-900">{activeWordInsight.pronunciation}</p>
                  </div>
                  {/* Pronunciation feedback UI */}
                  {(recognitionResult || recognitionError) && (
                    <div className="rounded-xl border border-green-100 bg-green-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-green-700 mb-1">Your Pronunciation</p>
                      {recognitionError ? (
                        <span className="text-red-700">{recognitionError}</span>
                      ) : (
                        <>
                          <span className="font-semibold text-green-900">{recognitionResult}</span>
                          {recognitionScore !== null && (
                            <span className="ml-2 text-sm font-medium">
                              {recognitionScore === 1 ? '✅ Great job!' : '❌ Try again'}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-violet-100 bg-violet-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">Definition</p>
                      <p className="mt-1 text-sm leading-6 text-violet-950">{activeWordInsight.definition}</p>
                    </div>
                    <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Word Type In This Sentence</p>
                      <p className="mt-1 text-lg font-semibold text-amber-900">{activeWordInsight.partOfSpeech}</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
      </>
    );
}

export default ReadingSession;
