import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, AlertCircle, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_HOME, ROLES } from '../../config/roles';
import { Field } from '../../components/ui/Input.jsx';
import Input from '../../components/ui/Input.jsx';
import PasswordInput from '../../components/ui/PasswordInput.jsx';
import Button from '../../components/ui/Button.jsx';
import RoleSelector from '../../components/auth/RoleSelector.jsx';

export default function Login() {
  const { login, verifyTwoFactor } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [stage, setStage] = useState('credentials'); // 'credentials' | 'twoFactor'
  const [form, setForm] = useState({ email: '', password: '', role: ROLES.TEAM_MEMBER });
  const [mfaToken, setMfaToken] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(0);

  function goHome(user) {
    const redirectTo = location.state?.from?.pathname || ROLE_HOME[user.role];
    navigate(redirectTo, { replace: true });
  }

  async function handleCredentialsSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(form.email, form.password, form.role);
      if (result.requiresTwoFactor) {
        setMfaToken(result.mfaToken);
        setStage('twoFactor');
      } else {
        goHome(result.user);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not sign in. Check your details and try again.');
      setShake((s) => s + 1);
    } finally {
      setLoading(false);
    }
  }

  async function handleTwoFactorSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await verifyTwoFactor(mfaToken, code.trim());
      goHome(user);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired code.');
      setShake((s) => s + 1);
    } finally {
      setLoading(false);
    }
  }

  if (stage === 'twoFactor') {
    return (
      <div>
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-route-500">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-400" aria-hidden="true" />
          Two-factor authentication
        </p>
        <h1 className="mt-1.5 font-display text-2xl font-semibold text-ink">Enter your code</h1>
        <p className="mt-1.5 text-sm text-ink-muted">
          Open your authenticator app and enter the 6-digit code, or use a backup code.
        </p>

        <form key={shake} className="mt-8 flex flex-col gap-5" onSubmit={handleTwoFactorSubmit}>
          <Field label="Authentication code" htmlFor="code">
            <Input
              id="code"
              icon={ShieldCheck}
              autoFocus
              autoComplete="one-time-code"
              inputMode="text"
              placeholder="123456 or XXXXX-XXXXX"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </Field>

          {error && (
            <p className="flex items-start gap-2 rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600 animate-shake">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="mt-1 w-full" loading={loading}>
            {loading ? 'Verifying…' : 'Verify and sign in'}
          </Button>

          <button
            type="button"
            onClick={() => {
              setStage('credentials');
              setCode('');
              setError('');
            }}
            className="flex items-center justify-center gap-1.5 text-sm font-medium text-ink-muted hover:text-route-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-route-500">
        <span className="h-1.5 w-1.5 rounded-full bg-accent-400" aria-hidden="true" />
        Welcome back
      </p>
      <h1 className="mt-1.5 font-display text-2xl font-semibold text-ink">Sign in</h1>
      <p className="mt-1.5 text-sm text-ink-muted">Pick up right where the team left off.</p>

      {location.state?.flash && (
        <p className="mt-4 flex items-start gap-2 rounded-lg bg-success-50 px-3 py-2.5 text-sm text-success-700">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          {location.state.flash}
        </p>
      )}

      <form key={shake} className="mt-8 flex flex-col gap-5" onSubmit={handleCredentialsSubmit}>
        <Field label="Sign in as">
          <RoleSelector value={form.role} onChange={(role) => setForm({ ...form, role })} />
        </Field>

        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            icon={Mail}
            autoComplete="email"
            placeholder="you@company.com"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>

        <Field label="Password" htmlFor="password">
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </Field>

        <div className="-mt-1 flex justify-end">
          <button
            type="button"
            title="Coming soon"
            className="text-xs font-medium text-route-600 hover:underline"
          >
            Forgot password?
          </button>
        </div>

        {error && (
          <p className="flex items-start gap-2 rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600 animate-shake">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="mt-1 w-full group" loading={loading}>
          {!loading && (
            <>
              Sign in
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
          {loading && 'Signing in…'}
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-ink-muted">
        New here?{' '}
        <Link to="/register" className="font-medium text-route-600 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}