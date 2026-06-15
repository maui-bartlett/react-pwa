import { FormEvent, ReactNode, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { useConvexAuth, useMutation, useQuery } from 'convex/react';

import { authClient } from '@/lib/auth-client';

import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';

const GAME_SYSTEM_PATHS: Record<string, string> = {
  'avatar-legends': '/avatar-legends',
  'fabula-ultima': '/fab-u',
};

const GAME_SYSTEM_LABELS: Record<string, string> = {
  'avatar-legends': 'Avatar Legends',
  'fabula-ultima': 'Fabula Ultima',
};

/** Best-effort display name across both apps' characterState shapes. */
function characterDisplayName(character: { characterState?: unknown }): string {
  const state =
    character.characterState && typeof character.characterState === 'object'
      ? (character.characterState as { character?: unknown })
      : null;
  const inner =
    state?.character && typeof state.character === 'object'
      ? (state.character as Record<string, unknown>)
      : null;
  if (!inner) return 'Unnamed character';
  if (typeof inner.name === 'string' && inner.name.trim()) return inner.name.trim();
  const name = (inner.name ?? {}) as Record<string, unknown>;
  const parts = [name.firstName, name.lastName, inner.firstName, inner.lastName]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .map((part) => part.trim());
  return parts.length ? Array.from(new Set(parts)).join(' ') : 'Unnamed character';
}

function getAuthErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return 'Something went wrong. Please try again.';
}

/** Compact sign-in / sign-up used when an unauthenticated user opens an
 *  invite link. After auth the surrounding page swaps to the join controls. */
function InlineSignIn() {
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === 'signIn') {
        await authClient.signIn.email({ email, password });
      } else {
        await authClient.signUp.email({ email, password, name: name || email });
      }
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
    } finally {
      setBusy(false);
    }
  }

  async function social(provider: 'google' | 'discord') {
    setBusy(true);
    setError(null);
    try {
      await authClient.signIn.social({ provider, callbackURL: window.location.href });
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
      setBusy(false);
    }
  }

  return (
    <Stack spacing={1.5}>
      <Typography variant="body2" color="text.secondary">
        Sign in to join this campaign.
      </Typography>
      <Stack direction="row" spacing={1}>
        <Button fullWidth variant="outlined" disabled={busy} onClick={() => void social('google')}>
          Google
        </Button>
        <Button fullWidth variant="outlined" disabled={busy} onClick={() => void social('discord')}>
          Discord
        </Button>
      </Stack>
      <Divider sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>or</Divider>
      <Box component="form" onSubmit={submit}>
        <Stack spacing={1.2}>
          {mode === 'signUp' ? (
            <TextField
              label="Name"
              size="small"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          ) : null}
          <TextField
            label="Email"
            type="email"
            size="small"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <TextField
            label="Password"
            type="password"
            size="small"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
            required
          />
          {error ? <Alert severity="error">{error}</Alert> : null}
          <Button type="submit" variant="contained" disabled={busy}>
            {mode === 'signIn' ? 'Sign in' : 'Create account'}
          </Button>
        </Stack>
      </Box>
      <Button
        size="small"
        onClick={() => {
          setError(null);
          setMode((m) => (m === 'signIn' ? 'signUp' : 'signIn'));
        }}
        sx={{ textTransform: 'none' }}
      >
        {mode === 'signIn' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
      </Button>
    </Stack>
  );
}

function Join() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const convexAuth = useConvexAuth();

  const resolved = useQuery(api.campaigns.resolveInviteCode, code ? { code } : 'skip');
  const joinViaInviteCode = useMutation(api.campaigns.joinViaInviteCode);

  const gameSystem = resolved?.status === 'ok' ? resolved.gameSystem : '';
  const characters = useQuery(
    api.characters.listMine,
    convexAuth.isAuthenticated && gameSystem ? { gameSystem, includeArchived: false } : 'skip',
  ) as Array<{ _id: Id<'characters'>; characterState?: unknown }> | undefined;

  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('');
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const systemLabel = useMemo(
    () => (gameSystem ? (GAME_SYSTEM_LABELS[gameSystem] ?? gameSystem) : ''),
    [gameSystem],
  );

  async function handleJoin() {
    if (!code) return;
    setJoining(true);
    setError(null);
    try {
      const result = await joinViaInviteCode({
        code,
        characterId: selectedCharacterId ? (selectedCharacterId as Id<'characters'>) : undefined,
      });
      setJoined(true);
      const path = GAME_SYSTEM_PATHS[result.gameSystem] ?? '/home';
      window.setTimeout(() => navigate(path), 1000);
    } catch (joinError) {
      setError(getAuthErrorMessage(joinError));
    } finally {
      setJoining(false);
    }
  }

  let body: ReactNode;

  if (!code) {
    body = <Alert severity="error">This invite link is missing its code.</Alert>;
  } else if (resolved === undefined) {
    body = (
      <Stack alignItems="center" sx={{ py: 3 }}>
        <CircularProgress size={28} />
      </Stack>
    );
  } else if (resolved.status === 'expired') {
    body = (
      <Alert severity="warning">
        This invite link has expired. Ask the campaign’s GM for a fresh link.
      </Alert>
    );
  } else if (resolved.status !== 'ok') {
    body = <Alert severity="error">This invite link is invalid or no longer active.</Alert>;
  } else if (joined) {
    body = (
      <Alert severity="success">
        You’ve joined {resolved.name}! Taking you to {systemLabel}…
      </Alert>
    );
  } else if (convexAuth.isLoading) {
    body = (
      <Stack alignItems="center" sx={{ py: 3 }}>
        <CircularProgress size={28} />
      </Stack>
    );
  } else if (!convexAuth.isAuthenticated) {
    body = <InlineSignIn />;
  } else {
    body = (
      <Stack spacing={1.5}>
        <Typography variant="body2" color="text.secondary">
          Choose a {systemLabel} character to bring into the campaign.
        </Typography>
        {characters === undefined ? (
          <Stack alignItems="center" sx={{ py: 2 }}>
            <CircularProgress size={24} />
          </Stack>
        ) : (
          <Stack spacing={0.75}>
            {characters.map((character) => {
              const selected = selectedCharacterId === character._id;
              return (
                <Button
                  key={character._id}
                  variant={selected ? 'contained' : 'outlined'}
                  onClick={() => setSelectedCharacterId(selected ? '' : character._id)}
                  sx={{ justifyContent: 'flex-start', textTransform: 'none', fontWeight: 700 }}
                >
                  {characterDisplayName(character)}
                </Button>
              );
            })}
            <Button
              variant={selectedCharacterId === '' ? 'contained' : 'outlined'}
              onClick={() => setSelectedCharacterId('')}
              sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
            >
              Join without a character
            </Button>
            {characters.length === 0 ? (
              <Typography variant="caption" color="text.secondary">
                You don’t have any {systemLabel} characters yet — you can join now and add one
                later.
              </Typography>
            ) : null}
          </Stack>
        )}
        {error ? <Alert severity="error">{error}</Alert> : null}
        <Button variant="contained" disabled={joining} onClick={() => void handleJoin()}>
          {joining ? 'Joining…' : `Join ${resolved.name}`}
        </Button>
      </Stack>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Paper elevation={3} sx={{ width: '100%', maxWidth: 420, borderRadius: 3, p: 3 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="overline" color="text.secondary">
              Campaign invite
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              {resolved?.status === 'ok' ? resolved.name : 'Join a campaign'}
            </Typography>
            {resolved?.status === 'ok' && systemLabel ? (
              <Typography variant="body2" color="text.secondary">
                {systemLabel}
              </Typography>
            ) : null}
          </Box>
          {body}
        </Stack>
      </Paper>
    </Box>
  );
}

export default Join;
