// components/LoginNavbar.jsx
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { Globe } from 'lucide-react';

const LoginNavbar = () => {
  const { t, i18n } = useTranslation(['nav']);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <nav className="w-full flex items-center justify-between p-4 bg-white/40 backdrop-blur-md shadow-md fixed top-0 z-50">
      <Link to="/" className="text-2xl font-bold text-red-600">
        ArtisanConnect
      </Link>
      <div className="flex items-center space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center space-x-2 text-sm font-medium hover:bg-white/40 px-3 py-2 rounded-xl"
            >
              <Globe className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 bg-white text-gray-800 rounded-xl shadow-xl border border-gray-200"
          >
            <DropdownMenuItem onClick={() => changeLanguage('en')}>{t('nav:language')} - English</DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeLanguage('es')}>{t('nav:language')} - Español</DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeLanguage('hi')}>{t('nav:language')} - हिंदी</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Link
          to="/register"
          className="text-sm font-medium text-red-600 hover:underline"
        >
          Sign Up
        </Link>
      </div>
    </nav>
  );
};

export default LoginNavbar;
