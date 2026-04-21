import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { AlertCircle, Key, CheckCircle, ExternalLink } from "lucide-react";
import { saveApiKey, clearApiKey, getApiKey } from "../utils/openai";

interface ApiKeyInstructionsProps {
  onKeySet?: () => void;
}

export function ApiKeyInstructions({ onKeySet }: ApiKeyInstructionsProps) {
  const [input, setInput] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const existingKey = getApiKey();

  const handleSave = () => {
    const trimmed = input.trim();
    if (!trimmed.startsWith("gsk_")) {
      setError("That doesn't look like a valid Groq key (should start with gsk_)");
      return;
    }
    saveApiKey(trimmed);
    setSaved(true);
    setError("");
    onKeySet?.();
  };

  const handleClear = () => {
    clearApiKey();
    setSaved(false);
    setInput("");
  };

  if (existingKey && !saved) {
    return (
      <Card className="border-2 border-green-300 bg-green-50">
        <CardContent className="pt-5 pb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
            <p className="text-sm text-green-800">
              Groq key is set — stories will be generated with AI (free).
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleClear} className="shrink-0">
            Change Key
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-orange-300 bg-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-800 text-base">
          <AlertCircle className="w-5 h-5 shrink-0" />
          Groq API Key Required (Free)
        </CardTitle>
        <CardDescription>
          Stories are generated using Llama 3.3 via Groq — it's free. Paste your key below, it stays on this device only.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
        )}

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="password"
              placeholder="gsk_..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="pl-9"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
          <Button onClick={handleSave} className="bg-orange-600 hover:bg-orange-700">
            Save
          </Button>
        </div>

        <p className="text-xs text-gray-600">
          Don't have a key?{' '}
          <a
            href="https://console.groq.com/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline inline-flex items-center gap-0.5"
          >
            Get a free one from Groq <ExternalLink className="w-3 h-3" />
          </a>
          . Free tier is generous — no credit card needed. Your key is stored only in this browser.
        </p>
      </CardContent>
    </Card>
  );
}
