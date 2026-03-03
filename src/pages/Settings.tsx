import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { LANGUAGES } from '@/i18n';
import { useTheme } from '@/contexts/ThemeContext';
import { AppLayout } from '@/layouts/AppLayout';
import { Modal } from '@/components/ui/Modal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button, cn } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { User, Bell, Shield, Palette, Download, LogOut, Camera, Check, ChevronRight, ImagePlus, Smile, Globe } from 'lucide-react';
import { useApiData } from '@/contexts/ApiDataContext';
import { makeInitialAvatar } from '@/lib/avatar';

/** Generates a unique cute cartoon face SVG (fully local, no API) */
function makeCartoonAvatar(seed: string): string {
  let h = 0;
  for (const c of seed) h = Math.imul(31, h) + c.charCodeAt(0) | 0;
  h = Math.abs(h);
  const p = <T,>(arr: T[], shift = 0): T => arr[(h >> shift) % arr.length];

  const bg    = p(['#fef3c7','#e0f2fe','#f0e6ff','#dcfce7','#ffe4e6','#fff7ed','#fdf4ff','#ecfdf5']);
  const face  = p(['#fcd34d','#a78bfa','#6ee7b7','#93c5fd','#f9a8d4','#fb923c','#c4b5fd','#34d399'], 3);
  const acc   = p(['#92400e','#5b21b6','#047857','#1d4ed8','#9d174d','#b45309','#4338ca','#065f46'], 6);

  const type  = h % 8; // 8 character archetypes
  let top = '';
  if (type === 0) // antenna
    top = `<line x1="40" y1="8" x2="40" y2="22" stroke="${acc}" stroke-width="3" stroke-linecap="round"/><circle cx="40" cy="7" r="5" fill="${acc}"/>`;
  else if (type === 1) // cat ears
    top = `<polygon points="20,28 14,10 30,20" fill="${face}"/><polygon points="60,28 66,10 50,20" fill="${face}"/><polygon points="22,26 17,13 29,21" fill="#fda4af"/><polygon points="58,26 63,13 51,21" fill="#fda4af"/>`;
  else if (type === 2) // bunny
    top = `<ellipse cx="26" cy="16" rx="6" ry="13" fill="${face}"/><ellipse cx="54" cy="16" rx="6" ry="13" fill="${face}"/><ellipse cx="26" cy="16" rx="3.5" ry="9" fill="#fda4af"/><ellipse cx="54" cy="16" rx="3.5" ry="9" fill="#fda4af"/>`;
  else if (type === 3) // crown
    top = `<polygon points="16,30 20,16 30,24 40,12 50,24 60,16 64,30" fill="#fbbf24" stroke="#f59e0b" stroke-width="1.5" stroke-linejoin="round"/><circle cx="40" cy="14" r="3" fill="#f87171"/><circle cx="24" cy="20" r="2.5" fill="#34d399"/><circle cx="56" cy="20" r="2.5" fill="#818cf8"/>`;
  else if (type === 4) // horns
    top = `<path d="M22 28 L16 10 L30 22 Z" fill="${acc}"/><path d="M58 28 L64 10 L50 22 Z" fill="${acc}"/>`;
  else if (type === 5) // bow
    top = `<path d="M24 22 Q28 16 34 20 Q30 24 24 22Z" fill="#f472b6"/><path d="M56 22 Q52 16 46 20 Q50 24 56 22Z" fill="#f472b6"/><circle cx="40" cy="20" r="4" fill="#f472b6"/>`;
  else if (type === 6) // spiky hair
    top = `<path d="M22 30 L18 12 L28 24 L32 10 L38 26 L40 8 L42 26 L48 10 L52 24 L62 12 L58 30" fill="${acc}" stroke="${acc}" stroke-width="1" stroke-linejoin="round"/>`;
  else // simple round top
    top = `<ellipse cx="40" cy="24" rx="18" ry="8" fill="${face}"/>`;

  const eyeType = (h >> 4) % 3;
  let eyes = '';
  if (eyeType === 0) // classic round
    eyes = `<circle cx="29" cy="44" r="6" fill="white"/><circle cx="51" cy="44" r="6" fill="white"/><circle cx="30" cy="44" r="3" fill="${acc}"/><circle cx="52" cy="44" r="3" fill="${acc}"/><circle cx="31" cy="43" r="1.2" fill="white"/><circle cx="53" cy="43" r="1.2" fill="white"/>`;
  else if (eyeType === 1) // oval
    eyes = `<ellipse cx="29" cy="44" rx="7" ry="5" fill="white"/><ellipse cx="51" cy="44" rx="7" ry="5" fill="white"/><ellipse cx="30" cy="44" rx="3.5" ry="3" fill="${acc}"/><ellipse cx="52" cy="44" rx="3.5" ry="3" fill="${acc}"/><circle cx="31" cy="43" r="1" fill="white"/><circle cx="53" cy="43" r="1" fill="white"/>`;
  else // sparkle/star (^^)
    eyes = `<path d="M23 41 Q29 36 35 41 Q29 46 23 41Z" fill="${acc}"/><path d="M45 41 Q51 36 57 41 Q51 46 45 41Z" fill="${acc}"/>`;

  const mouthType = (h >> 7) % 3;
  let mouth = '';
  if (mouthType === 0) // smile
    mouth = `<path d="M30 56 Q40 64 50 56" stroke="${acc}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  else if (mouthType === 1) // open grin
    mouth = `<path d="M30 55 Q40 65 50 55" stroke="${acc}" stroke-width="2.5" fill="${acc}" stroke-linecap="round"/><path d="M32 55 Q40 63 48 55 Z" fill="white"/>`;
  else // beam (wide)
    mouth = `<path d="M28 55 Q40 66 52 55" stroke="${acc}" stroke-width="3" fill="none" stroke-linecap="round"/>`;

  const hasBlush = (h & 32) === 0;
  const blush = hasBlush ? `<ellipse cx="22" cy="50" rx="6" ry="4" fill="#fda4af" opacity="0.5"/><ellipse cx="58" cy="50" rx="6" ry="4" fill="#fda4af" opacity="0.5"/>` : '';

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">`,
    `<rect width="80" height="80" rx="40" fill="${bg}"/>`,
    top,
    `<circle cx="40" cy="46" r="24" fill="${face}"/>`,
    eyes, blush, mouth,
    `</svg>`,
  ].join('');
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// 24 seeds — each produces a unique cartoon face via makeCartoonAvatar
const AVATAR_SEEDS = [
  'Zara','Bolt','Cleo','Dino','Echo','Fuzz',
  'Grid','Halo','Iris','Jade','Knox','Luna',
  'Milo','Nova','Onyx','Pixel','Quiz','Rex',
  'Sage','Taro','Uno','Vex','Wren','Xero',
];

interface ProfileData { firstName: string; lastName: string; username?: string; email: string; avatarSrc: string; }

const NAV_ITEM_DEFS = [
  { id: 'profile',       icon: User,    labelKey: 'settings.profile'       },
  { id: 'notifications', icon: Bell,    labelKey: 'settings.notifications'  },
  { id: 'appearance',    icon: Palette, labelKey: 'settings.appearance'     },
  { id: 'language',      icon: Globe,   labelKey: 'settings.language'       },
  { id: 'security',      icon: Shield,  labelKey: 'settings.security'       },
] as const;
type NavId = typeof NAV_ITEM_DEFS[number]['id'];

export default function Settings() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { profile, updateProfile } = useApiData();
  const [activeTab, setActiveTab] = useState<NavId>('profile');
  const [taskUpdates, setTaskUpdates] = useState(true);
  const [projectMentions, setProjectMentions] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const [firstName, setFirstName] = useState(profile.firstName || 'Nexum');
  const [lastName, setLastName] = useState(profile.lastName || 'User');
  const [username, setUsername] = useState(profile.username || '');
  const [email, setEmail] = useState(profile.email || 'nexum@example.com');
  const [avatarSrc, setAvatarSrc] = useState(profile.avatarSrc || makeInitialAvatar('Nexum'));

  useEffect(() => {
    setFirstName(profile.firstName || 'Nexum');
    setLastName(profile.lastName || 'User');
    setUsername(profile.username || '');
    setEmail(profile.email || 'nexum@example.com');
    setAvatarSrc(profile.avatarSrc || makeInitialAvatar(profile.firstName || 'Nexum'));
  }, [profile]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) { alert(t('settings.fileTooLarge')); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      setAvatarSrc(src);
      setShowPicker(false);
      updateProfile({ avatarSrc: src });
    };
    reader.readAsDataURL(file);
  }, [updateProfile]);

  const handleSave = async () => {
    await updateProfile({ firstName, lastName, username, email, avatarSrc });
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const handleSignOut = () => navigate('/login');
  const handleExportData = () => {
    const data = { exportedAt: new Date().toISOString(), user: `${firstName} ${lastName}` };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `nexum-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [pickerTab, setPickerTab] = useState<'avatar' | 'photo'>('avatar');

  return (
    <AppLayout>
      {/* ── Photo / Avatar picker modal ───────────────────────── */}
      <Modal open={showPicker} onClose={() => setShowPicker(false)} title={t('settings.profilePhoto')} maxWidth="max-w-lg">
        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 pb-3 border-b border-[var(--color-border-subtle)]">
          {([
            { id: 'avatar' as const, label: t('settings.chooseAvatar'), icon: Smile },
            { id: 'photo'  as const, label: t('settings.uploadPhoto'),  icon: ImagePlus },
          ]).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setPickerTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                pickerTab === tab.id
                  ? 'bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)]'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Avatar grid */}
        {pickerTab === 'avatar' && (
          <div className="px-6 py-5">
            <div className="grid grid-cols-6 gap-3">
              {AVATAR_SEEDS.map((seed) => {
                const url = makeCartoonAvatar(seed);
                const isActive = avatarSrc === url;
                return (
                  <button
                    key={seed}
                    type="button"
                    title={seed}
                    onClick={() => {
                      setAvatarSrc(url);
                      setShowPicker(false);
                      setAvatarSrc(url);
                      updateProfile({ avatarSrc: url });
                    }}
                    className={cn(
                      'relative h-12 w-12 rounded-full overflow-hidden border-2 transition-all hover:scale-110 focus:outline-none bg-[var(--color-bg-secondary)]',
                      isActive
                        ? 'border-[var(--color-accent-primary)] ring-2 ring-[var(--color-accent-primary)]/30 scale-110 shadow-md'
                        : 'border-transparent hover:border-[var(--color-accent-primary)]/40'
                    )}
                  >
                    <img
                      src={url}
                      alt={seed}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    {isActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-accent-primary)]/25">
                        <Check className="h-4 w-4 text-white drop-shadow" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Upload photo */}
        {pickerTab === 'photo' && (
          <div className="px-6 py-5 space-y-4">
            <p className="text-xs text-[var(--color-text-muted)]">{t('settings.uploadPhotoDesc')}</p>
            {/* Current preview */}
            <div className="flex items-center gap-4">
              <img
                src={avatarSrc}
                alt="Current"
                className="h-16 w-16 rounded-full object-cover border-2 border-[var(--color-border-subtle)] shadow"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = makeInitialAvatar(firstName || 'N'); }}
              />
              <div>
                <p className="text-sm font-medium text-[var(--color-text-high)]">{t('settings.currentPhoto')}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{t('settings.clickToChange')}</p>
              </div>
            </div>
            {/* Drop zone */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-3 py-8 rounded-xl border-2 border-dashed border-[var(--color-border-subtle)] hover:border-[var(--color-accent-primary)]/50 hover:bg-[var(--color-accent-primary)]/4 transition-all group"
            >
              <div className="h-12 w-12 rounded-full bg-[var(--color-bg-secondary)] group-hover:bg-[var(--color-accent-primary)]/10 flex items-center justify-center transition-all">
                <ImagePlus className="h-6 w-6 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-primary)] transition-colors" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-[var(--color-text-high)]">{t('settings.clickToChoose')}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{t('settings.photoFormat')}</p>
              </div>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
          </div>
        )}
      </Modal>

      <div className="flex flex-col lg:flex-row gap-6 h-full max-w-5xl">

        {/* ── Left sidebar ─────────────────────────────────────── */}
        <aside className="flex flex-col gap-1 lg:w-56 shrink-0">

          {/* Profile blurb */}
          <div className="flex flex-col items-center text-center gap-2 px-4 py-5 mb-1 rounded-2xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]">
            {/* Avatar */}
            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className="group relative h-20 w-20 rounded-full overflow-hidden ring-4 ring-[var(--color-accent-primary)]/20 hover:ring-[var(--color-accent-primary)]/60 shadow-md hover:shadow-lg focus:outline-none transition-all"
              aria-label={t('settings.profilePhoto')}
            >
              <img
                src={avatarSrc}
                alt={`${firstName} ${lastName}`}
                className="h-full w-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = makeInitialAvatar(firstName || 'N'); }}
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-0.5">
                <Camera className="h-4 w-4 text-white" />
                <span className="text-[9px] font-bold text-white uppercase tracking-widest">{t('settings.changePhoto')}</span>
              </div>
              {/* Online dot */}
              <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-white" />
            </button>
            <div className="min-w-0 w-full">
              <p className="text-sm font-semibold text-[var(--color-text-high)] truncate">{firstName} {lastName}</p>
              <p className="text-xs text-[var(--color-text-muted)] truncate">{email}</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible">
            {NAV_ITEM_DEFS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left whitespace-nowrap lg:whitespace-normal shrink-0 lg:shrink',
                  activeTab === item.id
                    ? 'bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)]'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-high)]'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{t(item.labelKey)}</span>
                {activeTab === item.id && <ChevronRight className="hidden lg:block h-3.5 w-3.5 opacity-40" />}
              </button>
            ))}
            <button
              type="button"
              onClick={handleSignOut}
              className="hidden lg:flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left mt-2 pt-2 border-t border-[var(--color-border-subtle)] text-[var(--color-status-danger)] hover:bg-[var(--color-status-danger)]/8"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {t('common.signOut')}
            </button>
          </nav>
        </aside>

        {/* ── Content panel ────────────────────────────────────── */}
        <div className="flex-1 min-w-0 overflow-y-auto pb-8">

            {activeTab === 'profile' && (
              <Card className="border-none shadow-sm bg-[var(--color-bg-elevated)]">
                <CardHeader className="border-b border-[var(--color-border-subtle)] pb-4">
                  <CardTitle>{t('settings.accountInfo')}</CardTitle>
                  <CardDescription>{t('settings.accountInfoDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label={t('settings.firstName')}    value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    <Input label={t('settings.lastName')} value={lastName}  onChange={(e) => setLastName(e.target.value)} />
                  </div>
                  <Input label={t('settings.email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">{t('settings.timezone')}</label>
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] text-sm text-[var(--color-text-muted)]">
                      🌏&nbsp; Asia / Jakarta (UTC+7)
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <Button onClick={handleSave} className="min-w-[120px] gap-2">
                      {saved ? <><Check className="h-4 w-4" /> {t('settings.saved')}</> : t('settings.saveChanges')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'notifications' && (
              <Card className="border-none shadow-sm bg-[var(--color-bg-elevated)]">
                <CardHeader className="border-b border-[var(--color-border-subtle)] pb-4">
                  <CardTitle>{t('settings.notifications')}</CardTitle>
                  <CardDescription>{t('settings.notificationsDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="pt-2 divide-y divide-[var(--color-border-subtle)]">
                  {[
                    { checked: taskUpdates,     set: setTaskUpdates,     label: t('settings.taskUpdates'),    desc: t('settings.taskUpdatesDesc') },
                    { checked: projectMentions, set: setProjectMentions, label: t('settings.projectMentions'), desc: t('settings.projectMentionsDesc') },
                    { checked: weeklyDigest,    set: setWeeklyDigest,    label: t('settings.weeklyDigest'),   desc: t('settings.weeklyDigestDesc') },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start justify-between gap-4 py-4">
                      <div className="space-y-0.5 flex-1">
                        <p className="text-sm font-medium text-[var(--color-text-high)]">{item.label}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{item.desc}</p>
                      </div>
                      <Toggle checked={item.checked} onCheckedChange={item.set} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {activeTab === 'appearance' && (
              <Card className="border-none shadow-sm bg-[var(--color-bg-elevated)]">
                <CardHeader className="border-b border-[var(--color-border-subtle)] pb-4">
                  <CardTitle>{t('settings.appearance')}</CardTitle>
                  <CardDescription>{t('settings.appearanceDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4 max-w-xs">
                    {([
                      {
                        id: 'dark' as const, label: t('settings.darkTheme'),
                        preview: (
                          <div className="h-24 w-full rounded-lg bg-[#09090b] p-3 flex flex-col gap-2">
                            <div className="flex gap-1.5 items-center">
                              <div className="h-2 w-2 rounded-full bg-[#27272a]" />
                              <div className="h-1.5 flex-1 bg-[#27272a] rounded" />
                            </div>
                            <div className="h-1.5 w-3/4 bg-[#3f3f46] rounded" />
                            <div className="h-1.5 w-1/2 bg-[#3f3f46] rounded" />
                            <div className="mt-auto h-6 w-2/3 rounded-md bg-indigo-600/60" />
                          </div>
                        ),
                      },
                      {
                        id: 'light' as const, label: t('settings.lightTheme'),
                        preview: (
                          <div className="h-24 w-full rounded-lg bg-white border border-[#e4e4e7] p-3 flex flex-col gap-2">
                            <div className="flex gap-1.5 items-center">
                              <div className="h-2 w-2 rounded-full bg-[#e4e4e7]" />
                              <div className="h-1.5 flex-1 bg-[#e4e4e7] rounded" />
                            </div>
                            <div className="h-1.5 w-3/4 bg-[#d4d4d8] rounded" />
                            <div className="h-1.5 w-1/2 bg-[#d4d4d8] rounded" />
                            <div className="mt-auto h-6 w-2/3 rounded-md bg-indigo-400/40" />
                          </div>
                        ),
                      },
                    ] as const).map((th) => (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => setTheme(th.id)}
                        className={cn(
                          'flex flex-col gap-2 rounded-xl p-2 border-2 transition-all text-left',
                          theme === th.id
                            ? 'border-[var(--color-accent-primary)] ring-2 ring-[var(--color-accent-primary)]/20 ring-offset-2 ring-offset-[var(--color-bg-elevated)]'
                            : 'border-[var(--color-border-subtle)] hover:border-[var(--color-accent-primary)]/40'
                        )}
                      >
                        {th.preview}
                        <div className="flex items-center justify-between px-1">
                          <span className="text-sm font-medium text-[var(--color-text-high)]">{th.label}</span>
                          {theme === th.id && <Check className="h-3.5 w-3.5 text-[var(--color-accent-primary)]" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'language' && (
              <Card className="border-none shadow-sm bg-[var(--color-bg-elevated)]">
                <CardHeader className="border-b border-[var(--color-border-subtle)] pb-4">
                  <CardTitle>{t('settings.language')}</CardTitle>
                  <CardDescription>{t('settings.languageDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-2 max-w-sm">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => i18n.changeLanguage(lang.code)}
                        className={cn(
                          'flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left transition-all',
                          i18n.language === lang.code
                            ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/8 text-[var(--color-accent-primary)]'
                            : 'border-[var(--color-border-subtle)] hover:border-[var(--color-accent-primary)]/40 hover:bg-[var(--color-bg-hover)] text-[var(--color-text-high)]'
                        )}
                      >
                        <div>
                          <p className="text-sm font-semibold">{lang.nativeLabel}</p>
                          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{lang.label}</p>
                        </div>
                        {i18n.language === lang.code && <Check className="h-4 w-4 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'security' && (
              <div className="space-y-4">
                <Card className="border-none shadow-sm bg-[var(--color-bg-elevated)]">
                  <CardHeader className="border-b border-[var(--color-border-subtle)] pb-4">
                    <CardTitle>{t('settings.securityTitle')}</CardTitle>
                    <CardDescription>{t('settings.securityDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <Input label={t('settings.currentPassword')}   type="password" />
                    <Input label={t('settings.newPassword')}       type="password" />
                    <Input label={t('settings.confirmPassword')} type="password" />
                    <div className="flex justify-end pt-1">
                      <Button>{t('settings.updatePassword')}</Button>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-[var(--color-bg-elevated)]">
                  <CardHeader className="border-b border-[var(--color-border-subtle)] pb-4">
                    <CardTitle>{t('settings.exportData')}</CardTitle>
                    <CardDescription>{t('settings.exportDataDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <Button variant="outline" onClick={handleExportData} className="gap-2">
                      <Download className="h-4 w-4" /> {t('settings.exportDataBtn')}
                    </Button>
                  </CardContent>
                </Card>
                <div className="lg:hidden">
                  <Button
                    variant="ghost"
                    className="w-full gap-2 text-[var(--color-status-danger)] hover:bg-[var(--color-status-danger)]/8"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4" /> {t('common.signOut')}
                  </Button>
                </div>
              </div>
            )}

          </div>
      </div>
    </AppLayout>
  );
}

