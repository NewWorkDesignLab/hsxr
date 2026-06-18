import en from './en.json';
import de from './de.json';

export type Locale = 'en' | 'de';

const translations: Record<Locale, Record<string, string>> = { en, de };

export function getLocale(
    cookies: { get(name: string): { value: string } | undefined },
    acceptLanguage?: string | null,
): Locale {
    const val = cookies.get('locale')?.value;
    if (val === 'de' || val === 'en') return val as Locale;

    if (acceptLanguage && /^de\b/i.test(acceptLanguage)) return 'de';
    return 'en';
}

export function t(locale: Locale, key: string): string {
    return translations[locale]?.[key] ?? translations['en']?.[key] ?? key;
}

export function getOtherLocale(locale: Locale): Locale {
    return locale === 'en' ? 'de' : 'en';
}

