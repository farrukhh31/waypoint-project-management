import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { User as UserIcon, AlertCircle, ArrowRight, MailCheck, XCircle } from 'lucide-react';
import api, { setAccessToken } from '../../lib/api';
import { ROLE_HOME, ROLE_LABELS } from '../../config/roles';
import { connectSocket } from '../../lib/socket';
import { Field } from '../../components/ui/Input.jsx';
import Input from '../../components/ui/Input.jsx';
import PasswordInput from '../../components/ui/PasswordInput.jsx';
import Button from '../../components/ui/Button.jsx';
import RouteLoader from '../../components/ui/RouteLoader.jsx';

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [status, setStatus] = useState('checking'); // checking | valid | invalid
  const [invite, setInvite] = useState(null);
  const [checkError, setCheckError] = useState('');

  const [form, setForm] = useState({ name: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(0);
  const [touchedConfirm, setTouchedConfirm] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      setCheckError('This invite link is missing its token.');
      return;
    }
    let cancelled = false;
    api
      .get(`/invites/verify/${token}`)
      .then(({ data }) => {
        if (cancelled) return;
        setInvite(data.data);
        setStatus('valid');
      })
      .catch((err) => {
        if (cancelled) return;
        setCheckError(err.response?.data?.message || 'This invite link is invalid or has expired.');
        setStatus('invalid');
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  function set(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  const confirmMatches = form.confirmPassword.length > 0 && form.confirmPassword === form.password;
  const confirmMismatch = form.confirmPassword.length > 0 && form.confirmPassword !== form.password;

  const passwordValid =
    form.password.length >= 8 &&
    /[a-z]/.test(form.password) &&
    /[A-Z]/.test(form.password) &&
    /[0-9]/.test(form.password);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      setShake((s) => s + 1);
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/invites/accept', {
        token,
        name: form.name,
        password: form.password,
      });
      setAccessToken(data.data.accessToken);
      connectSocket();
      navigate(ROLE_HOME[data.data.user.role], { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not accept this invite.');
      setShake((s) => s + 1);
    } finally {
      setLoading(false);
    }
  }

  if (status === 'checking') {
    return (
      <div className="flex flex-col items-center py-8">
        <RouteLoader size="md" label="Checking your invite…" />
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div>
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-danger-50 text-danger-600">
          <XCircle className="h-5 w-5" />
        </div>
        <h1 className="mt-4 text-center font-display text-2xl font-semibold text-ink">Invite not valid</h1>
        <p className="mt-2 text-center text-sm leading-relaxed text-ink-muted">{checkError}</p>
        <p className="mt-4 text-center text-sm text-ink-muted">
          Ask an administrator to send you a fresh invite, or{' '}
          <Link to="/login" className="font-medium text-route-600 hover:underline">
            sign in
          </Link>{' '}
          if you already have an account.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-accent-50 text-accent-600 ring-1 ring-accent-200">
        <MailCheck className="h-5 w-5" />
      </div>
      <h1 className="mt-4 text-center font-display text-2xl font-semibold text-ink">You're invited</h1>
      <p className="mt-2 text-center text-sm leading-relaxed text-ink-muted">
        {invite.invitedByName} invited <span className="font-medium text-ink-soft">{invite.email}</span> to
        join Waypoint as <span className="font-medium text-ink-soft">{ROLE_LABELS[invite.role]}</span>. Set a
        password to activate your account.
      </p>

      <form key={shake} className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit}>
        <Field label="Full name" htmlFor="name">
          <Input id="name" icon={UserIcon} required placeholder="Jane Doe" value={form.name} onChange={set('name')} />
        </Field>

        <Field label="Password" htmlFor="password">
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="Create a password"
            required
            minLength={8}
            showStrength
            value={form.password}
            onChange={set('password')}
          />
        </Field>

        <Field label="Confirm password" htmlFor="confirmPassword">
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            required
            error={confirmMismatch}
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
            onBlur={() => setTouchedConfirm(true)}
          />
          {touchedConfirm && form.confirmPassword.length > 0 && (
            <p className={`text-xs ${confirmMatches ? 'text-success-600' : 'text-danger-600'}`}>
              {confirmMatches ? 'Passwords match' : 'Passwords do not match'}
            </p>
          )}
        </Field>

        {error && (
          <p className="flex items-start gap-2 rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600 animate-shake">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="mt-1 w-full group"
          loading={loading}
          disabled={form.password.length > 0 && !passwordValid}
        >
          {!loading && (
            <>
              Activate account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
          {loading && 'Activating…'}
        </Button>
      </form>
    </div>
  );
}
