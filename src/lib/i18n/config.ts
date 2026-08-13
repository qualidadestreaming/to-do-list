export const LOCALES = ["pt", "en", "zh"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "pt";

export const LOCALE_LABELS: Record<Locale, string> = {
  pt: "Português",
  en: "English",
  zh: "中文",
};

export const LOCALE_COOKIE = "tdl_locale";

export async function loadMessages(locale: Locale) {
  switch (locale) {
    case "en":
      return (await import("./messages/en.json")).default;
    case "zh":
      return (await import("./messages/zh.json")).default;
    case "pt":
    default:
      return (await import("./messages/pt.json")).default;
  }
}
