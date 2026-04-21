const API_KEY_STORAGE = 'storyweaver-groq-key';

export const getApiKey = (): string | null => localStorage.getItem(API_KEY_STORAGE);
export const saveApiKey = (key: string) => localStorage.setItem(API_KEY_STORAGE, key.trim());
export const clearApiKey = () => localStorage.removeItem(API_KEY_STORAGE);
export const hasApiKey = (): boolean => Boolean(getApiKey());

// ─── Lexile helpers ─────────────────────────────────────────────────────────

const AG_FOR_LEXILE: Record<string, string> = {
  '200-400': 'a 6-7 year old (Grade 1-2)',
  '400-600': 'a 8-9 year old (Grade 3-4)',
  '600-800': 'a 10-11 year old (Grade 5-6)',
  '800-1000': 'a 12-13 year old (Grade 7-8)',
};

const SENTENCE_GUIDE_FOR_LEXILE: Record<string, string> = {
  '200-400': 'Use very short, simple sentences (5-10 words each). Basic vocabulary only.',
  '400-600': 'Use short to medium sentences (8-14 words). Include 8-12 interesting vocabulary words.',
  '600-800': 'Use varied sentence lengths (10-18 words). Include 12-16 rich vocabulary words.',
  '800-1000': 'Use complex sentences with subordinate clauses (12-22 words). Include 16-20 advanced vocabulary words.',
};

// Story structure scales directly with lexile: longer and richer at higher levels.
// Each level defines how many paragraphs and the word-count target so that
// one paragraph maps to one reading chunk before a comprehension question.
const STORY_STRUCTURE_GUIDE: Record<string, string> = {
  '200-400': 'Write exactly 4 short paragraphs separated by blank lines. Each paragraph: 35-50 words (~140-200 words total). One clear scene or action per paragraph.',
  '400-600': 'Write exactly 4 paragraphs separated by blank lines. Each paragraph: 65-85 words (~260-340 words total). Build a clear beginning, two middle scenes, and a satisfying ending.',
  '600-800': 'Write exactly 5 paragraphs separated by blank lines. Each paragraph: 95-130 words (~475-650 words total). Include rich scene-setting, rising action, a turning point, and resolution.',
  '800-1000': 'Write exactly 6 paragraphs separated by blank lines. Each paragraph: 135-175 words (~810-1050 words total). Develop characters deeply, build tension across multiple scenes, and craft a satisfying arc.',
};

const STORY_REQUIREMENTS_FOR_LEXILE: Record<string, {
  paragraphCount: number;
  minWordsPerParagraph: number;
  maxWordsPerParagraph: number;
  minTotalWords: number;
  maxTotalWords: number;
}> = {
  '200-400': {
    paragraphCount: 4,
    minWordsPerParagraph: 35,
    maxWordsPerParagraph: 50,
    minTotalWords: 140,
    maxTotalWords: 200,
  },
  '400-600': {
    paragraphCount: 4,
    minWordsPerParagraph: 65,
    maxWordsPerParagraph: 85,
    minTotalWords: 260,
    maxTotalWords: 340,
  },
  '600-800': {
    paragraphCount: 5,
    minWordsPerParagraph: 95,
    maxWordsPerParagraph: 130,
    minTotalWords: 475,
    maxTotalWords: 650,
  },
  '800-1000': {
    paragraphCount: 6,
    minWordsPerParagraph: 135,
    maxWordsPerParagraph: 175,
    minTotalWords: 810,
    maxTotalWords: 1050,
  },
};

const QUESTION_COUNT_FOR_LEXILE: Record<string, number> = {
  '200-400': 3,
  '400-600': 3,
  '600-800': 4,
  '800-1000': 5,
};

const IMPORTANT_WORDS_RANGE_FOR_LEXILE: Record<string, { min: number; max: number }> = {
  '200-400': { min: 14, max: 20 },
  '400-600': { min: 16, max: 24 },
  '600-800': { min: 20, max: 30 },
  '800-1000': { min: 24, max: 36 },
};

const COMMON_WORDS = new Set([
  'the', 'and', 'was', 'were', 'with', 'for', 'that', 'this', 'from', 'have', 'has', 'had',
  'they', 'them', 'their', 'there', 'then', 'than', 'into', 'onto', 'over', 'under', 'your',
  'you', 'our', 'ours', 'his', 'her', 'hers', 'its', 'it', 'a', 'an', 'to', 'of', 'in', 'on',
  'at', 'by', 'as', 'is', 'are', 'be', 'been', 'being', 'or', 'if', 'but', 'so', 'we', 'us',
  'he', 'she', 'my', 'me', 'i', 'not', 'very', 'just', 'only', 'all', 'any', 'can', 'could',
  'would', 'should', 'did', 'do', 'does', 'after', 'before', 'during', 'about', 'because',
  'what', 'when', 'where', 'which', 'who', 'how', 'up', 'down', 'out', 'off', 'again', 'still'
]);

export const normalizeImportantWords = (
  story: string,
  incomingWords: unknown,
  lexileLevel: string,
): string[] => {
  const range = IMPORTANT_WORDS_RANGE_FOR_LEXILE[lexileLevel] ?? IMPORTANT_WORDS_RANGE_FOR_LEXILE['400-600'];
  const maxWords = range.max;
  const minWords = range.min;

  const storyTokens = story.match(/[A-Za-z][A-Za-z'-]*/g) ?? [];
  const storyOriginalByLower = new Map<string, string>();

  for (const token of storyTokens) {
    const lower = token.toLowerCase();
    if (!storyOriginalByLower.has(lower)) {
      storyOriginalByLower.set(lower, token);
    }
  }

  const normalized: string[] = [];
  const seen = new Set<string>();

  if (Array.isArray(incomingWords)) {
    for (const raw of incomingWords) {
      if (typeof raw !== 'string') continue;
      const cleaned = raw.replace(/[^A-Za-z'-]/g, '');
      if (!cleaned) continue;
      const lower = cleaned.toLowerCase();
      if (COMMON_WORDS.has(lower) || lower.length < 4) continue;
      if (seen.has(lower)) continue;

      const exactInStory = storyOriginalByLower.get(lower);
      const finalWord = exactInStory ?? cleaned;
      normalized.push(finalWord);
      seen.add(lower);
      if (normalized.length >= maxWords) break;
    }
  }

  // If model under-returns, pad with meaningful story words so lexile targets are met.
  if (normalized.length < minWords) {
    const frequency = new Map<string, number>();
    for (const token of storyTokens) {
      const lower = token.toLowerCase();
      if (COMMON_WORDS.has(lower) || lower.length < 4) continue;
      frequency.set(lower, (frequency.get(lower) ?? 0) + 1);
    }

    const rankedCandidates = [...frequency.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([lower]) => lower);

    for (const lower of rankedCandidates) {
      if (seen.has(lower)) continue;
      const candidate = storyOriginalByLower.get(lower);
      if (!candidate) continue;
      normalized.push(candidate);
      seen.add(lower);
      if (normalized.length >= minWords || normalized.length >= maxWords) break;
    }
  }

  return normalized.slice(0, maxWords);
};

export const questionCountForLexile = (level: string): number =>
  QUESTION_COUNT_FOR_LEXILE[level] ?? 3;

export const getStoryRequirementsForLexile = (level: string) =>
  STORY_REQUIREMENTS_FOR_LEXILE[level] ?? STORY_REQUIREMENTS_FOR_LEXILE['400-600'];

const countWords = (text: string): number =>
  (text.match(/[A-Za-z][A-Za-z'-]*/g) ?? []).length;

const validateStoryForLexile = (story: string, lexileLevel: string): { valid: boolean; reason?: string } => {
  const requirements = getStoryRequirementsForLexile(lexileLevel);
  const paragraphs = story
    .split(/\n\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length !== requirements.paragraphCount) {
    return {
      valid: false,
      reason: `Use exactly ${requirements.paragraphCount} paragraphs separated by blank lines.`,
    };
  }

  const totalWords = countWords(story);
  if (totalWords < requirements.minTotalWords || totalWords > requirements.maxTotalWords) {
    return {
      valid: false,
      reason: `Keep the story between ${requirements.minTotalWords} and ${requirements.maxTotalWords} words total.`,
    };
  }

  const shortParagraph = paragraphs.find(
    (paragraph) => countWords(paragraph) < requirements.minWordsPerParagraph,
  );
  if (shortParagraph) {
    return {
      valid: false,
      reason: `Every paragraph must be at least ${requirements.minWordsPerParagraph} words. Avoid tiny one-line paragraphs or sound-effect-only paragraphs.`,
    };
  }

  return { valid: true };
};

// ─── Shared fetch ─────────────────────────────────────────────────────────────

const callOpenAI = async (messages: { role: string; content: string }[], jsonMode = true): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('NO_API_KEY');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.8,
      response_format: jsonMode ? { type: 'json_object' } : undefined,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    if (response.status === 401) throw new Error('INVALID_API_KEY');
    throw new Error(`Groq error ${response.status}: ${text}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

// ─── Story + words generation ─────────────────────────────────────────────────

export interface GeneratedStory {
  story: string;
  importantWords: string[];
}

export interface WordInsight {
  word: string;
  definition: string;
  partOfSpeech: string;
  pronunciation: string;
}

const FALLBACK_WORD_DEFINITIONS: Record<string, string> = {
  cheered: "shouted happily to show support",
  colorful: "full of bright, different colors",
  quarterback: "the football player who leads many plays and throws passes",
  receiver: "a football player who catches passes",
  jumped: "moved quickly upward or off the ground",
  screamed: "yelled very loudly",
  grinned: "smiled very widely",
  confetti: "small pieces of colored paper used in celebrations",
  sparkly: "shiny with small flashes of light",
  trophy: "an award given for winning",
  championship: "the final contest to decide the winner",
  veteran: "someone with a lot of experience",
  spiral: "a pass that spins in a tight corkscrew shape",
  precision: "great accuracy and careful control",
  deafening: "extremely loud",
  dazzling: "very bright and impressive",
  gleaming: "shining brightly",
  magnificent: "very beautiful and impressive",
  dedication: "strong commitment to keep working toward a goal",
  trembling: "shaking slightly, often from strong emotion",
};

const LANGUAGE_TO_DICTIONARY_CODE: Record<string, string> = {
  English: 'en',
  Spanish: 'es',
  French: 'fr',
  Hindi: 'hi',
  Arabic: 'ar',
  Portuguese: 'pt-BR',
};

export const generateStory = async (
  theme: string,
  lexileLevel: string,
  outputLanguage = 'English',
): Promise<GeneratedStory> => {
  const ageGroup = AG_FOR_LEXILE[lexileLevel] ?? AG_FOR_LEXILE['400-600'];
  const sentenceGuide = SENTENCE_GUIDE_FOR_LEXILE[lexileLevel] ?? SENTENCE_GUIDE_FOR_LEXILE['400-600'];
  const storyStructureGuide = STORY_STRUCTURE_GUIDE[lexileLevel] ?? STORY_STRUCTURE_GUIDE['400-600'];
  const importantWordsRange = IMPORTANT_WORDS_RANGE_FOR_LEXILE[lexileLevel] ?? IMPORTANT_WORDS_RANGE_FOR_LEXILE['400-600'];

  const basePrompt = `You are a children's author writing in the style of Geronimo Stilton — fun, fast-paced, and full of vivid descriptions. Generate an engaging story for ${ageGroup} about: "${theme}".

Geronimo Stilton style rules:
- Adventurous, humorous, warm-hearted tone
- Strong visual descriptions that put the reader right in the scene
- Characters that feel relatable and enthusiastic
- Frequent use of sound words and exclamations in the narrative
- The story must be emotionally safe, age-appropriate, and classroom-friendly
- Avoid scary, graphic, sexual, hateful, or stereotype-based content
- Avoid instructions for harmful real-world behavior, risky dares, or weapon details
- Do not include inline vocabulary definitions or glossary-style parentheses in the story (for example: "word (meaning ...)").
- Keep vocabulary learning separate: the story should read naturally without defining terms in-line.
- ${sentenceGuide}
- ${storyStructureGuide}
- Separate each paragraph with a blank line in the "story" field so paragraphs are divided by \\n\\n.
- Write the story fully in ${outputLanguage}. Keep the vocabulary natural in that language while staying age-appropriate.

Also identify the most important/interesting vocabulary words from the story — words that are worth highlighting to build the reader's vocabulary. These will be rendered in colorful, eye-catching fonts exactly like Geronimo Stilton books.

Return JSON with exactly this shape:
{
  "story": "<the full story text>",
  "importantWords": ["word1", "word2", ...]
}

importantWords rules:
- Return ${importantWordsRange.min}-${importantWordsRange.max} words (strictly follow this range)
- Include vivid adjectives, strong verbs, and topic-specific nouns
- Single words only (no phrases)
- Use the exact spelling/capitalisation as they appear in the story
- Do NOT include extremely common words like "the", "and", "was"`;

  let lastValidationError = 'Story generation did not satisfy the lexile structure requirements.';
  let fallbackStory: string | null = null;
  let fallbackImportantWords: unknown = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    const prompt = attempt === 0
      ? basePrompt
      : `${basePrompt}\n\nIMPORTANT: The previous attempt failed this requirement: ${lastValidationError}\nRewrite the full story and satisfy the structure exactly.`;

    const raw = await callOpenAI([{ role: 'user', content: prompt }]);
    const parsed = JSON.parse(raw);

    if (!parsed.story || !Array.isArray(parsed.importantWords)) {
      throw new Error('Unexpected response shape from OpenAI');
    }

    fallbackStory = parsed.story;
    fallbackImportantWords = parsed.importantWords;

    const validation = validateStoryForLexile(parsed.story, lexileLevel);
    if (validation.valid) {
      return {
        story: parsed.story,
        importantWords: normalizeImportantWords(parsed.story, parsed.importantWords, lexileLevel),
      };
    }

    lastValidationError = validation.reason ?? lastValidationError;
  }

  if (fallbackStory) {
    return {
      story: fallbackStory,
      importantWords: normalizeImportantWords(fallbackStory, fallbackImportantWords, lexileLevel),
    };
  }

  throw new Error(lastValidationError);
};

// ─── Comprehension questions ──────────────────────────────────────────────────

export interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface GeneratedQuestions {
  questions: Question[];
}

export const generateQuestions = async (
  story: string,
  lexileLevel: string,
  outputLanguage = 'English',
): Promise<GeneratedQuestions> => {
  const ageGroup = AG_FOR_LEXILE[lexileLevel] ?? AG_FOR_LEXILE['400-600'];
  const questionCount = QUESTION_COUNT_FOR_LEXILE[lexileLevel] ?? 3;

  const prompt = `You are an educational content creator. Based on the following story, create ${questionCount} comprehension questions for ${ageGroup}.

Story:
"""
${story}
"""

Question guidelines:
- Mix of literal (what happened) and inferential (why/how) questions
- 4 answer options each, with exactly one correct answer
- Distractors should be plausible but clearly wrong on close reading
- Explanation should reference the specific text evidence
- Language appropriate for ${ageGroup}
- Keep all questions, answer options, and explanations in ${outputLanguage}
- Keep the content safe, age-appropriate, non-graphic, and free of stereotypes
- Return exactly ${questionCount} questions (no more, no fewer)

Return JSON with this exact shape:
{
  "questions": [
    {
      "question": "...",
      "options": ["A text", "B text", "C text", "D text"],
      "correctIndex": 0,
      "explanation": "..."
    }
  ]
}`;

  const raw = await callOpenAI([{ role: 'user', content: prompt }]);
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed.questions)) throw new Error('Unexpected questions shape');
  return { questions: parsed.questions };
};

// ─── Question breakdown / simplification ──────────────────────────────────────

export interface SimplifiedQuestion {
  simplifiedQuestion: string;
  options: string[];
  correctIndex: number;
  hint: string;
}

export const breakdownQuestion = async (
  question: string,
  story: string,
  lexileLevel: string,
  outputLanguage = 'English',
): Promise<SimplifiedQuestion | null> => {
  const ageGroup = AG_FOR_LEXILE[lexileLevel] ?? AG_FOR_LEXILE['400-600'];

  const prompt = `A student answered this comprehension question incorrectly. Simplify it to help them understand.

Original question: "${question}"

Story excerpt:
"""
${story.substring(0, 600)}
"""

Create a simpler version of the question for ${ageGroup} who is struggling, keeping the same 4 answer options but wording them more simply. Add a helpful hint pointing to where in the story the answer can be found.
Keep the simplified question, options, and hint in ${outputLanguage}.

Return JSON:
{
  "simplifiedQuestion": "...",
  "options": ["A text", "B text", "C text", "D text"],
  "correctIndex": 0,
  "hint": "..."
}`;

  try {
    const raw = await callOpenAI([{ role: 'user', content: prompt }]);
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const inferPartOfSpeechFallback = (word: string): string => {
  const lower = word.toLowerCase();
  if (lower.endsWith('ly')) return 'adverb';
  if (lower.endsWith('ing') || lower.endsWith('ed')) return 'verb';
  if (lower.endsWith('ous') || lower.endsWith('ful') || lower.endsWith('ive') || lower.endsWith('al')) return 'adjective';
  return 'noun';
};

const getSentenceForWord = (storyExcerpt: string, word: string): string => {
  const target = word.toLowerCase();
  const sentences = storyExcerpt
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const match = sentences.find((sentence) => {
    const tokens = sentence.match(/[A-Za-z][A-Za-z'-]*/g) ?? [];
    return tokens.some((token) => token.toLowerCase() === target);
  });

  return match || sentences[0] || storyExcerpt.slice(0, 160);
};

const buildContextualFallbackDefinition = (word: string, storyExcerpt: string): string => {
  const exact = FALLBACK_WORD_DEFINITIONS[word.toLowerCase()];
  if (exact) return exact;

  const partOfSpeech = inferPartOfSpeechFallback(word);
  const sentence = getSentenceForWord(storyExcerpt, word);

  if (partOfSpeech === 'verb') {
    return `an action word in this story (as used in: "${sentence.slice(0, 120)}...")`;
  }

  if (partOfSpeech === 'adjective') {
    return `a describing word that adds detail in this sentence: "${sentence.slice(0, 120)}..."`;
  }

  if (partOfSpeech === 'adverb') {
    return `a word that explains how something happened in this sentence: "${sentence.slice(0, 120)}..."`;
  }

  return `a key person, place, thing, or idea in this part of the story: "${sentence.slice(0, 120)}..."`;
};

const normalizeLookupWord = (word: string): string =>
  word
    .trim()
    .toLowerCase()
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');

const lookupDictionaryDefinition = async (
  word: string,
  outputLanguage: string,
): Promise<WordInsight | null> => {
  const normalized = normalizeLookupWord(word);
  if (!normalized) return null;

  const languageCode = LANGUAGE_TO_DICTIONARY_CODE[outputLanguage] || 'en';

  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/${languageCode}/${encodeURIComponent(normalized)}`);
    if (!response.ok) return null;

    const parsed = await response.json();
    if (!Array.isArray(parsed) || parsed.length === 0) return null;

    const entry = parsed[0] || {};
    const meaning = Array.isArray(entry.meanings) ? entry.meanings[0] : null;
    const definition = meaning?.definitions?.[0]?.definition;
    const partOfSpeech = meaning?.partOfSpeech;
    const phonetic = entry.phonetic || (Array.isArray(entry.phonetics) ? entry.phonetics.find((p: any) => p?.text)?.text : undefined);

    if (!definition || isGenericDefinition(definition)) return null;

    return {
      word,
      definition,
      partOfSpeech: partOfSpeech || inferPartOfSpeechFallback(word),
      pronunciation: phonetic || word,
    };
  } catch {
    return null;
  }
};

const isGenericDefinition = (value: unknown): boolean => {
  if (typeof value !== 'string') return true;
  const normalized = value.toLowerCase().trim();
  if (!normalized) return true;

  return (
    normalized.includes('important story word') ||
    normalized.includes('use the sentence around it') ||
    normalized.includes('use context') ||
    normalized.includes('understand what it describes or does') ||
    normalized.length < 12
  );
};

export const getWordInsight = async (
  word: string,
  storyExcerpt: string,
  outputLanguage = 'English',
): Promise<WordInsight> => {
  const fallback: WordInsight = {
    word,
    definition: buildContextualFallbackDefinition(word, storyExcerpt),
    partOfSpeech: inferPartOfSpeechFallback(word),
    pronunciation: word,
  };

  try {
    const dictionaryResult = await lookupDictionaryDefinition(word, outputLanguage);
    if (dictionaryResult) {
      return dictionaryResult;
    }

    const prompt = `You are helping a child learn vocabulary from a story.

Word: "${word}"
Story excerpt:
"""
${storyExcerpt.slice(0, 900)}
"""

Return a student-friendly vocabulary card in ${outputLanguage}. Keep it brief, accurate, and age-appropriate.
Identify the word's part of speech as it is used in the sentence (noun, verb, adjective, adverb, etc.).
Give a simple pronunciation guide that helps a child say it out loud.
Do not give vague definitions like "use context" or "important word". Give the real meaning used in this story.

Return JSON:
{
  "word": "${word}",
  "definition": "...",
  "partOfSpeech": "...",
  "pronunciation": "..."
}`;

    const raw = await callOpenAI([{ role: 'user', content: prompt }]);
    const parsed = JSON.parse(raw);

    if (!parsed.definition || !parsed.partOfSpeech || !parsed.pronunciation) {
      return fallback;
    }

    if (isGenericDefinition(parsed.definition)) {
      return fallback;
    }

    return {
      word: parsed.word || word,
      definition: parsed.definition,
      partOfSpeech: parsed.partOfSpeech,
      pronunciation: parsed.pronunciation,
    };
  } catch {
    return fallback;
  }
};
