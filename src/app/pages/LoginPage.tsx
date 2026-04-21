import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { BookOpen, Sparkles, Users, GraduationCap } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";

export function LoginPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100 px-6 py-8">
      <div className="mx-auto w-full max-w-6xl">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <BookOpen className="w-10 h-10 text-purple-600" />
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              StoryWeaver
            </h1>
            <Sparkles className="w-10 h-10 text-pink-600" />
          </div>
          <p className="text-lg font-semibold text-gray-800">Choose your login</p>
          <p className="text-sm text-gray-600 mt-1">Quick access for students, parents, and teachers.</p>
        </div>

        {/* Login Type Selection */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {/* Student Login */}
          <Card 
            className="border shadow-md hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => navigate('/login/student')}
          >
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 pb-3">
              <div className="flex items-center justify-center mb-2">
                <BookOpen className="w-12 h-12 text-purple-600 group-hover:scale-110 transition-transform" />
              </div>
              <CardTitle className="text-center text-xl">Student</CardTitle>
              <CardDescription className="text-center">Jump into reading adventures</CardDescription>
            </CardHeader>
            <CardContent className="pt-3">
              <Button 
                className="w-full h-10 bg-gradient-to-r from-purple-600 to-pink-600"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/login/student');
                }}
              >
                Continue as Student
              </Button>
            </CardContent>
          </Card>

          {/* Parent Login */}
          <Card 
            className="border shadow-md hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => navigate('/login/parent')}
          >
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 pb-3">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-12 h-12 text-blue-600 group-hover:scale-110 transition-transform" />
              </div>
              <CardTitle className="text-center text-xl">Parent</CardTitle>
              <CardDescription className="text-center">Track progress and support reading</CardDescription>
            </CardHeader>
            <CardContent className="pt-3">
              <Button 
                className="w-full h-10 bg-gradient-to-r from-blue-600 to-cyan-600"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/login/parent');
                }}
              >
                Continue as Parent
              </Button>
            </CardContent>
          </Card>

          {/* Teacher Login */}
          <Card
            className="border shadow-md hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => navigate('/login/teacher')}
          >
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-cyan-50 pb-3">
              <div className="flex items-center justify-center mb-2">
                <GraduationCap className="w-12 h-12 text-emerald-600 group-hover:scale-110 transition-transform" />
              </div>
              <CardTitle className="text-center text-xl">Teacher</CardTitle>
              <CardDescription className="text-center">Monitor class insight and assign supports</CardDescription>
            </CardHeader>
            <CardContent className="pt-3">
              <Button
                className="w-full h-10 bg-gradient-to-r from-emerald-600 to-cyan-600"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/login/teacher');
                }}
              >
                Continue as Teacher
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Mission + Rationale Dropdown */}
        <div className="mt-6">
          <Card className="border shadow-sm bg-white/95">
            <CardContent className="pt-2 pb-2">
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="mission">
                  <AccordionTrigger className="text-base font-semibold text-slate-800 hover:no-underline">
                    Mission Statement
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-7 text-slate-700">
                    StoryWeaver helps every child become a confident reader by combining interest-driven stories,
                    Lexile-aligned text complexity, and adaptive comprehension support. Our goal is to make reading
                    both joyful and measurable across school and home so students, parents, and teachers can work
                    together toward steady reading growth.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="rationale">
                  <AccordionTrigger className="text-base font-semibold text-slate-800 hover:no-underline">
                    Research & Rationale
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 text-sm leading-7 text-slate-700">
                      <p>
                        Students read best when text is matched to their current ability and interests. StoryWeaver starts
                        with onboarding diagnostics and then dynamically adjusts difficulty based on comprehension outcomes.
                      </p>
                      <p>
                        The platform uses periodic questions, guided second-chance hints, and highlighted key vocabulary to
                        strengthen understanding in context instead of rote memorization.
                      </p>
                      <p>
                        Parent and teacher dashboards turn reading sessions into actionable insight with progress trends,
                        story history, and recommendation tools so adults can personalize support and book selection.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="guardrails">
                  <AccordionTrigger className="text-base font-semibold text-slate-800 hover:no-underline">
                    AI Safety Guardrails
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 text-sm leading-7 text-slate-700">
                      <p>
                        StoryWeaver uses structured prompts to keep stories age-appropriate, classroom-friendly, and free of graphic, sexual, hateful, or dangerous content.
                      </p>
                      <p>
                        Every generated story is constrained by Lexile targets, paragraph structure, and comprehension goals so the AI stays focused on educational reading practice instead of open-ended chatting.
                      </p>
                      <p>
                        Adults can review reading history, vocabulary, and recommendations, and highlighted words open guided definitions rather than unrestricted AI conversations.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Sign Up Link */}
        <div className="mt-5 text-center">
          <p className="text-sm text-gray-600">
            New here?{' '}
            <Link 
              to="/signup" 
              className="font-semibold text-purple-600 hover:text-purple-700 underline"
            >
              Parent setup
            </Link>
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Teacher onboarding?{' '}
            <Link
              to="/signup/teacher"
              className="font-semibold text-emerald-700 hover:text-emerald-800 underline"
            >
              Teacher class setup
            </Link>
          </p>
          <p className="text-xs text-gray-500 mt-2">Parents create family accounts and teachers can create full class rosters.</p>
        </div>
      </div>
    </div>
  );
}