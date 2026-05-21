import { FormEvent, useMemo, useState } from 'react';

import Alert from '@mui/material/Alert';
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

import { CheckCircle, KeyRound, LogOut, Moon, Settings, ShieldCheck, Sun, X } from 'lucide-react';

import { authClient } from '@/lib/auth-client';

import { useFabUTokens } from '../ThemeContext';

type AuthMode = 'signIn' | 'signUp';
type OAuthProvider = 'google' | 'discord';

type AuthSession = {
  user?: {
    email?: string | null;
    name?: string | null;
  } | null;
} | null;

type AccountMenuProps = {
  onToggleTheme: () => void;
  themeMode: 'dark' | 'light';
};

type AuthResult = {
  error?: { message?: string } | null;
};

const authModes: Array<{ label: string; value: AuthMode }> = [
  { label: 'Sign in', value: 'signIn' },
  { label: 'Create', value: 'signUp' },
];

const oauthProviders: Array<{ label: string; provider: OAuthProvider }> = [
  { label: 'Google', provider: 'google' },
  { label: 'Discord', provider: 'discord' },
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

function AccountMenu({ onToggleTheme, themeMode }: AccountMenuProps) {
  const fabUTokens = useFabUTokens();
  const { data: session, isPending, refetch } = authClient.useSession();
  const authSession = session as AuthSession;
  const user = authSession?.user;
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const accountLabel = useMemo(() => {
    if (isPending) return 'Checking account';
    if (user?.name) return user.name;
    if (user?.email) return user.email;
    return 'Local character';
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

  return (
    <>
      <IconButton
        data-pw="account-menu-button"
        onClick={() => setOpen(true)}
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
        {user ? <CheckCircle size={17} /> : <Settings size={17} />}
      </IconButton>

      <Dialog
        data-pw="account-dialog"
        open={open}
        onClose={() => setOpen(false)}
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
                {accountLabel}
              </Typography>
            </Stack>
            <IconButton
              aria-label="Close account dialog"
              onClick={() => setOpen(false)}
              size="small"
              sx={{ color: fabUTokens.color.textSecondary }}
            >
              <X size={17} />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: 1.6, pt: 0.8 }}>
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
                  aria-label={themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
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
                  {oauthProviders.map(({ provider, label }) => (
                    <Button
                      key={provider}
                      data-pw={`oauth-${provider}`}
                      onClick={() => startOAuth(provider)}
                      disabled={submitting}
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        height: 36,
                        borderRadius: '8px',
                        border: `1px solid ${fabUTokens.color.border}`,
                        color: fabUTokens.color.textPrimary,
                        textTransform: 'none',
                        fontSize: '0.74rem',
                        fontWeight: 800,
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
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AccountMenu;
