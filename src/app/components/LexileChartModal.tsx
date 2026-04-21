import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { X, BookOpen, TrendingUp, Award, Target, Star } from "lucide-react";

interface LexileChartModalProps {
  onClose: () => void;
  childName: string;
  currentLevel: string;
}

const LEXILE_CHART = [
  {
    range: "BR-200L",
    grade: "K-1",
    ageRange: "5-6 years",
    description: "Beginning reader",
    examples: "Picture books, simple sentences, high-frequency words",
    badgeColor: "bg-pink-400",
    highlightColor: "from-pink-100 to-pink-50",
    borderColor: "border-pink-400",
    ringColor: "ring-pink-300"
  },
  {
    range: "200-400L",
    grade: "1-2",
    ageRange: "6-7 years",
    description: "Early elementary reader",
    examples: "Easy chapter books, short stories with basic vocabulary",
    badgeColor: "bg-[#FF6B9D]",
    highlightColor: "from-pink-100 to-rose-50",
    borderColor: "border-[#FF6B9D]",
    ringColor: "ring-pink-300"
  },
  {
    range: "400-600L",
    grade: "2-3",
    ageRange: "7-8 years",
    description: "Developing reader",
    examples: "Chapter books with illustrations, more complex sentences",
    badgeColor: "bg-[#FFA07A]",
    highlightColor: "from-orange-100 to-orange-50",
    borderColor: "border-[#FFA07A]",
    ringColor: "ring-orange-300"
  },
  {
    range: "600-800L",
    grade: "3-4",
    ageRange: "8-9 years",
    description: "Intermediate reader",
    examples: "Longer chapter books, descriptive vocabulary, multiple plots",
    badgeColor: "bg-[#98D8C8]",
    highlightColor: "from-teal-100 to-cyan-50",
    borderColor: "border-[#98D8C8]",
    ringColor: "ring-teal-300"
  },
  {
    range: "800-1000L",
    grade: "4-5",
    ageRange: "9-11 years",
    description: "Advanced elementary reader",
    examples: "Complex narratives, abstract concepts, varied sentence structures",
    badgeColor: "bg-[#A8C5E2]",
    highlightColor: "from-blue-100 to-sky-50",
    borderColor: "border-[#A8C5E2]",
    ringColor: "ring-blue-300"
  },
  {
    range: "1000-1200L",
    grade: "6-8",
    ageRange: "11-13 years",
    description: "Middle school reader",
    examples: "Young adult novels, informational texts, thematic depth",
    badgeColor: "bg-purple-400",
    highlightColor: "from-purple-100 to-purple-50",
    borderColor: "border-purple-400",
    ringColor: "ring-purple-300"
  }
];

export function LexileChartModal({ onClose, childName, currentLevel }: LexileChartModalProps) {
  const isCurrentLevel = (range: string) => {
    return range === currentLevel;
  };

  // Find the current level details from the chart
  const currentLevelData = LEXILE_CHART.find(level => level.range === currentLevel);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-8 px-4">
      <Card className="w-full max-w-5xl border-2 shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b-2 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Lexile Reading Levels Explained</CardTitle>
                <CardDescription className="text-base">
                  Understanding {childName}'s reading journey
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-10 w-10 p-0"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-6">
          {/* What is Lexile */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-5 rounded-lg border-2 border-blue-200">
            <h3 className="text-lg font-bold text-blue-900 mb-2 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              What is a Lexile Level?
            </h3>
            <p className="text-sm text-blue-800 leading-relaxed mb-3">
              The Lexile Framework is a scientific measure of reading ability and text complexity. 
              It helps match readers with appropriately challenging books to support growth without frustration.
            </p>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-lg">
                <Target className="w-5 h-5 text-purple-600 mb-1" />
                <p className="text-xs font-semibold text-gray-700">Individualized</p>
                <p className="text-xs text-gray-600">Tailored to each child's ability</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600 mb-1" />
                <p className="text-xs font-semibold text-gray-700">Growth-Oriented</p>
                <p className="text-xs text-gray-600">Tracks progress over time</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <Award className="w-5 h-5 text-orange-600 mb-1" />
                <p className="text-xs font-semibold text-gray-700">Research-Based</p>
                <p className="text-xs text-gray-600">Used by educators nationwide</p>
              </div>
            </div>
          </div>

          {/* Lexile Level Chart */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              Lexile Level Progression Chart
            </h3>
            
            {/* Visual Progress Scale */}
            {currentLevelData && (
              <div className="mb-8 bg-white p-6 rounded-xl border-2 border-gray-200 shadow-lg">
                <p className="text-sm font-semibold text-gray-600 text-center mb-3">
                  {childName}'s Position on the Lexile Scale
                </p>
                <div className="relative">
                  {/* Progress bar with all levels */}
                  <div className="flex items-center gap-1">
                    {LEXILE_CHART.map((level, index) => {
                      const isCurrent = level.range === currentLevel;
                      return (
                        <div key={level.range} className="flex-1 relative">
                          {/* Bar segment */}
                          <div
                            className={`h-8 rounded-md transition-all ${
                              isCurrent
                                ? `${level.badgeColor} ring-4 ${level.ringColor} scale-110 shadow-xl`
                                : 'bg-gray-200'
                            }`}
                          />
                          {/* Current level star indicator */}
                          {isCurrent && (
                            <>
                              {/* Big star above */}
                              <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                                <div className="relative">
                                  {/* Outer glow star */}
                                  <Star className={`w-16 h-16 fill-yellow-300 text-yellow-400 absolute animate-pulse`} />
                                  {/* Inner solid star */}
                                  <Star className={`w-16 h-16 fill-yellow-400 text-yellow-500 relative drop-shadow-2xl`} />
                                </div>
                                <div className={`${level.badgeColor} text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg whitespace-nowrap mt-1`}>
                                  {childName} IS HERE!
                                </div>
                              </div>
                              {/* Arrow pointing down */}
                              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                                <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[16px] border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-lg" />
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* Level labels below */}
                  <div className="flex items-center gap-1 mt-2">
                    {LEXILE_CHART.map((level) => (
                      <div key={level.range} className="flex-1 text-center">
                        <p className={`text-xs ${level.range === currentLevel ? 'font-black text-gray-900' : 'font-medium text-gray-500'}`}>
                          {level.range}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Current Level Highlight Banner */}
            {currentLevelData && (
              <div className={`mb-6 p-6 rounded-xl border-4 ${currentLevelData.borderColor} bg-gradient-to-r ${currentLevelData.highlightColor} shadow-2xl`}>
                <div className="text-center space-y-3">
                  <div className="inline-block">
                    <Badge className={`${currentLevelData.badgeColor} text-white text-2xl px-8 py-4 font-black shadow-xl`}>
                      {currentLevel}
                    </Badge>
                  </div>
                  <h3 className="text-3xl font-black text-gray-900">
                    {childName} is currently reading at this level
                  </h3>
                  <p className="text-lg font-semibold text-gray-700">
                    Grade {currentLevelData.grade} • Ages {currentLevelData.ageRange} • {currentLevelData.description}
                  </p>
                  <div className="flex items-center justify-center gap-2 text-base text-gray-600">
                    <span className="font-semibold">Look for this level below</span>
                    <span className="text-2xl">↓</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-3">{LEXILE_CHART.map((level) => {
                const isCurrent = isCurrentLevel(level.range);
                
                return (
                  <div
                    key={level.range}
                    className={`relative p-5 rounded-lg border-2 transition-all ${
                      isCurrent
                        ? `bg-gradient-to-r ${level.highlightColor} ${level.borderColor} shadow-2xl scale-[1.03] ring-4 ${level.ringColor}`
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    {isCurrent && (
                      <>
                        {/* Top Badge */}
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                          <div className={`${level.badgeColor} text-white px-6 py-2 rounded-full text-sm font-bold shadow-xl flex items-center gap-2 border-2 border-white`}>
                            <span className="uppercase tracking-wide">Current Level: {childName}</span>
                          </div>
                        </div>
                        
                        {/* Side Indicators */}
                        <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 z-10">
                          <div className={`${level.badgeColor} text-white w-10 h-10 rounded-full flex items-center justify-center shadow-xl font-black text-sm border-4 border-white`}>
                            ◀
                          </div>
                        </div>
                        <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 z-10">
                          <div className={`${level.badgeColor} text-white w-10 h-10 rounded-full flex items-center justify-center shadow-xl font-black text-sm border-4 border-white`}>
                            ▶
                          </div>
                        </div>
                      </>
                    )}
                    
                    <div className={`flex flex-col md:flex-row md:items-center gap-4 ${isCurrent ? 'mt-2' : ''}`}>
                      {/* Level Badge */}
                      <div className="flex-shrink-0">
                        <Badge className={`${level.badgeColor} text-white ${isCurrent ? 'text-xl px-6 py-3 font-bold shadow-lg' : 'text-base px-4 py-2'}`}>
                          {level.range}
                        </Badge>
                      </div>
                      
                      {/* Level Info */}
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <h4 className={`${isCurrent ? 'text-xl font-black' : 'text-base font-bold'} text-gray-800`}>
                            Grade {level.grade}
                          </h4>
                          <span className={`${isCurrent ? 'text-base font-semibold' : 'text-sm'} text-gray-600`}>
                            ({level.ageRange})
                          </span>
                          <Badge variant="outline" className={`${isCurrent ? 'text-sm font-bold border-2' : 'text-xs'}`}>
                            {level.description}
                          </Badge>
                        </div>
                        
                        <p className={`${isCurrent ? 'text-base font-medium' : 'text-sm'} text-gray-700`}>
                          <span className="font-semibold">Typical Reading:</span> {level.examples}
                        </p>
                      </div>
                      
                      {/* Progress Indicator */}
                      {isCurrent && (
                        <div className="flex-shrink-0">
                          <div className={`w-16 h-16 rounded-full ${level.badgeColor} flex items-center justify-center shadow-xl border-4 border-white`}>
                            <BookOpen className="w-8 h-8 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}</div>
          </div>

          {/* Growth Tips */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-lg border-2 border-green-200">
            <h3 className="text-lg font-bold text-green-900 mb-2 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Supporting Reading Growth
            </h3>
            <ul className="space-y-2 text-sm text-green-800">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span><strong>Challenge appropriately:</strong> Books should be at or slightly above current level</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span><strong>Read daily:</strong> Consistent practice is key to growth</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span><strong>Discuss together:</strong> Conversation deepens comprehension</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span><strong>Celebrate progress:</strong> Every level gained is an achievement!</span>
              </li>
            </ul>
          </div>

          {/* Close Button */}
          <div className="flex justify-center pt-2">
            <Button
              onClick={onClose}
              className="bg-gradient-to-r from-blue-600 to-purple-600 px-8"
            >
              Got It!
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}