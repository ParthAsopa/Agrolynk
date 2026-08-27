import { languages } from "@/i18n";
import { useLanguage } from "@/i18n/LanguageContext";

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <select
      value={language}
      onChange={(e) =>
        setLanguage(e.target.value as keyof typeof languages)
      }
      className="rounded-md border bg-background px-3 py-2 text-sm"
      aria-label="Select language"
    >
      {Object.entries(languages).map(
        ([code, name]) => (
          <option key={code} value={code}>
            {name}
          </option>
        ),
      )}
    </select>
  );
}