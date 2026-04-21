# StoryWeaver

## Tagline
Personalized, interactive reading powered by AI—engage, support, and inspire every learner.

## Project Description
StoryWeaver is an AI-powered reading platform that generates custom stories tailored to each student’s interests and reading level. It highlights important vocabulary, adapts comprehension questions, and provides real-time support through features like hand-raise detection. The platform is designed to make reading engaging, accessible, and supportive for all learners.

## Target Audience
- K-12 students seeking personalized reading practice
- Teachers and parents supporting literacy development
- Educational technologists and researchers

StoryWeaver is ideal for classroom, remote, or independent learning environments.

## Motivation
StoryWeaver was created to address the challenge of engaging diverse learners in reading. By personalizing content and providing adaptive support, it aims to:
- Increase reading motivation and comprehension
- Support differentiated instruction
- Explore the impact of real-time, embodied interaction on literacy outcomes

## Human-Centered Design Analysis
- **Affordances:** Clickable words for definitions, visible hand-raise for help, clear navigation buttons
- **Anti-affordances:** Important actions (e.g., ending session) require confirmation to prevent mistakes
- **Constraints:** Only one question can be answered at a time; camera access is limited to reading sessions
- **Signifiers:** Highlighted words, icons, and prompts indicate interactive elements
- **Cues:** Visual highlights, modals, and tooltips guide user actions; auditory cues possible for feedback
- **System Response:** Immediate feedback on answers, help prompts, and story progression
- **Feedback:** Visual overlays, modals, and progress bars; optional sound cues
- **Feedback Loops:** Correct/incorrect answers adapt story flow and hints; hand-raise triggers help sequence

## Installation
### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### Setup
1. Clone the repository:
   ```sh
   git clone https://github.com/your-username/your-repo.git
   cd your-repo
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the development server:
   ```sh
   npm run dev
   ```

## Usage
- Open `http://localhost:5173` (or the port shown in your terminal)
- Sign up or log in as a student, teacher, or parent
- Select a story or quiz to begin
- Use the interface to read, answer questions, and request help (raise hand)

> ![Screenshot: StoryWeaver Reading Session](public/demo-screenshot.png)

## License
MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [TensorFlow.js](https://www.tensorflow.org/js)
- [OpenAI API](https://platform.openai.com/)
- [Lucide Icons](https://lucide.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Teachable Machine](https://teachablemachine.withgoogle.com/)

## Roadmap
- Add more story genres and languages
- Teacher dashboard with analytics
- Parent engagement features
- Enhanced accessibility (screen reader, keyboard navigation)
- Mobile app version
- Integration with classroom management tools
