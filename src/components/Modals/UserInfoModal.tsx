/**
 * User Information Screen / Modal
 * Displays all existing user details, credentials, financial configurations,
 * and allows direct profile photo upload from the user's computer.
 * Supports updating personal info and immediate reliable logout.
 */
import React, { useState, useRef } from 'react';
import { UserProfile, Category, Transaction } from '../../types/finance';
import { FinanzaService } from '../../services/storage';
import { Language, translations, formatBRL } from '../../utils/i18n';
import {
  X,
  User,
  Mail,
  ShieldCheck,
  DollarSign,
  Copy,
  Check,
  Layers,
  ArrowRightLeft,
  Edit2,
  Save,
  LogOut,
  Sparkles,
  Camera,
  Upload,
  RotateCcw,
} from 'lucide-react';

interface UserInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProfile: UserProfile;
  categories: Category[];
  transactions: Transaction[];
  lang: Language;
  onProfileUpdated: (updatedProfile: UserProfile) => void;
  onLogout: () => void;
}

export const UserInfoModal: React.FC<UserInfoModalProps> = ({
  isOpen,
  onClose,
  activeProfile,
  categories,
  transactions,
  lang,
  onProfileUpdated,
  onLogout,
}) => {
  if (!isOpen) return null;

  const t = translations[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editFullName, setEditFullName] = useState(activeProfile.fullName);
  const [editIncomeTarget, setEditIncomeTarget] = useState(
    activeProfile.mainIncomeTarget?.toString() || '5000'
  );
  const [editAvatar, setEditAvatar] = useState(activeProfile.avatar || '');
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Process and upload image from computer (converts to optimized square JPEG base64)
  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage(
        lang === 'pt'
          ? 'Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP).'
          : 'Please select a valid image file (PNG, JPG, WEBP).'
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        try {
          // Crop and resize to 256x256 square
          const size = 256;
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setEditAvatar(dataUrl);

          setIsSaving(true);
          const updated = await FinanzaService.updateProfile(activeProfile.id, {
            avatar: dataUrl,
          });

          onProfileUpdated(updated);
          setFeedbackMessage(
            lang === 'pt'
              ? 'Foto de perfil carregada com sucesso!'
              : 'Profile picture uploaded successfully!'
          );
          setTimeout(() => setFeedbackMessage(null), 3500);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Falha ao salvar foto de perfil';
          setErrorMessage(msg);
        } finally {
          setIsSaving(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Reset to default identicon avatar
  const handleResetAvatar = async () => {
    try {
      setIsSaving(true);
      const defaultAvatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${activeProfile.username}`;
      const updated = await FinanzaService.updateProfile(activeProfile.id, {
        avatar: defaultAvatar,
      });
      setEditAvatar(defaultAvatar);
      onProfileUpdated(updated);
      setFeedbackMessage(
        lang === 'pt' ? 'Foto restaurada para o avatar padrão!' : 'Avatar restored to default!'
      );
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao restaurar foto';
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFeedbackMessage(null);

    if (!editFullName.trim()) {
      setErrorMessage(t.fillAllFields);
      return;
    }

    const incomeVal = parseFloat(editIncomeTarget) || 0;

    setIsSaving(true);
    try {
      const updated = await FinanzaService.updateProfile(activeProfile.id, {
        fullName: editFullName.trim(),
        avatar: editAvatar.trim() || undefined,
        mainIncomeTarget: incomeVal,
      });

      onProfileUpdated(updated);
      setIsEditing(false);
      setFeedbackMessage(t.userUpdatedSuccess);
      setTimeout(() => setFeedbackMessage(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar dados do usuário';
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Logout handler without window.confirm blocking
  const handleLogoutAction = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onClose();
    onLogout();
  };

  const userCategoriesCount = categories.length;
  const userTransactionsCount = transactions.filter(
    (tx) => tx.profileId === activeProfile.id
  ).length;

  const currentAvatar =
    editAvatar ||
    activeProfile.avatar ||
    `https://api.dicebear.com/7.x/identicon/svg?seed=${activeProfile.username}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Hidden file input for uploading profile picture from computer */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleImageFileSelect}
        className="hidden"
      />

      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">{t.userInfoTitle}</h2>
              <p className="text-xs text-slate-400">{t.userInfoSubtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title={t.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Feedback alerts */}
          {feedbackMessage && (
            <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-3 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{feedbackMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/25 rounded-xl p-3 flex items-center gap-2">
              <X className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* User Hero Banner Card with Direct Avatar Upload */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
            {/* Avatar with Camera Overlay & Click to Upload */}
            <div className="relative shrink-0 group">
              <img
                src={currentAvatar}
                alt={activeProfile.fullName}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-lg shadow-emerald-500/10 transition-transform group-hover:scale-102"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title={lang === 'pt' ? 'Clique para fazer upload de foto do computador' : 'Click to upload photo from computer'}
                className="absolute inset-0 bg-slate-950/60 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-[2px]"
              >
                <Camera className="w-5 h-5 text-emerald-400 mb-0.5" />
                <span className="text-[10px] font-semibold tracking-wide">
                  {lang === 'pt' ? 'Alterar' : 'Change'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title={lang === 'pt' ? 'Fazer upload de foto do computador' : 'Upload photo from computer'}
                className="absolute -bottom-1 -right-1 p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-md border-2 border-slate-900 cursor-pointer transition-transform hover:scale-110"
              >
                <Upload className="w-3 h-3" />
              </button>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">{activeProfile.fullName}</h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-medium">
                  {lang === 'pt' ? 'Conta Ativa' : 'Active Account'}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1.5 font-mono">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{activeProfile.email || `${activeProfile.username}@finanza.com`}</span>
              </p>
              <p className="text-xs text-slate-400 font-mono">
                <span>@{activeProfile.username}</span>
                <span className="mx-2">·</span>
                <span>Moeda: <strong className="text-emerald-400">BRL (R$)</strong></span>
              </p>

              {/* Upload photo quick button */}
              <div className="pt-1 flex items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  <Upload className="w-3 h-3" />
                  <span>{lang === 'pt' ? 'Upload Foto do Computador' : 'Upload Photo from PC'}</span>
                </button>
                {activeProfile.avatar && !activeProfile.avatar.includes('dicebear') && (
                  <button
                    type="button"
                    onClick={handleResetAvatar}
                    title={lang === 'pt' ? 'Restaurar avatar padrão' : 'Restore default avatar'}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{lang === 'pt' ? 'Padrão' : 'Default'}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(!isEditing);
                  setEditFullName(activeProfile.fullName);
                  setEditIncomeTarget(activeProfile.mainIncomeTarget?.toString() || '5000');
                  setEditAvatar(activeProfile.avatar || '');
                  setErrorMessage(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  isEditing
                    ? 'bg-slate-800 text-slate-200 border-slate-700'
                    : 'bg-emerald-600/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600/25'
                }`}
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{isEditing ? t.cancelEdit : t.editUserInfo}</span>
              </button>
            </div>
          </div>

          {/* EDIT FORM (When active) */}
          {isEditing && (
            <form onSubmit={handleSaveProfile} className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-3.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-semibold text-emerald-400">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>{lang === 'pt' ? 'Editar Dados Cadastrais' : 'Edit Account Details'}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t.fullName}
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t.mainEntriesGoal}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-emerald-400 font-mono font-semibold">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editIncomeTarget}
                      onChange={(e) => setEditIncomeTarget(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {lang === 'pt' ? 'Foto de Perfil' : 'Profile Picture'}
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-700 rounded-lg text-xs text-emerald-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{lang === 'pt' ? 'Escolher do Computador' : 'Choose from PC'}</span>
                    </button>
                    {editAvatar && (
                      <button
                        type="button"
                        onClick={() => setEditAvatar('')}
                        title={lang === 'pt' ? 'Limpar foto' : 'Clear photo'}
                        className="px-2.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {t.cancelEdit}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? t.saving : t.saveUserInfo}</span>
                </button>
              </div>
            </form>
          )}

          {/* Section 1: All User Details Grid */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.userInfoGeneral}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Full Name */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block mb-0.5">{t.fullName}</span>
                <span className="font-semibold text-white text-sm">{activeProfile.fullName}</span>
              </div>

              {/* Email */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block mb-0.5">{t.emailLabel}</span>
                  <span className="font-mono font-medium text-emerald-300">
                    {activeProfile.email || `${activeProfile.username}@finanza.com`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(activeProfile.email || `${activeProfile.username}@finanza.com`, 'email')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title={t.copy}
                >
                  {copiedField === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Username */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block mb-0.5">{t.username}</span>
                <span className="font-mono text-white">@{activeProfile.username}</span>
              </div>

              {/* User ID in System */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                <div className="overflow-hidden mr-2">
                  <span className="text-[11px] text-slate-400 block mb-0.5">{t.userIdLabel}</span>
                  <span className="font-mono text-slate-300 truncate block text-[11px]">
                    {activeProfile.id}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(activeProfile.id, 'userId')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                  title={copiedField === 'userId' ? t.copied : t.copy}
                >
                  {copiedField === 'userId' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Financial Configuration & Statistics */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.userInfoFinancial}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {/* Currency */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block mb-0.5">{t.currencyField}</span>
                <span className="font-semibold text-emerald-400 text-sm font-mono">
                  {activeProfile.currency || 'BRL'} (R$ - Real)
                </span>
              </div>

              {/* Monthly Income Target */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block mb-0.5">{t.mainEntriesGoal}</span>
                <span className="font-semibold text-white text-sm font-mono">
                  {formatBRL(activeProfile.mainIncomeTarget || 5000)}
                </span>
              </div>

              {/* Carryover Balance Setting */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block mb-0.5">
                  {lang === 'pt' ? 'Acúmulo de Saldo' : 'Carryover Balance'}
                </span>
                <span className={`font-semibold ${activeProfile.carryoverBalance ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {activeProfile.carryoverBalance
                    ? (lang === 'pt' ? 'Ativado (Transfere saldo)' : 'Active (Carries over)')
                    : (lang === 'pt' ? 'Desativado (Meses isolados)' : 'Inactive (Isolated months)')}
                </span>
              </div>

              {/* Registered Categories Count */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">{t.totalCategoriesCount}</span>
                  <span className="font-bold text-white text-sm font-mono">{userCategoriesCount}</span>
                </div>
              </div>

              {/* Registered Transactions Count */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">{t.totalTransactionsCount}</span>
                  <span className="font-bold text-white text-sm font-mono">{userTransactionsCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <button
            type="button"
            onClick={handleLogoutAction}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/25 text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{t.logoutButton}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
