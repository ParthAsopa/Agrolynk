import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { Button } from "./ui/button";

/**
 * LogoutButton component that:
 * - Displays user info when authenticated
 * - Shows logout button
 * - Clears token and redirects to login on logout
 */
export function LogoutButton() {
  const { isAuthenticated, user, logout } = useAuth();
  const [, navigate] = useLocation();

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-700 dark:text-gray-300">
        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
      </span>
      <Button
        onClick={handleLogout}
        variant="outline"
        className="text-sm"
      >
        Logout
      </Button>
    </div>
  );
}
