import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Lock, X } from "lucide-react";

interface PasscodeModalProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function PasscodeModal({ onSuccess, onCancel }: PasscodeModalProps) {
  const [passcode, setPasscode] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const CORRECT_PASSCODE = "1130";

  useEffect(() => {
    // Focus first input on mount
    inputRefs[0].current?.focus();
  }, []);

  const handleInputChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newPasscode = [...passcode];
    newPasscode[index] = value;
    setPasscode(newPasscode);
    setError("");

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    // Check if passcode is complete
    if (index === 3 && value) {
      const fullPasscode = newPasscode.join("");
      if (fullPasscode === CORRECT_PASSCODE) {
        onSuccess();
      } else {
        setError("Incorrect passcode. Please try again.");
        // Clear inputs after error
        setTimeout(() => {
          setPasscode(["", "", "", ""]);
          inputRefs[0].current?.focus();
        }, 1000);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !passcode[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 4);
    
    if (/^\d+$/.test(pastedData)) {
      const newPasscode = pastedData.split("").concat(["", "", "", ""]).slice(0, 4);
      setPasscode(newPasscode);
      
      // Focus last filled input or check passcode if complete
      const nextEmptyIndex = newPasscode.findIndex(val => !val);
      if (nextEmptyIndex === -1) {
        if (pastedData === CORRECT_PASSCODE) {
          onSuccess();
        } else {
          setError("Incorrect passcode. Please try again.");
          setTimeout(() => {
            setPasscode(["", "", "", ""]);
            inputRefs[0].current?.focus();
          }, 1000);
        }
      } else {
        inputRefs[nextEmptyIndex].current?.focus();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <Card className="w-full max-w-md border-2 shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>Parent Dashboard</CardTitle>
                <CardDescription>Enter 4-digit passcode to continue</CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-8 pb-8">
          <div className="flex justify-center gap-4 mb-6" onPaste={handlePaste}>
            {passcode.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-16 h-20 text-center text-3xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-200 outline-none transition-all"
                aria-label={`Digit ${index + 1}`}
              />
            ))}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center mb-4">
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          )}

          <div className="text-center">
            <p className="text-sm text-gray-600">
              This area is for parents only
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
