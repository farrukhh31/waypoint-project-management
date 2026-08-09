import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User as UserIcon, Mail, AlertCircle, ArrowRight, ShieldCheck, MailQuestion } from 'lucide-react';
import api, { setAccessToken } from '../../lib/api';
import { ROLE_HOME } from '../../config/roles';
import { connectSocket } from '../../lib/socket';
import { Field } from '../../components/ui/Input.jsx';
import Input from '../../components/ui/Input.jsx';
import PasswordInput from '../../components/ui/PasswordInput.jsx';
import Button from '../../components/ui/Button.jsx';
import RouteLoader from '../../components/ui/RouteLoader.jsx';

// Real project-management platforms don't let strangers self-register into
// an existing workspace — someone has to be first (they become Admin), and
// everyone after that is invited by an Admin. This page therefore has two
// very different states depending on whether a workspace already exists:
//   - bootstrapNeeded === true  -> "create your workspace" form (becomes Admin)
//   - bootstrapNeeded === false -> registration is closed, point at invites
export default function Register() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [bootstrapNeeded, setBootstrapNeeded] = useState(false);

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(0);
  const [touchedConfirm, setTouchedConfirm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/auth/bootstrap-status')
      .then(({ data }) => {
        if (!cancelled) setBootstrapNeeded(Boolean(data.data.bootstrapNeeded));
      })
      .catch(() => {
        if (!cancelled) setBootstrapNeeded(false); // fail closed — assume registration is closed
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
      const { data } = await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      setAccessToken(data.data.accessToken);
      connectSocket();
      navigate(ROLE_HOME[data.data.user.role], { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create the workspace.');
      setShake((s) => s + 1);
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="flex flex-col items-center py-8">
        <RouteLoader size="md" label="Checking workspace status…" />
      </div>
    );
  }

  if (!bootstrapNeeded) {
    return (
      <div>
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-accent-50 text-accent-600 ring-1 ring-accent-200">
          <MailQuestion className="h-5 w-5" />
        </div>
        <h1 className="mt-4 text-center font-display text-2xl font-semibold text-ink">Invite only</h1>
        <p className="mt-2 text-center text-sm leading-relaxed text-ink-muted">
          This workspace already exists. New accounts are created by an administrator sending
          you an invite link by email — open-ended public sign-up is closed.
        </p>
        <p className="mt-4 rounded-lg border border-line bg-surface px-4 py-3 text-center text-sm text-ink-soft">
          Got an invite link? Open it directly — it'll take you straight to setting your password.
        </p>
        <Button type="button" className="mt-6 w-full" size="lg" onClick={() => navigate('/login')}>
          Back to sign in
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-accent-50 text-accent-600 ring-1 ring-accent-200">
        <ShieldCheck className="h-5 w-5" />
      </div>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs font-semibold uppercase tracking-[0.14em] text-route-500">
        <span className="h-1.5 w-1.5 rounded-full bg-accent-400" aria-hidden="true" />
        Get started
      </p>
      <h1 className="mt-1 text-center font-display text-2xl font-semibold text-ink">Create your workspace</h1>
      <p className="mt-2 text-center text-sm text-ink-muted">
        You're setting this Waypoint instance up for the first time — this account becomes the
        Administrator. Everyone else joins by invite.
      </p>

      <form key={shake} className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit}>
        <Field label="Full name" htmlFor="name">
          <Input id="name" icon={UserIcon} placeholder="Jane Doe" required value={form.name} onChange={set('name')} />
        </Field>

        <Field label="Work email" htmlFor="email">
          <Input
            id="email"
            type="email"
            icon={Mail}
            autoComplete="email"
            placeholder="you@company.com"
            required
            value={form.email}
            onChange={set('email')}
          />
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
              Create workspace
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
          {loading && 'Setting things up…'}
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-ink-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-route-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
