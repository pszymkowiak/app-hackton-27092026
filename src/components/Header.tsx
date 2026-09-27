import React from 'react';
import { Truck, Factory, HardHat, ChevronDown, User, LogIn, Sparkles, Globe } from 'lucide-react';
import type { CountryConfig, Language, UnitSystem, UserProfile } from '../types/index.ts';
import { t } from '../utils/i18n.ts';
import { POURWISE_LOGO_URL } from '../assets/logo.ts';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  units: UnitSystem;
  onUnitsChange: (units: UnitSystem) => void;
  country: CountryConfig;
  onOpenCountryModal: () => void;
  user: UserProfile | null;
  onOpenAuthModal: () => void;
  activeTab: 'order' | 'tracking' | 'plant';
  onTabChange: (tab: 'order' | 'tracking' | 'plant') => void;
  hasActiveOrder: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  units,
  onUnitsChange,
  country,
  onOpenCountryModal,
  user,
  onOpenAuthModal,
  activeTab,
  onTabChange,
  hasActiveOrder,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#090D1A]/95 backdrop-blur-xl border-b border-slate-800/80 text-white shadow-2xl">
      {/* Top Bar: Brand & Quick Settings */}
      <div className="max-w-4xl mx-auto px-3.5 py-2.5 flex items-center justify-between border-b border-slate-800/50">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-900 border border-amber-400/40 shadow-lg shadow-amber-400/10 shrink-0 flex items-center justify-center">
            <img
              src={POURWISE_LOGO_URL}
              alt="Pourwise Logo"
              className="w-full h-full object-cover"
              onError={(e) => {
                // fallback if image fails to render
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <div className="font-black text-lg tracking-tight text-white flex items-center gap-1.5 leading-none">
              <span>Pourwise</span>
              <span className="text-[9px] uppercase font-mono font-black tracking-widest text-slate-950 bg-amber-400 px-1.5 py-0.5 rounded">
                SHARE & POOL
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium tracking-tight mt-0.5 hidden xs:block">
              Concrete Ordering & Shared Pool Delivery
            </div>
          </div>
        </div>

        {/* Global Controls: Country, Units, Language & Google User */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Country Selector Button */}
          <button
            type="button"
            onClick={onOpenCountryModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-bold text-slate-200 transition cursor-pointer shadow-sm active:scale-95"
            title="Changer de pays et centrale"
          >
            <span className="text-base leading-none" role="img" aria-label={country.name}>
              {country.flag}
            </span>
            <span className="hidden sm:inline text-xs font-black">{country.name}</span>
            <span className="font-mono text-amber-400 text-xs font-bold">
              {country.currencySymbol}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Unit Switcher */}
          <button
            type="button"
            onClick={() => onUnitsChange(units === 'imperial' ? 'metric' : 'imperial')}
            className="px-2 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono font-black text-slate-200 transition cursor-pointer active:scale-95"
            title="Basculer unités Métrique (m³) / Impérial (yd³)"
          >
            <span className="text-amber-400">{units === 'imperial' ? 'yd³' : 'm³'}</span>
          </button>

          {/* Language Switcher */}
          <div className="hidden sm:flex bg-slate-900/90 rounded-xl border border-slate-700/80 p-0.5 text-xs font-bold">
            <button
              onClick={() => onLanguageChange('fr')}
              className={`px-2 py-1 rounded-lg transition ${
                language === 'fr'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              FR
            </button>
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-2 py-1 rounded-lg transition ${
                language === 'en'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => onLanguageChange('es')}
              className={`px-2 py-1 rounded-lg transition ${
                language === 'es'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ES
            </button>
          </div>

          {/* Google User Account Button */}
          <button
            type="button"
            onClick={onOpenAuthModal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition cursor-pointer shadow-sm active:scale-95 ${
              user
                ? 'bg-slate-900/90 hover:bg-slate-800 border-amber-400/40 text-slate-200'
                : 'bg-white hover:bg-slate-100 border-white text-slate-950 font-black'
            }`}
            title={user ? `Compte connecté: ${user.name}` : 'Se connecter avec Google'}
          >
            {user ? (
              <>
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.name}
                    className="w-5 h-5 rounded-full object-cover border border-amber-400"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-[10px]">
                    {user.name.charAt(0)}
                  </div>
                )}
                <span className="hidden md:inline text-xs font-bold max-w-[90px] truncate">
                  {user.name.split(' ')[0]}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </>
            ) : (
              <>
                {/* Official Google G icon */}
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="text-xs font-black hidden xs:inline">Connexion</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Tabs (Refined modern segmented navigation) */}
      <div className="max-w-4xl mx-auto px-3.5 py-2 flex gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => onTabChange('order')}
          className={`flex-1 min-h-[44px] py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
            activeTab === 'order'
              ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/20'
              : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800/80 border border-slate-800'
          }`}
        >
          <HardHat className="w-4 h-4" />
          <span>{t(language, 'foremanTab')}</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('tracking')}
          className={`flex-1 min-h-[44px] py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer relative ${
            activeTab === 'tracking'
              ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/20'
              : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800/80 border border-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>{t(language, 'myOrderTab')}</span>
          {hasActiveOrder && (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onTabChange('plant')}
          className={`flex-1 min-h-[44px] py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
            activeTab === 'plant'
              ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/20'
              : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800/80 border border-slate-800'
          }`}
        >
          <Factory className="w-4 h-4" />
          <span>{t(language, 'plantTab')}</span>
        </button>
      </div>
    </header>
  );
};
