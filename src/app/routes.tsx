import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "./pages/RootLayout";
import { LoginPage } from "./pages/LoginPage";
import { StudentLoginPage } from "./pages/StudentLoginPage";
import { ParentLoginPage } from "./pages/ParentLoginPage";
import { TeacherLoginPage } from "./pages/TeacherLoginPage";
import { TeacherSignupPage } from "./pages/TeacherSignupPage";
import { SignupPage } from "./pages/SignupPage";
import { InterestQuiz } from "./pages/InterestQuiz";
import { LibraryPage } from "./pages/LibraryPage";
import { ReadingSession } from "./pages/ReadingSession";
import { ParentDashboard } from "./pages/ParentDashboard";
import { BookClubPage } from "./pages/BookClubPage";
import { StudentProgressPage } from "./pages/StudentProgressPage";
import { TeacherDashboard } from "./pages/TeacherDashboard";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, element: <LoginPage /> },
      { path: "login", Component: LoginPage },
      { path: "login/student", Component: StudentLoginPage },
      { path: "login/parent", Component: ParentLoginPage },
      { path: "login/teacher", Component: TeacherLoginPage },
      { path: "signup", Component: SignupPage },
      { path: "signup/teacher", Component: TeacherSignupPage },
      { 
        path: "quiz", 
        element: (
          <ProtectedRoute>
            <InterestQuiz />
          </ProtectedRoute>
        )
      },
      { 
        path: "library", 
        element: (
          <ProtectedRoute>
            <LibraryPage />
          </ProtectedRoute>
        )
      },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <StudentProgressPage />
          </ProtectedRoute>
        )
      },
      { 
        path: "read/:topicId", 
        element: (
          <ProtectedRoute>
            <ReadingSession />
          </ProtectedRoute>
        )
      },
      { 
        path: "book-club",
        element: (
          <ProtectedRoute>
            <BookClubPage />
          </ProtectedRoute>
        )
      },
      { 
        path: "parent-dashboard", 
        element: (
          <ProtectedRoute>
            <ParentDashboard />
          </ProtectedRoute>
        )
      },
      {
        path: "teacher-dashboard",
        element: (
          <ProtectedRoute allowedRoles={["teacher"]}>
            <TeacherDashboard />
          </ProtectedRoute>
        )
      },
    ],
  },
]);