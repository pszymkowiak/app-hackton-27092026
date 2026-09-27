import React, { useState } from 'react';
import { X, User, LogOut, CheckCircle2, ShieldCheck, Clock, Truck, ArrowRight, AlertCircle, FileText, Sparkles } from 'lucide-react';
import type { UserProfile, OrderRecord, Language } from '../types/index.ts';
import { signInWithGoogle, logOut } from '../auth.ts';

interface AuthUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onUserChanged: (user: UserProfile | null) => void;
  orders: OrderRecord[];
  onSelectOrderToTrack: (order: OrderRecord) => void;
  language: Language;
}

export const AuthUserModal: React.FC<AuthUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserChanged,
  orders,
  onSelectOrderToTrack,
  language,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const loggedUser = await signInWithGoogle();
      if (loggedUser) {
        onUserChanged(loggedUser);
      }
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      setErrorMsg(
        err?.message?.includes('popup-closed-by-user')
          ? 'Connexion annulée : la fenêtre a été fermée avant validation.'
          : 'Impossible de se connecter avec Google pour le moment. Vous pouvez continuer en mode invité.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await logOut();
      onUserChanged(null);
    } catch (err) {
      console.error('Sign Out error:', err);
    } finally {
      setLoading(false);
    }
  };

  const userOrders = user ? orders.filter((o) => !o.userId || o.userId === user.id) : orders;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight">
                {user
                  ? language === 'fr'
                    ? 'Mon Compte Entrepreneur'
                    : 'My Contractor Account'
                  : language === 'fr'
                    ? 'Connexion Powise'
                    : 'Sign in to Powise'}
              </h2>
              <div className="text-[11px] text-slate-400">
                {user
                  ? language === 'fr'
                    ? 'Profil entrepreneur & commandes synchronisées'
                    : 'Contractor profile & real-time synced orders'
                  : language === 'fr'
                    ? 'Identifiez-vous pour sécuriser vos chantiers'
                    : 'Sign in to sync pours, track mixers & download tickets'}
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

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {user ? (
            /* Logged In State */
            <div className="space-y-4">
              {/* User Card */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3.5 shadow-inner">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-amber-400 shadow-md"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black text-lg flex items-center justify-center shadow-md">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-white text-base truncate">{user.name}</span>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <ShieldCheck className="w-3 h-3" /> Vérifié
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 truncate">{user.email}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    ID : {user.id.slice(0, 10)}...
                  </div>
                </div>
              </div>

              {/* Status perks */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="text-slate-400 text-[11px]">Compte Client</div>
                  <div className="font-bold text-amber-400 mt-0.5">Professionnel Pro</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="text-slate-400 text-[11px]">Facturation</div>
                  <div className="font-bold text-slate-200 mt-0.5">Centralisée TVA</div>
                </div>
              </div>

              {/* Recent Orders Section */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-amber-400" />
                    Mes Commandes Récentes ({userOrders.length})
                  </span>
                </div>

                {userOrders.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-center text-xs text-slate-400">
                    Aucune commande enregistrée pour l'instant. Votre prochaine commande de béton sera automatiquement liée à votre profil.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {userOrders.map((ord) => (
                      <div
                        key={ord.id}
                        onClick={() => {
                          onSelectOrderToTrack(ord);
                          onClose();
                        }}
                        className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-400/40 transition cursor-pointer flex items-center justify-between group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white group-hover:text-amber-300 transition truncate">
                              {ord.supplierName}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-400/10 text-amber-400">
                              {ord.finalVolumeM3} m³ ({ord.finalVolumeYd3} yd³)
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                            {ord.address} · {ord.deliveryDate}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <span className="text-xs font-mono font-black text-amber-400">
                            {ord.currencySymbol}{ord.pricing.totalEstimated}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-300 transition group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sign out button */}
              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Se déconnecter</span>
                </button>
              </div>
            </div>
          ) : (
            /* Logged Out / Prompt State */
            <div className="space-y-4 text-center py-2">
              <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-400/10">
                <Truck className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-black text-white">Créez votre compte en 1 clic</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Connectez-vous avec votre compte Google pour sauvegarder vos commandes, suivre l'arrivée de vos toupies en direct et gérer vos factures sur tous vos appareils.
                </p>
              </div>

              {/* Benefits list */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 text-left text-xs space-y-2 max-w-sm mx-auto">
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Suivi GPS en temps réel des camions toupie</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Historique des volumes coulés et fiches techniques béton</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Remplissage automatique sur vos chantiers</span>
                </div>
              </div>

              {/* Google Button */}
              <div className="pt-2 max-w-sm mx-auto">
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-black text-sm flex items-center justify-center gap-3 shadow-xl transition cursor-pointer active:scale-[0.98] disabled:opacity-50"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                  <span>{loading ? 'Connexion en cours...' : 'Se connecter avec Google'}</span>
                </button>

                <div className="text-[11px] text-slate-400 mt-2">
                  Aucun mot de passe requis. Authentification sécurisée par Google Firebase.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
