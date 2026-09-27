import React, { useState } from 'react';
import { Search, X, Check, Globe, MapPin, Building2, Truck, Sparkles } from 'lucide-react';
import type { CountryConfig, Language } from '../types/index.ts';
import { COUNTRIES, WORLDWIDE_SUPPLIERS } from '../data/countries.ts';
import { t } from '../utils/i18n.ts';

interface CountryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCountry: CountryConfig;
  onSelectCountry: (country: CountryConfig) => void;
  language: Language;
}

export const CountryModal: React.FC<CountryModalProps> = ({
  isOpen,
  onClose,
  selectedCountry,
  onSelectCountry,
  language,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.currency.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cityExamples.some((city) => city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight">
                {t(language, 'selectCountry')}
              </h2>
              <div className="text-[11px] text-slate-400">
                Centrales à béton et normes locales certifiées
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3.5 border-b border-slate-800 bg-slate-950/50">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher un pays, ville (France, Paris, Texas, Montréal...)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-slate-900 border border-slate-700/80 focus:border-amber-400 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:outline-none transition"
              autoFocus
            />
          </div>
        </div>

        {/* Countries List */}
        <div className="overflow-y-auto p-3 space-y-2 flex-1 divide-y divide-slate-800/40">
          {filteredCountries.map((c) => {
            const isSelected = selectedCountry.code === c.code;
            const supplierCount = WORLDWIDE_SUPPLIERS.filter((s) => s.country === c.code).length;

            return (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  onSelectCountry(c);
                  onClose();
                }}
                className={`w-full p-3.5 rounded-xl text-left transition flex items-center justify-between cursor-pointer group pt-3 ${
                  isSelected
                    ? 'bg-amber-400/10 border border-amber-400/50 shadow-inner'
                    : 'hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span className="text-3xl shrink-0 p-1 rounded-lg bg-slate-900 border border-slate-800" role="img" aria-label={c.name}>
                    {c.flag}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white group-hover:text-amber-300 transition">
                        {c.name}
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                        {c.currencySymbol} {c.currency}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                      <span className="flex items-center gap-1 text-slate-300">
                        <Building2 className="w-3 h-3 text-amber-400" />
                        {supplierCount > 0 ? `${supplierCount} centrales partenaires` : 'Réseau national'}
                      </span>
                      <span>·</span>
                      <span className="font-mono text-slate-400">
                        {c.defaultUnits === 'metric' ? 'Métrique (m³)' : 'Impérial (yd³)'}
                      </span>
                      <span>·</span>
                      <span className="text-emerald-400 font-semibold">{c.defaultStrength}</span>
                    </div>

                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Zones : {c.cityExamples.slice(0, 3).join(', ')}...
                    </div>
                  </div>
                </div>

                <div className="shrink-0 pl-2">
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border border-slate-700 group-hover:border-amber-400/60 transition" />
                  )}
                </div>
              </button>
            );
          })}

          {filteredCountries.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400 space-y-1">
              <div>Aucun pays trouvé pour "{searchTerm}".</div>
              <div className="text-slate-500">Essayez avec un nom de pays ou de ville principale.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
