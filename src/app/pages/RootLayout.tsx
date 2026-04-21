import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";
import { clearCurrentUser } from "../utils/localAuth";

export function RootLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const currentUser = typeof window !== "undefined" ? localStorage.getItem("currentUser") : null;
  const hideSharedLogout = [
    "/",
    "/login",
    "/login/student",
    "/login/parent",
    "/login/teacher",
    "/signup",
    "/parent-dashboard",
    "/teacher-dashboard",
  ].includes(location.pathname);

  const handleLogout = async () => {
    clearCurrentUser();
    localStorage.removeItem("selectedTopic");
    localStorage.removeItem("currentReading");
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100">
      {currentUser && !hideSharedLogout ? (
        <div className="sticky top-0 z-50 flex justify-end px-4 pt-4 sm:px-6 lg:px-8">
          <Button variant="outline" className="bg-white/90 backdrop-blur" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
          </Button>
        </div>
      ) : null}
      <Outlet />
    </div>
  );
}
