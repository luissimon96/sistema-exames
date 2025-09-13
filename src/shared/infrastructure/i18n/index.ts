/**
 * Internationalization System for Brazilian Market
 * Sistema Exames - Localization Infrastructure
 */

export type Locale = 'pt-BR' | 'en-US';
export type TranslationKey = string;

// Translation function type
export type TFunction = (key: TranslationKey, params?: Record<string, any>) => string;

// Date and number formatting configurations
export interface LocaleConfig {
  locale: Locale;
  dateFormat: {
    short: string; // DD/MM/YYYY
    long: string;  // DD de MMMM de YYYY
    time: string;  // HH:mm
    datetime: string; // DD/MM/YYYY HH:mm
  };
  currency: {
    code: string;
    symbol: string;
    decimals: number;
  };
  number: {
    decimal: string;
    thousands: string;
  };
}

// Locale configurations
export const LOCALE_CONFIGS: Record<Locale, LocaleConfig> = {
  'pt-BR': {
    locale: 'pt-BR',
    dateFormat: {
      short: 'dd/MM/yyyy',
      long: "dd 'de' MMMM 'de' yyyy",
      time: 'HH:mm',
      datetime: 'dd/MM/yyyy HH:mm',
    },
    currency: {
      code: 'BRL',
      symbol: 'R$',
      decimals: 2,
    },
    number: {
      decimal: ',',
      thousands: '.',
    },
  },
  'en-US': {
    locale: 'en-US',
    dateFormat: {
      short: 'MM/dd/yyyy',
      long: 'MMMM dd, yyyy',
      time: 'HH:mm',
      datetime: 'MM/dd/yyyy HH:mm',
    },
    currency: {
      code: 'USD',
      symbol: '$',
      decimals: 2,
    },
    number: {
      decimal: '.',
      thousands: ',',
    },
  },
};

// Translation storage
class TranslationStore {
  private translations: Record<Locale, Record<string, any>> = {
    'pt-BR': {},
    'en-US': {},
  };

  addTranslations(locale: Locale, translations: Record<string, any>): void {
    this.translations[locale] = {
      ...this.translations[locale],
      ...translations,
    };
  }

  getTranslation(locale: Locale, key: string): string | undefined {
    const keys = key.split('.');
    let current = this.translations[locale];

    for (const k of keys) {
      if (!current || typeof current !== 'object') {
        return undefined;
      }
      current = current[k];
    }

    return typeof current === 'string' ? current : undefined;
  }

  hasTranslation(locale: Locale, key: string): boolean {
    return this.getTranslation(locale, key) !== undefined;
  }
}

const translationStore = new TranslationStore();

// Internationalization class
export class I18n {
  private currentLocale: Locale = 'pt-BR';

  constructor(initialLocale: Locale = 'pt-BR') {
    this.currentLocale = initialLocale;
  }

  setLocale(locale: Locale): void {
    this.currentLocale = locale;
  }

  getLocale(): Locale {
    return this.currentLocale;
  }

  getLocaleConfig(): LocaleConfig {
    return LOCALE_CONFIGS[this.currentLocale];
  }

  // Translation function
  t(key: TranslationKey, params?: Record<string, any>): string {
    let translation = translationStore.getTranslation(this.currentLocale, key);

    // Fallback to English if Portuguese translation not found
    if (!translation && this.currentLocale !== 'en-US') {
      translation = translationStore.getTranslation('en-US', key);
    }

    // Fallback to key if no translation found
    if (!translation) {
      console.warn(`Missing translation for key: ${key} (locale: ${this.currentLocale})`);
      return key;
    }

    // Replace parameters in translation
    if (params) {
      for (const [paramKey, value] of Object.entries(params)) {
        translation = translation.replace(
          new RegExp(`\\{\\{${paramKey}\\}\\}`, 'g'),
          String(value)
        );
      }
    }

    return translation;
  }

  // Date formatting
  formatDate(date: Date, format: keyof LocaleConfig['dateFormat'] = 'short'): string {
    const config = this.getLocaleConfig();
    
    try {
      return new Intl.DateTimeFormat(config.locale, {
        year: 'numeric',
        month: format === 'long' ? 'long' : '2-digit',
        day: '2-digit',
        ...(format === 'datetime' && {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
        ...(format === 'time' && {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
      }).format(date);
    } catch (error) {
      return date.toISOString();
    }
  }

  // Number formatting
  formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    const config = this.getLocaleConfig();
    
    try {
      return new Intl.NumberFormat(config.locale, options).format(value);
    } catch (error) {
      return String(value);
    }
  }

  // Currency formatting
  formatCurrency(value: number): string {
    const config = this.getLocaleConfig();
    
    try {
      return new Intl.NumberFormat(config.locale, {
        style: 'currency',
        currency: config.currency.code,
      }).format(value);
    } catch (error) {
      return `${config.currency.symbol} ${value.toFixed(config.currency.decimals)}`;
    }
  }

  // Percentage formatting
  formatPercentage(value: number, decimals: number = 1): string {
    const config = this.getLocaleConfig();
    
    try {
      return new Intl.NumberFormat(config.locale, {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value / 100);
    } catch (error) {
      return `${value.toFixed(decimals)}%`;
    }
  }

  // Relative time formatting (e.g., "há 2 dias", "em 1 hora")
  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (Math.abs(diffMinutes) < 60) {
      if (diffMinutes === 0) return this.t('time.now');
      if (diffMinutes > 0) return this.t('time.inMinutes', { count: diffMinutes });
      return this.t('time.minutesAgo', { count: Math.abs(diffMinutes) });
    }

    if (Math.abs(diffHours) < 24) {
      if (diffHours > 0) return this.t('time.inHours', { count: diffHours });
      return this.t('time.hoursAgo', { count: Math.abs(diffHours) });
    }

    if (Math.abs(diffDays) < 7) {
      if (diffDays > 0) return this.t('time.inDays', { count: diffDays });
      return this.t('time.daysAgo', { count: Math.abs(diffDays) });
    }

    // For longer periods, use absolute date
    return this.formatDate(date);
  }

  // Add translations
  addTranslations(locale: Locale, translations: Record<string, any>): void {
    translationStore.addTranslations(locale, translations);
  }
}

// Global i18n instance
export const i18n = new I18n();

// Helper function for React components
export const useTranslation = (locale?: Locale) => {
  if (locale && locale !== i18n.getLocale()) {
    i18n.setLocale(locale);
  }
  
  return {
    t: i18n.t.bind(i18n),
    formatDate: i18n.formatDate.bind(i18n),
    formatNumber: i18n.formatNumber.bind(i18n),
    formatCurrency: i18n.formatCurrency.bind(i18n),
    formatPercentage: i18n.formatPercentage.bind(i18n),
    formatRelativeTime: i18n.formatRelativeTime.bind(i18n),
    locale: i18n.getLocale(),
    setLocale: i18n.setLocale.bind(i18n),
  };
};

// Export singleton
export default i18n;