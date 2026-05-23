import { FormEvent, ReactNode, useMemo, useState } from 'react';

import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { useConvexAuth, useQuery } from 'convex/react';
import {
  CheckCircle,
  ChevronLeft,
  KeyRound,
  LogOut,
  Moon,
  Settings,
  ShieldCheck,
  Sun,
  UserRound,
  X,
} from 'lucide-react';

import { deserializeCharacterFromBackend } from '@/domain/fabU/characterMigration';
import { authClient } from '@/lib/auth-client';

import { api } from '../../../../convex/_generated/api';
import { useFabUTokens } from '../ThemeContext';

type AuthMode = 'signIn' | 'signUp';
type AccountModalScreen = 'profile' | 'characters';
type OAuthProvider = 'google' | 'discord';

type AuthSession = {
  user?: {
    email?: string | null;
    image?: string | null;
    name?: string | null;
  } | null;
} | null;

type AccountMenuProps = {
  localCharacterName: string;
  onToggleTheme: () => void;
  themeMode: 'dark' | 'light';
};

type AuthResult = {
  error?: { message?: string } | null;
};

type OAuthProviderConfig = {
  icon: ReactNode;
  label: string;
  provider: OAuthProvider;
};

const authModes: Array<{ label: string; value: AuthMode }> = [
  { label: 'Sign in', value: 'signIn' },
  { label: 'Create', value: 'signUp' },
];

function GoogleLogo() {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
      sx={{ display: 'block', width: 16, height: 16 }}
    >
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.78-.07-1.53-.2-2.23H12v4.22h5.37a4.6 4.6 0 0 1-1.99 3.02v2.5h3.22c1.88-1.73 3-4.28 3-7.51Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.6-2.44l-3.22-2.5c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.76-5.59-4.13H3.08v2.58A9.99 9.99 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.41 13.88a6 6 0 0 1 0-3.76V7.54H3.08a10.01 10.01 0 0 0 0 8.92l3.33-2.58Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.99c1.47 0 2.78.5 3.82 1.49l2.86-2.86C16.95 3.01 14.7 2 12 2a9.99 9.99 0 0 0-8.92 5.54l3.33 2.58C7.2 7.75 9.4 5.99 12 5.99Z"
      />
    </Box>
  );
}

function DiscordLogo() {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
      sx={{ display: 'block', width: 16, height: 16 }}
    >
      <path
        fill="#5865F2"
        d="M19.54 5.34A16.08 16.08 0 0 0 15.57 4a10.9 10.9 0 0 0-.51 1.05 14.95 14.95 0 0 0-4.42 0A10.9 10.9 0 0 0 10.13 4a16.33 16.33 0 0 0-3.98 1.34C3.63 9.12 2.94 12.8 3.28 16.42a16.1 16.1 0 0 0 4.88 2.47c.39-.54.74-1.1 1.04-1.7a10.52 10.52 0 0 1-1.64-.79c.14-.1.27-.2.4-.3a11.55 11.55 0 0 0 10.08 0c.13.1.26.2.4.3-.52.31-1.07.58-1.65.8.3.58.65 1.15 1.04 1.69a16.05 16.05 0 0 0 4.89-2.47c.4-4.2-.68-7.84-3.18-11.08ZM9.66 14.17c-.95 0-1.72-.87-1.72-1.94 0-1.07.76-1.94 1.72-1.94.96 0 1.74.88 1.72 1.94 0 1.07-.76 1.94-1.72 1.94Zm4.68 0c-.95 0-1.72-.87-1.72-1.94 0-1.07.76-1.94 1.72-1.94.96 0 1.74.88 1.72 1.94 0 1.07-.76 1.94-1.72 1.94Z"
      />
    </Box>
  );
}

const oauthProviders: OAuthProviderConfig[] = [
  { label: 'Google', provider: 'google', icon: <GoogleLogo /> },
  { label: 'Discord', provider: 'discord', icon: <DiscordLogo /> },
];

function getAuthErrorMessage(error: unknown) {
  if (!error) return 'Something went wrong.';
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return 'Something went wrong.';
}

function assertAuthSuccess(result: unknown) {
  const authResult = result as AuthResult | undefined;
  if (authResult?.error) {
    throw new Error(authResult.error.message ?? 'Authentication failed.');
  }
}

function getCharacterDisplayName(character: { name?: string; characterState?: unknown }) {
  try {
    const state = deserializeCharacterFromBackend(character.characterState);
    const nameParts = [
      state.firstName,
      state.nickName ? `"${state.nickName}"` : '',
      state.lastName,
    ].filter(Boolean);
    return nameParts.join(' ').trim() || character.name || 'Unnamed character';
  } catch {
    return character.name || 'Unnamed character';
  }
}

function AuthField({
  label,
  type = 'text',
  value,
  autoComplete,
  onChange,
}: {
  label: string;
  type?: string;
  value: string;
  autoComplete?: string;
  onChange: (value: string) => void;
}) {
  const fabUTokens = useFabUTokens();

  return (
    <Stack spacing={0.55}>
      <Typography
        variant="caption"
        sx={{
          color: fabUTokens.color.textSecondary,
          fontSize: '0.62rem',
          fontWeight: 800,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Typography>
      <InputBase
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        sx={{
          minHeight: 40,
          borderRadius: '8px',
          border: `1px solid ${fabUTokens.color.border}`,
          bgcolor: fabUTokens.color.pillSurface,
          color: fabUTokens.color.textPrimary,
          px: 1.2,
          fontSize: '0.86rem',
          boxShadow: fabUTokens.shadow.card,
          '& input': {
            p: 0,
            height: 40,
          },
        }}
      />
    </Stack>
  );
}

function AccountMenu({ localCharacterName, onToggleTheme, themeMode }: AccountMenuProps) {
  const fabUTokens = useFabUTokens();
  const { data: session, isPending, refetch } = authClient.useSession();
  const convexAuth = useConvexAuth();
  const authSession = session as AuthSession;
  const user = authSession?.user;
  const [open, setOpen] = useState(false);
  const [screen, setScreen] = useState<AccountModalScreen>('profile');
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const canLoadCharacters = Boolean(user) && !convexAuth.isLoading && convexAuth.isAuthenticated;
  const characters = useQuery(
    api.characters.listMine,
    open && screen === 'characters' && canLoadCharacters ? { includeArchived: false } : 'skip',
  );

  const accountLabel = useMemo(() => {
    if (isPending) return 'Checking account';
    if (user?.name) return user.name;
    if (user?.email) return user.email;
    return 'Settings';
  }, [isPending, user?.email, user?.name]);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus(null);
    setSubmitting(true);

    try {
      if (mode === 'signIn') {
        setStatus('Signing in...');
        const result = await authClient.signIn.email({ email, password });
        assertAuthSuccess(result);
        setStatus('Signed in.');
        await refetch();
      } else if (mode === 'signUp') {
        setStatus('Creating account...');
        const result = await authClient.signUp.email({ email, password, name: name || email });
        assertAuthSuccess(result);
        setStatus('Account created.');
        await refetch();
      }
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
    } finally {
      setSubmitting(false);
    }
  }

  async function startOAuth(provider: OAuthProvider) {
    setError(null);
    setStatus(null);
    setSubmitting(true);

    try {
      setStatus(`Opening ${provider} sign in...`);
      const result = await authClient.signIn.social({
        provider,
        callbackURL: window.location.href,
      });
      assertAuthSuccess(result);
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
      setSubmitting(false);
    }
  }

  async function signOut() {
    setError(null);
    setStatus(null);
    setSubmitting(true);

    try {
      setStatus('Signing out...');
      const result = await authClient.signOut();
      assertAuthSuccess(result);
      setStatus('Signed out.');
      await refetch();
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
    } finally {
      setSubmitting(false);
    }
  }

  function closeDialog() {
    setOpen(false);
    setScreen('profile');
  }

  return (
    <>
      <IconButton
        data-pw="account-menu-button"
        onClick={() => {
          setOpen(true);
          setScreen('profile');
        }}
        size="small"
        aria-label="Open settings"
        sx={{
          width: 34,
          height: 34,
          borderRadius: '8px',
          bgcolor: user ? alpha('#ffffff', 0.96) : alpha('#ffffff', 0.16),
          border: `1px solid ${alpha('#ffffff', user ? 0.7 : 0.28)}`,
          color: user ? fabUTokens.color.brandStrong : '#ffffff',
          boxShadow: user ? '0 4px 12px rgba(30, 49, 40, 0.16)' : 'none',
          '&:hover': {
            bgcolor: user ? '#ffffff' : alpha('#ffffff', 0.24),
          },
        }}
      >
        {user?.image ? (
          <Avatar
            src={user.image}
            alt={user.name || user.email || 'Account'}
            sx={{
              width: 26,
              height: 26,
              fontSize: '0.72rem',
              bgcolor: fabUTokens.color.brand,
              color: '#ffffff',
            }}
          />
        ) : user ? (
          <CheckCircle size={17} />
        ) : (
          <Settings size={17} />
        )}
      </IconButton>

      <Dialog
        data-pw="account-dialog"
        open={open}
        onClose={closeDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            width: 'min(360px, calc(100vw - 24px))',
            borderRadius: '12px',
            border: `1px solid ${fabUTokens.color.border}`,
            bgcolor: fabUTokens.color.surface,
            color: fabUTokens.color.textPrimary,
            backgroundImage: 'none',
            boxShadow: fabUTokens.shadow.soft,
          },
        }}
      >
        <DialogTitle sx={{ p: 1.6, pb: 0.8 }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1}>
            <Stack spacing={0.45} sx={{ minWidth: 0 }}>
              <Typography
                sx={{ fontSize: '0.68rem', fontWeight: 800, color: fabUTokens.color.textSecondary }}
              >
                SETTINGS
              </Typography>
              <Typography
                sx={{ fontSize: '1.05rem', fontWeight: 800, color: fabUTokens.color.textPrimary }}
              >
                {screen === 'characters' ? 'Characters' : accountLabel}
              </Typography>
            </Stack>
            {screen === 'characters' ? (
              <IconButton
                aria-label="Back to profile"
                onClick={() => setScreen('profile')}
                size="small"
                sx={{ color: fabUTokens.color.textSecondary }}
              >
                <ChevronLeft size={18} />
              </IconButton>
            ) : (
              <IconButton
                aria-label="Close account dialog"
                onClick={closeDialog}
                size="small"
                sx={{ color: fabUTokens.color.textSecondary }}
              >
                <X size={17} />
              </IconButton>
            )}
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: 1.6, pt: 0.8 }}>
          {screen === 'characters' ? (
            <Stack spacing={1.1}>
              {!user ? (
                <Box
                  sx={{
                    border: `1px solid ${fabUTokens.color.border}`,
                    borderRadius: '9px',
                    bgcolor: fabUTokens.color.surfaceMuted,
                    px: 1.2,
                    py: 0.95,
                  }}
                >
                  <Stack spacing={0.25}>
                    <Typography
                      sx={{
                        color: fabUTokens.color.textSecondary,
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Local Character
                    </Typography>
                    <Typography sx={{ fontSize: '0.86rem', fontWeight: 800 }}>
                      {localCharacterName}
                    </Typography>
                  </Stack>
                </Box>
              ) : characters === undefined ? (
                <Typography sx={{ color: fabUTokens.color.textSecondary, fontSize: '0.82rem' }}>
                  Loading characters...
                </Typography>
              ) : characters.length > 0 ? (
                characters.map((character) => (
                  <Box
                    key={character._id}
                    sx={{
                      border: `1px solid ${fabUTokens.color.border}`,
                      borderRadius: '9px',
                      bgcolor: fabUTokens.color.surfaceMuted,
                      px: 1.2,
                      py: 0.95,
                    }}
                  >
                    <Typography sx={{ fontSize: '0.86rem', fontWeight: 800 }}>
                      {getCharacterDisplayName(character)}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography sx={{ color: fabUTokens.color.textSecondary, fontSize: '0.82rem' }}>
                  No characters saved to this account yet.
                </Typography>
              )}
            </Stack>
          ) : (
            <Stack spacing={1.35}>
              <Box
                sx={{
                  border: `1px solid ${fabUTokens.color.border}`,
                  borderRadius: '9px',
                  bgcolor: fabUTokens.color.surfaceMuted,
                  px: 1.15,
                  py: 0.9,
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                  <Stack spacing={0.15}>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 800 }}>Theme</Typography>
                    <Typography sx={{ color: fabUTokens.color.textSecondary, fontSize: '0.74rem' }}>
                      {themeMode === 'dark' ? 'Dark mode' : 'Light mode'}
                    </Typography>
                  </Stack>
                  <IconButton
                    data-pw="settings-theme-toggle"
                    onClick={onToggleTheme}
                    aria-label={
                      themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
                    }
                    size="small"
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: '8px',
                      border: `1px solid ${fabUTokens.color.border}`,
                      color: fabUTokens.color.textSecondary,
                      bgcolor: fabUTokens.color.pillSurface,
                    }}
                  >
                    {themeMode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                  </IconButton>
                </Stack>
              </Box>

              {user ? (
                <>
                  <Box
                    sx={{
                      border: `1px solid ${fabUTokens.color.border}`,
                      borderRadius: '9px',
                      bgcolor: fabUTokens.color.surfaceMuted,
                      px: 1.25,
                      py: 1.05,
                    }}
                  >
                    <Stack direction="row" alignItems="center" gap={0.9}>
                      <ShieldCheck size={18} color={fabUTokens.color.brandText} />
                      <Stack spacing={0.1} sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontSize: '0.84rem', fontWeight: 800 }}>
                          {user.name || 'Signed in'}
                        </Typography>
                        {user.email ? (
                          <Typography
                            sx={{
                              color: fabUTokens.color.textSecondary,
                              fontSize: '0.76rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {user.email}
                          </Typography>
                        ) : null}
                      </Stack>
                    </Stack>
                  </Box>
                  <Button
                    data-pw="account-characters"
                    onClick={() => setScreen('characters')}
                    startIcon={<UserRound size={16} />}
                    sx={{
                      height: 40,
                      borderRadius: '8px',
                      bgcolor: fabUTokens.color.brand,
                      color: '#ffffff',
                      textTransform: 'none',
                      fontWeight: 800,
                      '&:hover': { bgcolor: fabUTokens.color.brandStrong },
                    }}
                  >
                    Characters
                  </Button>
                  <Button
                    data-pw="account-sign-out"
                    onClick={signOut}
                    disabled={submitting}
                    startIcon={<LogOut size={16} />}
                    sx={{
                      height: 40,
                      borderRadius: '8px',
                      border: `1px solid ${fabUTokens.color.danger}`,
                      color: fabUTokens.color.danger,
                      textTransform: 'none',
                      fontWeight: 800,
                    }}
                  >
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    data-pw="account-characters"
                    onClick={() => setScreen('characters')}
                    startIcon={<UserRound size={16} />}
                    sx={{
                      height: 40,
                      borderRadius: '8px',
                      bgcolor: fabUTokens.color.brand,
                      color: '#ffffff',
                      textTransform: 'none',
                      fontWeight: 800,
                      '&:hover': { bgcolor: fabUTokens.color.brandStrong },
                    }}
                  >
                    Characters
                  </Button>

                  <Stack
                    direction="row"
                    gap={0.5}
                    sx={{
                      p: 0.35,
                      borderRadius: '9px',
                      bgcolor: fabUTokens.color.surfaceMuted,
                      border: `1px solid ${fabUTokens.color.border}`,
                    }}
                  >
                    {authModes.map((authMode) => {
                      const selected = mode === authMode.value;

                      return (
                        <Button
                          key={authMode.value}
                          data-pw={`auth-mode-${authMode.value}`}
                          onClick={() => {
                            setMode(authMode.value);
                            setError(null);
                            setStatus(null);
                          }}
                          sx={{
                            flex: 1,
                            minWidth: 0,
                            minHeight: 32,
                            borderRadius: '7px',
                            bgcolor: selected ? fabUTokens.color.surface : 'transparent',
                            color: selected
                              ? fabUTokens.color.textPrimary
                              : fabUTokens.color.textSecondary,
                            boxShadow: selected ? fabUTokens.shadow.card : 'none',
                            textTransform: 'none',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                          }}
                        >
                          {authMode.label}
                        </Button>
                      );
                    })}
                  </Stack>

                  <Stack component="form" spacing={1.05} onSubmit={submitAuth}>
                    {mode === 'signUp' ? (
                      <AuthField label="Name" value={name} autoComplete="name" onChange={setName} />
                    ) : null}
                    <AuthField
                      label="Email"
                      type="email"
                      value={email}
                      autoComplete="email"
                      onChange={setEmail}
                    />
                    <AuthField
                      label="Password"
                      type="password"
                      value={password}
                      autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
                      onChange={setPassword}
                    />
                    <Button
                      data-pw="auth-submit"
                      type="submit"
                      disabled={submitting || !email || !password}
                      startIcon={<KeyRound size={16} />}
                      sx={{
                        height: 40,
                        borderRadius: '8px',
                        bgcolor: fabUTokens.color.brand,
                        color: '#ffffff',
                        textTransform: 'none',
                        fontWeight: 800,
                        '&:hover': { bgcolor: fabUTokens.color.brandStrong },
                        '&.Mui-disabled': {
                          bgcolor: alpha(fabUTokens.color.brand, 0.45),
                          color: alpha('#ffffff', 0.7),
                        },
                      }}
                    >
                      {mode === 'signIn' ? 'Sign in' : 'Create account'}
                    </Button>
                  </Stack>

                  <Stack direction="row" gap={0.7}>
                    {oauthProviders.map(({ provider, label, icon }) => (
                      <Button
                        key={provider}
                        data-pw={`oauth-${provider}`}
                        onClick={() => startOAuth(provider)}
                        disabled={submitting}
                        startIcon={icon}
                        sx={{
                          flex: 1,
                          minWidth: 0,
                          height: 44,
                          borderRadius: '8px',
                          border: `1px solid ${fabUTokens.color.border}`,
                          color: fabUTokens.color.textPrimary,
                          textTransform: 'none',
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          '& .MuiButton-startIcon': {
                            mr: 0.7,
                          },
                        }}
                      >
                        {label}
                      </Button>
                    ))}
                  </Stack>
                </>
              )}

              {status ? (
                <Alert severity="success" sx={{ borderRadius: '8px', py: 0.4 }}>
                  {status}
                </Alert>
              ) : null}
              {error ? (
                <Alert severity="error" sx={{ borderRadius: '8px', py: 0.4 }}>
                  {error}
                </Alert>
              ) : null}
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AccountMenu;
