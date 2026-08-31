import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import LanguageSelector from "./LanguageSelector";
import Logo from "./Logo";
import { LogoutButton } from "./LogoutButton";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const navLinks = [
  { label: t.navigation.home, href: "/" },
  { label: t.navigation.about, href: "#about" },
  { label: t.navigation.services, href: "#services" },
  { label: t.navigation.contact, href: "#contact" },
];

  const isActiveLink = (href: string) => {
    return location === href;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">

          {/* Logo */}
          <div className="flex items-center">
            <Logo />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">

            {navLinks.map((link) => (
              <div key={link.label} className="inline-block">
                <Link href={link.href}>
                  <span
                    className={`px-3 py-2 text-sm font-medium cursor-pointer ${
                      isActiveLink(link.href)
                        ? "text-primary"
                        : "text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
                    }`}
                  >
                    {link.label}
                  </span>
                </Link>
              </div>
            ))}

            {/* Language */}
            <LanguageSelector />

            {/* Theme */}
            <ThemeToggle />

            {/* Authentication */}
            {isAuthenticated ? (
              <LogoutButton />
            ) : (
              <Button asChild>
                <Link href="/login">{t.navigation.login}</Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary focus:outline-none"
              onClick={() =>
                setMobileMenuOpen(!mobileMenuOpen)
              }
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1">

            {navLinks.map((link) => (
              <div key={link.label} className="block">
                <Link href={link.href}>
                  <span
                    className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer ${
                      isActiveLink(link.href)
                        ? "text-primary"
                        : "text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
                    }`}
                    onClick={() =>
                      setMobileMenuOpen(false)
                    }
                  >
                    {link.label}
                  </span>
                </Link>
              </div>
            ))}

            {/* Mobile Controls */}
            <div className="flex items-center justify-between pt-2 px-3 gap-3">
              <LanguageSelector />

              <ThemeToggle />

              {isAuthenticated ? (
                <LogoutButton />
              ) : (
                <Button asChild>
                  <Link href="/login">Login</Link>
                </Button>
              )}
            </div>

          </div>
        </div>
      )}
    </nav>
  );
}