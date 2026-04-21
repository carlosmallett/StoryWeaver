# StoryWeaver - Adaptive Reading Platform

## Overview
A comprehensive AI-powered educational reading platform for grades 1-5 that generates Lexile-aligned stories with dynamic typography and adaptive comprehension questioning.

## Key Features

### 1. **Student Experience**
- **Interest Quiz & Diagnostic**: Initial assessment to determine reading level and interests
- **Dynamic Topic Library**: Fiction and non-fiction stories with "New This Week" section
- **Adaptive Reading Sessions**: 
  - Stories generated at appropriate Lexile levels (200L-1000L)
  - Dynamic typography emphasizing key words (Geronimo Stilton-style)
  - Periodic comprehension questions
  - Adaptive question breakdown when student struggles
  - Real-time reading level adjustment based on performance

### 2. **Parent Dashboard**
- Total words read
- Pages completed
- Questions answered and accuracy
- Progress broken down by Lexile level
- Student profile and interests

### 3. **Adaptive Intelligence**
- **Two-Step Word Evaluation**:
  - Step 1: AI identifies semantically important words
  - Step 2: Dynamic font styling applied to key words
- **Adaptive Questioning**:
  - Questions generated based on story content
  - Breaks down questions if answered incorrectly
  - Adjusts reading level after persistent struggle
- **RAG-Powered Generation**: Stories use sample texts as context

## Technical Architecture

### Frontend (React + React Router)
- `/` - Welcome page
- `/quiz` - Interest quiz and diagnostic
- `/library` - Topic selection
- `/read/:topicId` - Adaptive reading session
- `/dashboard` - Parent metrics dashboard

### Backend (Supabase Edge Functions + Hono)
Endpoints:
- `POST /generate-story` - Generate Lexile-aligned story
- `POST /analyze-words` - Identify important words
- `POST /generate-questions` - Create comprehension questions
- `POST /breakdown-question` - Simplify questions for struggling readers
- `POST /save-metrics` - Track reading progress
- `GET /metrics/:userId` - Retrieve user metrics
- `POST /save-profile` - Save user profile
- `GET /profile/:userId` - Get user profile

### Data Storage
- KV store for:
  - User profiles (name, grade, interests, lexile level)
  - Reading metrics (words, pages, questions by level)
  - Sample texts for RAG
  - Generated stories

## Setup Instructions

### 1. Configure OpenAI API Key
This app requires an OpenAI API key to function.

**Steps:**
1. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. In your Supabase project dashboard:
   - Go to Project Settings → Edge Functions → Secrets
   - Add secret: `OPENAI_API_KEY`
   - Paste your OpenAI API key
3. Refresh the application

### 2. User Flow
1. Student starts on welcome page
2. Takes interest quiz (name, grade, interests)
3. Optional diagnostic reading for grades 3-4
4. Browses library of topics
5. Selects a story and begins reading
6. Answers questions periodically
7. Questions adapt if student struggles
8. Reading level adjusts based on performance
9. Parents view progress on dashboard

## Technologies Used
- **Frontend**: React, React Router, Tailwind CSS
- **Backend**: Deno, Hono, Supabase Edge Functions
- **AI**: OpenAI GPT-4o-mini
- **Fonts**: Google Fonts (Bangers, Fredoka, Caveat, etc.)
- **UI Components**: Radix UI primitives

## Reading Levels Supported
- **200-400L** (Grades 1-2): Simple sentences, common words
- **400-600L** (Grade 3): More complex sentences, descriptive language
- **600-800L** (Grade 4): Varied structure, richer vocabulary
- **800-1000L** (Grade 5): Complex narratives, sophisticated themes

## Future Enhancements
- Voice reading support
- More granular analytics
- Reading streaks and gamification
- Parent/teacher annotations
- Custom story creation
- Offline mode
- Multi-language support
