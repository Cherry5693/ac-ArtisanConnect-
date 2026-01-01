import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en/translation.json';
import es from './locales/es/translation.json';
import hi from './locales/hi/translation.json';
import enNav from './locales/en/nav.json';
import hiNav from './locales/hi/nav.json';
import esNav from './locales/es/nav.json';
import enAuth from './locales/en/auth.json';
import hiAuth from './locales/hi/auth.json';
import enLogin from './locales/en/login.json';
import enHome from './locales/en/home.json';
import hiHome from './locales/hi/home.json';

i18n
  // detect user language
  // learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next with local resources
  .init({
    resources: {
      en: { translation: en, nav: enNav, auth: enAuth, login: enLogin, home: enHome },
      es: { translation: es, nav: esNav },
      hi: { translation: hi, nav: hiNav, auth: hiAuth, home: hiHome },
    },
    ns: ['translation', 'nav', 'auth', 'login', 'home'],
    defaultNS: 'translation',
    debug: true,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
  });

export default i18n;
