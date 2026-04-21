import { mcpStorageGetLocal, mcpStorageSetLocal } from "./mcpStorage";

export type AccountRole = 'parent' | 'student' | 'teacher';

export interface LocalAccount {
  id: string;
  email: string;
  password: string;
  name: string;
  role: AccountRole;
  linkedParentId?: string;
  createdAt: string;
}

const ACCOUNTS_STORAGE_KEY = 'storyweaver-local-accounts-v1';
const LEGACY_ACCOUNTS_STORAGE_KEY = 'readsmart-local-accounts-v1';
const ACCOUNTS_MCP_KEY = 'accounts-v1';

let accountsHydrationPromise: Promise<LocalAccount[] | null> | null = null;

const DEMO_PARENT: LocalAccount = {
  id: 'parent-demo-001',
  email: 'parent@gmail.com',
  password: 'password123',
  name: 'Demo Parent',
  role: 'parent',
  createdAt: new Date(2026, 0, 1).toISOString(),
};

const DEMO_STUDENT: LocalAccount = {
  id: 'student-demo-001',
  email: 'braden@gmail.com',
  password: 'braden',
  name: 'Braden Weaver',
  role: 'student',
  linkedParentId: DEMO_PARENT.id,
  createdAt: new Date(2026, 0, 1).toISOString(),
};

const DEMO_TEACHER: LocalAccount = {
  id: 'teacher-demo-001',
  email: 'teacher@gmail.com',
  password: 'password123',
  name: 'Ms. Rivera',
  role: 'teacher',
  createdAt: new Date(2026, 0, 1).toISOString(),
};

const DEMO_CLASS_CODE = 'RIVERA2026';

const DEMO_STUDENT_COHORT: LocalAccount[] = [
  DEMO_STUDENT,
  {
    id: 'student-demo-002',
    email: 'sibling@gmail.com',
    password: 'password123',
    name: 'Casey Carter',
    role: 'student',
    linkedParentId: DEMO_PARENT.id,
    createdAt: new Date(2026, 0, 1).toISOString(),
  },
  { id: 'student-demo-003', email: 'student3@gmail.com', password: 'password123', name: 'Avery Stone', role: 'student', createdAt: new Date(2026, 0, 2).toISOString() },
  { id: 'student-demo-004', email: 'student4@gmail.com', password: 'password123', name: 'Jordan Lee', role: 'student', createdAt: new Date(2026, 0, 2).toISOString() },
  { id: 'student-demo-005', email: 'student5@gmail.com', password: 'password123', name: 'Mia Patel', role: 'student', createdAt: new Date(2026, 0, 2).toISOString() },
  { id: 'student-demo-006', email: 'student6@gmail.com', password: 'password123', name: 'Noah Brooks', role: 'student', createdAt: new Date(2026, 0, 3).toISOString() },
  { id: 'student-demo-007', email: 'student7@gmail.com', password: 'password123', name: 'Liam Chen', role: 'student', createdAt: new Date(2026, 0, 3).toISOString() },
  { id: 'student-demo-008', email: 'student8@gmail.com', password: 'password123', name: 'Emma Diaz', role: 'student', createdAt: new Date(2026, 0, 3).toISOString() },
  { id: 'student-demo-009', email: 'student9@gmail.com', password: 'password123', name: 'Lucas Reed', role: 'student', createdAt: new Date(2026, 0, 4).toISOString() },
  { id: 'student-demo-010', email: 'student10@gmail.com', password: 'password123', name: 'Olivia Park', role: 'student', createdAt: new Date(2026, 0, 4).toISOString() },
  { id: 'student-demo-011', email: 'student11@gmail.com', password: 'password123', name: 'Ethan Ross', role: 'student', createdAt: new Date(2026, 0, 4).toISOString() },
  { id: 'student-demo-012', email: 'student12@gmail.com', password: 'password123', name: 'Sophia King', role: 'student', createdAt: new Date(2026, 0, 5).toISOString() },
  { id: 'student-demo-013', email: 'student13@gmail.com', password: 'password123', name: 'Mason Cruz', role: 'student', createdAt: new Date(2026, 0, 5).toISOString() },
  { id: 'student-demo-014', email: 'student14@gmail.com', password: 'password123', name: 'Isla Turner', role: 'student', createdAt: new Date(2026, 0, 5).toISOString() },
  { id: 'student-demo-015', email: 'student15@gmail.com', password: 'password123', name: 'Logan Bell', role: 'student', createdAt: new Date(2026, 0, 6).toISOString() },
  { id: 'student-demo-016', email: 'student16@gmail.com', password: 'password123', name: 'Ava Nguyen', role: 'student', createdAt: new Date(2026, 0, 6).toISOString() },
  { id: 'student-demo-017', email: 'student17@gmail.com', password: 'password123', name: 'Elijah Scott', role: 'student', createdAt: new Date(2026, 0, 6).toISOString() },
  { id: 'student-demo-018', email: 'student18@gmail.com', password: 'password123', name: 'Harper Young', role: 'student', createdAt: new Date(2026, 0, 7).toISOString() },
  { id: 'student-demo-019', email: 'student19@gmail.com', password: 'password123', name: 'James Allen', role: 'student', createdAt: new Date(2026, 0, 7).toISOString() },
  { id: 'student-demo-020', email: 'student20@gmail.com', password: 'password123', name: 'Ella Wright', role: 'student', createdAt: new Date(2026, 0, 7).toISOString() },
  { id: 'student-demo-021', email: 'student21@gmail.com', password: 'password123', name: 'Benjamin Hill', role: 'student', createdAt: new Date(2026, 0, 8).toISOString() },
  { id: 'student-demo-022', email: 'student22@gmail.com', password: 'password123', name: 'Aria Foster', role: 'student', createdAt: new Date(2026, 0, 8).toISOString() },
  { id: 'student-demo-023', email: 'student23@gmail.com', password: 'password123', name: 'Henry Price', role: 'student', createdAt: new Date(2026, 0, 8).toISOString() },
  { id: 'student-demo-024', email: 'student24@gmail.com', password: 'password123', name: 'Zoe Bennett', role: 'student', createdAt: new Date(2026, 0, 9).toISOString() },
  { id: 'student-demo-025', email: 'student25@gmail.com', password: 'password123', name: 'Daniel Ward', role: 'student', createdAt: new Date(2026, 0, 9).toISOString() },
];

const INTEREST_ROTATION = [
  ['adventure', 'explore', 'quest'],
  ['animals', 'nature', 'wildlife'],
  ['science', 'space', 'technology'],
  ['sports', 'games', 'competition'],
  ['history', 'ancient', 'culture'],
  ['mystery', 'clues', 'detective'],
  ['friendship', 'family', 'kindness'],
  ['fantasy', 'magic', 'dragons'],
];

const LEXILE_ROTATION = ['200-400', '400-600', '600-800', '800-1000'];

const STORY_TEMPLATES = [
  { title: 'Robot Friends', topicId: 'robot-friends', genre: 'Fiction', summary: 'A student and a helpful robot learn teamwork through a challenge.' },
  { title: 'Ancient Egypt', topicId: 'ancient-egypt', genre: 'History / Nonfiction', summary: 'A journey through pyramids and clues from ancient civilizations.' },
  { title: 'Mission to Mars', topicId: 'mission-to-mars', genre: 'Science', summary: 'A space mission story focused on problem-solving and bravery.' },
  { title: 'Lost Treasure', topicId: 'lost-treasure', genre: 'Adventure', summary: 'A map, a mystery, and smart choices lead to a surprising discovery.' },
  { title: 'Super Bowl Highlights', topicId: 'super-bowl-2026', genre: 'Sports', summary: 'A game-day narrative exploring pressure, teamwork, and confidence.' },
];

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const getStoredAccounts = (): LocalAccount[] => {
  const currentRaw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
  const legacyRaw = localStorage.getItem(LEGACY_ACCOUNTS_STORAGE_KEY);
  const raw = currentRaw ?? legacyRaw;
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    if (!currentRaw && legacyRaw) {
      saveStoredAccounts(parsed);
      localStorage.removeItem(LEGACY_ACCOUNTS_STORAGE_KEY);
    }

    return parsed;
  } catch {
    return [];
  }
};

export const saveStoredAccounts = (accounts: LocalAccount[]) => {
  localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  void mcpStorageSetLocal(ACCOUNTS_MCP_KEY, accounts);
};

export const hydrateAccountsFromMcp = async (): Promise<LocalAccount[] | null> => {
  if (accountsHydrationPromise) {
    return accountsHydrationPromise;
  }

  accountsHydrationPromise = (async () => {
    const remoteAccounts = await mcpStorageGetLocal<LocalAccount[]>(ACCOUNTS_MCP_KEY);
    if (!Array.isArray(remoteAccounts) || remoteAccounts.length === 0) {
      return null;
    }

    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(remoteAccounts));
    return remoteAccounts;
  })();

  try {
    return await accountsHydrationPromise;
  } finally {
    accountsHydrationPromise = null;
  }
};

const setIfMissing = (key: string, value: unknown) => {
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

const buildDemoHistory = (studentName: string, studentIndex: number, lexile: string) => {
  const count = 3 + (studentIndex % 3);
  return Array.from({ length: count }).map((_, entryIndex) => {
    const template = STORY_TEMPLATES[(studentIndex + entryIndex) % STORY_TEMPLATES.length];
    const questionsAnswered = 3 + ((studentIndex + entryIndex) % 2);
    const questionsCorrect = Math.max(1, questionsAnswered - ((studentIndex + entryIndex) % 2));
    const wordsRead = 170 + ((studentIndex * 23 + entryIndex * 17) % 260);
    const date = new Date(Date.now() - ((studentIndex * 2 + entryIndex) * 24 * 60 * 60 * 1000));
    const storyExcerpt = `${studentName} explored ${template.title.toLowerCase()} and discovered important clues about teamwork, problem-solving, and confidence while reading at their current level.`;

    return {
      id: `hist-${studentIndex + 1}-${entryIndex + 1}`,
      topicId: template.topicId,
      title: template.title,
      genre: template.genre,
      summary: template.summary,
      storyExcerpt,
      wordsRead,
      lexileLevel: lexile,
      questionsAnswered,
      questionsCorrect,
      accuracy: Math.round((questionsCorrect / questionsAnswered) * 100),
      timestamp: date.toISOString(),
      dateRead: date.toLocaleDateString(),
    };
  });
};

const seedDemoStudentDataset = (accounts: LocalAccount[]) => {
  const demoStudents = DEMO_STUDENT_COHORT
    .map((demo) => accounts.find((account) => normalizeEmail(account.email) === normalizeEmail(demo.email)))
    .filter(Boolean) as LocalAccount[];

  demoStudents.forEach((student, index) => {
    const lexileLevel = LEXILE_ROTATION[index % LEXILE_ROTATION.length];
    const interests = INTEREST_ROTATION[index % INTEREST_ROTATION.length];
    const grade = 2 + (index % 4);

    const profile = {
      name: student.name,
      grade,
      homeLanguage: 'English',
      storyLanguage: 'English',
      interestIds: interests,
      interests,
      lexileLevel,
      diagnostic: {
        startingLexile: lexileLevel,
        recommendedLexile: lexileLevel,
        questionsAnswered: 12,
        totalQuestions: 12,
        correctAnswers: 8 + (index % 4),
        scorePercentage: 67 + (index % 28),
        byPassage: [
          { passageId: 0, questions: 4, correct: 3, accuracy: 75 },
          { passageId: 1, questions: 4, correct: 3, accuracy: 75 },
          { passageId: 2, questions: 4, correct: 2 + (index % 3), accuracy: 50 + ((index % 3) * 25) },
        ],
      },
      createdAt: student.createdAt,
    };

    const history = buildDemoHistory(student.name, index, lexileLevel);
    const latestReading = history[0];

    setIfMissing(`userProfile-${student.id}`, profile);
    setIfMissing(`readingHistory-${student.id}`, history);
    setIfMissing(`bookclub-classes-${student.id}`, [
      {
        code: DEMO_CLASS_CODE,
        teacherName: DEMO_TEACHER.name,
        className: 'Rivera Reading Crew',
        emoji: '📘',
        joinedAt: new Date(2026, 0, 10).toISOString(),
        recommendedTopicIds: ['ancient-egypt', 'space-science', 'sports-champions'],
        challengeGoal: 120,
        challengeDeadline: 'May 15, 2026',
        challengeName: 'Rivera Spring Reading Sprint',
      },
    ]);
    setIfMissing(`bookclub-minutes-${student.id}`, 35 + ((index * 7) % 90));
    setIfMissing(`currentReading-${student.id}`, latestReading);
  });

  setIfMissing(`teacher-class-roster-${DEMO_TEACHER.id}`, {
    classCode: DEMO_CLASS_CODE,
    className: 'Rivera Reading Crew',
    studentIds: demoStudents.map((student) => student.id),
  });
};

export const ensureDemoAccounts = () => {
  const accounts = getStoredAccounts();
  const demoAccounts: LocalAccount[] = [DEMO_PARENT, DEMO_TEACHER, ...DEMO_STUDENT_COHORT];

  const existingByEmail = new Set(accounts.map((account) => normalizeEmail(account.email)));
  const missingDemoAccounts = demoAccounts.filter(
    (demo) => !existingByEmail.has(normalizeEmail(demo.email)),
  );

  const mergedAccounts = missingDemoAccounts.length > 0 ? [...accounts, ...missingDemoAccounts] : accounts;
  let didMigrateDemoStudent = false;

  // Keep existing seeded workspaces in sync with current demo personas.
  const nextAccounts = mergedAccounts.map((account) => {
    if (account.id === DEMO_STUDENT.id && account.role === 'student') {
      const needsUpdate =
        account.name !== DEMO_STUDENT.name ||
        normalizeEmail(account.email) !== normalizeEmail(DEMO_STUDENT.email) ||
        account.password !== DEMO_STUDENT.password ||
        account.linkedParentId !== DEMO_STUDENT.linkedParentId;

      if (!needsUpdate) {
        return account;
      }

      didMigrateDemoStudent = true;
      return {
        ...account,
        name: DEMO_STUDENT.name,
        email: DEMO_STUDENT.email,
        password: DEMO_STUDENT.password,
        linkedParentId: DEMO_STUDENT.linkedParentId,
      };
    }
    return account;
  });

  if (missingDemoAccounts.length > 0 || didMigrateDemoStudent) {
    saveStoredAccounts(nextAccounts);
  }

  const demoStudentProfileKey = `userProfile-${DEMO_STUDENT.id}`;
  const demoStudentProfileRaw = localStorage.getItem(demoStudentProfileKey);
  if (demoStudentProfileRaw) {
    try {
      const parsed = JSON.parse(demoStudentProfileRaw);
      if (parsed?.name !== DEMO_STUDENT.name) {
        localStorage.setItem(
          demoStudentProfileKey,
          JSON.stringify({
            ...parsed,
            name: DEMO_STUDENT.name,
          }),
        );
      }
    } catch {
      // Ignore malformed profile cache and allow seed logic to recover.
    }
  }

  const demoStudentClassKey = `bookclub-classes-${DEMO_STUDENT.id}`;
  const demoStudentClassRaw = localStorage.getItem(demoStudentClassKey);
  const requiredClassEntry = {
    code: DEMO_CLASS_CODE,
    teacherName: DEMO_TEACHER.name,
    className: 'Rivera Reading Crew',
    emoji: '📘',
    joinedAt: new Date(2026, 0, 10).toISOString(),
    recommendedTopicIds: ['ancient-egypt', 'space-science', 'sports-champions'],
    challengeGoal: 120,
    challengeDeadline: 'May 15, 2026',
    challengeName: 'Rivera Spring Reading Sprint',
  };

  try {
    const parsedClasses = demoStudentClassRaw ? JSON.parse(demoStudentClassRaw) : [];
    const classesArray = Array.isArray(parsedClasses) ? parsedClasses : [];
    const hasRiveraClass = classesArray.some((entry) => entry?.code === DEMO_CLASS_CODE);
    if (!hasRiveraClass) {
      localStorage.setItem(demoStudentClassKey, JSON.stringify([requiredClassEntry, ...classesArray]));
    }
  } catch {
    localStorage.setItem(demoStudentClassKey, JSON.stringify([requiredClassEntry]));
  }

  const teacherRosterKey = `teacher-class-roster-${DEMO_TEACHER.id}`;
  const teacherRosterRaw = localStorage.getItem(teacherRosterKey);
  try {
    const parsedRoster = teacherRosterRaw ? JSON.parse(teacherRosterRaw) : {};
    const rosterStudentIds = Array.isArray(parsedRoster?.studentIds) ? parsedRoster.studentIds : [];
    if (!rosterStudentIds.includes(DEMO_STUDENT.id)) {
      const updatedStudentIds = [...new Set([...rosterStudentIds, DEMO_STUDENT.id])];
      localStorage.setItem(
        teacherRosterKey,
        JSON.stringify({
          classCode: parsedRoster?.classCode || DEMO_CLASS_CODE,
          className: parsedRoster?.className || 'Rivera Reading Crew',
          studentIds: updatedStudentIds,
        }),
      );
    }
  } catch {
    localStorage.setItem(
      teacherRosterKey,
      JSON.stringify({
        classCode: DEMO_CLASS_CODE,
        className: 'Rivera Reading Crew',
        studentIds: [DEMO_STUDENT.id],
      }),
    );
  }

  const currentUserRaw = localStorage.getItem('currentUser');
  if (currentUserRaw) {
    try {
      const currentUser = JSON.parse(currentUserRaw);
      if (currentUser?.id === DEMO_STUDENT.id) {
        localStorage.setItem(
          'currentUser',
          JSON.stringify({
            ...currentUser,
            name: DEMO_STUDENT.name,
            email: DEMO_STUDENT.email,
            linkedParentId: DEMO_STUDENT.linkedParentId,
          }),
        );
      }
    } catch {
      // Ignore malformed currentUser cache.
    }
  }

  const teacherRecommendationsRaw = localStorage.getItem('teacher-recommendations');
  try {
    const parsed = teacherRecommendationsRaw ? JSON.parse(teacherRecommendationsRaw) : {};
    if (!parsed?.[DEMO_STUDENT.id]) {
      const next = {
        ...parsed,
        [DEMO_STUDENT.id]: {
          storyweaverSuggestion: 'Lost Treasure Adventure',
          amazonSuggestion: 'The Crossover by Kwame Alexander',
          teacherNote: 'Keep momentum with high-interest sports and adventure texts.',
          assignedAt: new Date().toISOString(),
        },
      };
      localStorage.setItem('teacher-recommendations', JSON.stringify(next));
    }
  } catch {
    localStorage.setItem(
      'teacher-recommendations',
      JSON.stringify({
        [DEMO_STUDENT.id]: {
          storyweaverSuggestion: 'Lost Treasure Adventure',
          amazonSuggestion: 'The Crossover by Kwame Alexander',
          teacherNote: 'Keep momentum with high-interest sports and adventure texts.',
          assignedAt: new Date().toISOString(),
        },
      }),
    );
  }

  void mcpStorageSetLocal(ACCOUNTS_MCP_KEY, nextAccounts);

  seedDemoStudentDataset(nextAccounts);
  return nextAccounts;
};

export const createLocalAccount = (input: {
  email: string;
  password: string;
  name: string;
  role: AccountRole;
  linkedParentId?: string;
}) => {
  const accounts = getStoredAccounts();
  const email = normalizeEmail(input.email);

  const duplicate = accounts.find(account => normalizeEmail(account.email) === email);
  if (duplicate) {
    return { success: false as const, error: 'An account with this email already exists.' };
  }

  const account: LocalAccount = {
    id: `${input.role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email,
    password: input.password,
    name: input.name.trim(),
    role: input.role,
    linkedParentId: input.linkedParentId,
    createdAt: new Date().toISOString(),
  };

  saveStoredAccounts([...accounts, account]);
  return { success: true as const, account };
};

export const authenticateLocalAccount = (email: string, password: string, role: AccountRole) => {
  const accounts = getStoredAccounts();
  const normalizedEmail = normalizeEmail(email);

  const account = accounts.find(
    existing =>
      normalizeEmail(existing.email) === normalizedEmail &&
      existing.password === password &&
      existing.role === role,
  );

  if (!account) {
    return { success: false as const, error: 'Invalid email or password for this account type.' };
  }

  return { success: true as const, account };
};

export const setCurrentUser = (account: LocalAccount) => {
  localStorage.setItem('userId', account.id);
  localStorage.setItem('currentUser', JSON.stringify(account));
  localStorage.setItem('userRole', account.role);
};

export const clearCurrentUser = () => {
  localStorage.removeItem('userId');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userProfile');
};
