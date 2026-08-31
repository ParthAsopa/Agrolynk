import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

type AuthMode = "login" | "register";
type UserRole = "farmer" | "company";

export default function Login() {
  const [, navigate] = useLocation();
  const { login } = useAuth();

  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("farmer");
  const [error, setError] = useState("");

  const isLoginMode = authMode === "login";

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (isLoginMode) {
      if (!trimmedEmail || !password.trim()) {
        setError("Please enter email and password.");
        return;
      }
    } else {
      if (!trimmedName || !trimmedEmail || !password.trim()) {
        setError("Please fill in all registration fields.");
        return;
      }
    }

    try {
      const endpoint = isLoginMode ? "/api/auth/login" : "/api/auth/register";
      const payload = isLoginMode
        ? { email: trimmedEmail, password }
        : { name: trimmedName, email: trimmedEmail, password, role };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || (isLoginMode ? "Invalid email or password." : "Unable to create account."));
        return;
      }

      if (data.token) {
        login(data.token);

        try {
          const payloadData = JSON.parse(atob(data.token.split(".")[1]));
          const userRole = payloadData.role;

          if (userRole === "farmer") {
            navigate("/farmer/options");
            return;
          }

          if (userRole === "company") {
            navigate("/company/options");
            return;
          }

          setError("Unknown user role: " + userRole);
        } catch (decodeErr) {
          console.error("Failed to decode token:", decodeErr);
          setError("Failed to process authentication token.");
        }
      } else {
        setError("No authentication token received.");
      }
    } catch (error) {
      console.error("Auth request error:", error);
      setError("Unable to connect to the server.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1 mb-6">
            {(["login", "register"] as AuthMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setAuthMode(mode)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  authMode === mode
                    ? "bg-primary text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {mode === "login" ? "Login" : "Register"}
              </button>
            ))}
          </div>

          <h1 className="text-3xl font-bold text-primary">
            {isLoginMode ? "Welcome Back" : "Create Account"}
          </h1>

          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {isLoginMode ? "Login to your AgroLynk account" : "Join AgroLynk and grow smarter"}
          </p>
        </div>

        <form onSubmit={handleAuthSubmit} className="space-y-5">
          {!isLoginMode && (
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLoginMode ? "Enter your password" : "Create a password"}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {!isLoginMode && (
            <div>
              <label className="block text-sm font-medium mb-2">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="farmer">Farmer</option>
                <option value="company">Company</option>
              </select>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full">
            {isLoginMode ? "Login" : "Register"}
          </Button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isLoginMode ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => setAuthMode(isLoginMode ? "register" : "login")}
              className="text-primary font-medium hover:underline"
            >
              {isLoginMode ? "Register" : "Log in"}
            </button>
          </p>
        </div>

        <div className="text-center mt-6">
          <Link href="/">
            <span className="text-primary cursor-pointer hover:underline">
              ← Back to Home
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}