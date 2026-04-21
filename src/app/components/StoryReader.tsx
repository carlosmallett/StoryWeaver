import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Loader2, Sparkles, BookOpen } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface StoryReaderProps {
  onStoryGenerated?: (story: string) => void;
}

const LEXILE_LEVELS = [
  { value: '200-400', label: '200-400L (Ages 5-7)', color: '#FF6B9D' },
  { value: '400-600', label: '400-600L (Ages 7-9)', color: '#FFA07A' },
  { value: '600-800', label: '600-800L (Ages 9-11)', color: '#98D8C8' },
  { value: '800-1000', label: '800-1000L (Ages 11-13)', color: '#A8C5E2' },
];

export function StoryReader({ onStoryGenerated }: StoryReaderProps) {
  const [lexileLevel, setLexileLevel] = useState('400-600');
  const [theme, setTheme] = useState('');
  const [story, setStory] = useState('');
  const [importantWords, setImportantWords] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const selectedLevel = LEXILE_LEVELS.find(l => l.value === lexileLevel);

  const generateStory = async () => {
    setLoading(true);
    setError('');
    setStory('');
    setImportantWords([]);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-61e9fc0f/generate-story`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            lexileLevel,
            theme: theme || undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate story');
      }

      const data = await response.json();
      setStory(data.story);
      
      if (onStoryGenerated) {
        onStoryGenerated(data.story);
      }

      // Automatically analyze words after story generation
      analyzeWords(data.story);

    } catch (err) {
      console.error('Error generating story:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate story');
    } finally {
      setLoading(false);
    }
  };

  const analyzeWords = async (storyText: string) => {
    setAnalyzing(true);
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-61e9fc0f/analyze-words`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            story: storyText,
            lexileLevel,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to analyze words');
      }

      const data = await response.json();
      setImportantWords(data.importantWords || []);

    } catch (err) {
      console.error('Error analyzing words:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <BookOpen className="w-6 h-6 text-purple-600" />
            Story Generator
          </CardTitle>
          <CardDescription>
            Choose a reading level and generate a custom story!
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lexile-select" className="text-base font-semibold">
              Reading Level
            </Label>
            <Select value={lexileLevel} onValueChange={setLexileLevel}>
              <SelectTrigger id="lexile-select" className="h-12 text-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEXILE_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value} className="text-lg py-3">
                    <span className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: level.color }}
                      />
                      {level.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="theme-input" className="text-base font-semibold">
              Story Theme (Optional)
            </Label>
            <Input
              id="theme-input"
              placeholder="e.g., space adventure, magical forest, friendship..."
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="h-12 text-lg"
            />
          </div>

          <Button
            onClick={generateStory}
            disabled={loading}
            className="w-full h-12 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Creating Your Story...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Story
              </>
            )}
          </Button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {story && (
        <StoryDisplay
          story={story}
          importantWords={importantWords}
          analyzing={analyzing}
          levelColor={selectedLevel?.color || '#98D8C8'}
        />
      )}
    </div>
  );
}

interface StoryDisplayProps {
  story: string;
  importantWords: string[];
  analyzing: boolean;
  levelColor: string;
}

function StoryDisplay({ story, importantWords, analyzing, levelColor }: StoryDisplayProps) {
  const renderStoryWithEmphasis = () => {
    // Split story into words while preserving punctuation and whitespace
    const words = story.split(/(\s+)/);
    
    return words.map((word, index) => {
      // Skip whitespace
      if (word.match(/^\s+$/)) {
        return <span key={index}>{word}</span>;
      }

      // Extract the actual word without punctuation
      const cleanWord = word.replace(/[^\w'-]/g, '');
      const isImportant = importantWords.some(
        (importantWord) => 
          cleanWord.toLowerCase() === importantWord.toLowerCase()
      );

      if (isImportant && !analyzing) {
        return (
          <StyledWord key={index} word={word} index={index} levelColor={levelColor} />
        );
      }

      return <span key={index}>{word}</span>;
    });
  };

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" style={{ color: levelColor }} />
          Your Story
        </CardTitle>
        {analyzing && (
          <CardDescription className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing important words...
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-6">
        <div
          className="text-xl leading-relaxed"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          {renderStoryWithEmphasis()}
        </div>
        
        {!analyzing && importantWords.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Key Words:</strong> {importantWords.length} important words highlighted
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface StyledWordProps {
  word: string;
  index: number;
  levelColor: string;
}

const FONT_STYLES = [
  { font: 'Bangers, cursive', transform: 'scale(1.1)', color: '#FF6B6B' },
  { font: 'Fredoka, sans-serif', transform: 'scale(1.15) rotate(-2deg)', color: '#4ECDC4' },
  { font: 'Righteous, cursive', transform: 'scale(1.12) rotate(1deg)', color: '#45B7D1' },
  { font: 'Permanent Marker, cursive', transform: 'scale(1.1) rotate(-1deg)', color: '#FFA07A' },
  { font: 'Titan One, cursive', transform: 'scale(1.08)', color: '#98D8C8' },
  { font: 'Caveat, cursive', transform: 'scale(1.2)', color: '#DDA15E' },
];

function StyledWord({ word, index, levelColor }: StyledWordProps) {
  const style = FONT_STYLES[index % FONT_STYLES.length];
  
  return (
    <span
      className="inline-block mx-0.5 transition-all duration-200 hover:scale-110 cursor-default"
      style={{
        fontFamily: style.font,
        color: style.color,
        transform: style.transform,
        textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
        fontWeight: 700,
      }}
    >
      {word}
    </span>
  );
}
