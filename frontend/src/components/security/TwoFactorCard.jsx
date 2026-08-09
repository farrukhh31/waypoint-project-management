import { useState } from 'react';
import { ShieldCheck, ShieldOff, Copy, Check, KeyRound, Download, AlertTriangle } from 'lucide-react';
import api from '../../lib/api';
import Card, { CardBody } from '../ui/Card.jsx';
import Input, { Field } from '../ui/Input.jsx';
import PasswordInput from '../ui/PasswordInput.jsx';
import Button from '../ui/Button.jsx';
import InlineMessage from '../ui/InlineMessage.jsx';

// Formats a base32 secret into 4-character groups for easier manual typing
// into an authenticator app — "ABCD1234..." -> "ABCD 1234 ...".
function formatSecret(secret) {
  return secret.match(/.{1,4}/g)?.join(' ') || secret;
}

export default function TwoFactorCard({ user, onChange }) {
  // 'idle' | 'settingUp' | 'backupCodes' | 'disabling'
  const [stage, setStage] = useState('idle');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [secret, setSecret] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [secretCopied, setSecretCopied] = useState(false);

  const [disableForm, setDisableForm] = useState({ password: '', code: '' });

  function resetToIdle() {
    setStage('idle');
    setSecret('');
    setConfirmCode('');
    setBackupCodes([]);
    setDisableForm({ password: '', code: '' });
    setMessage(null);
  }

  async function handleStartSetup() {
    setLoading(true);
    setMessage(null);
    try {
      const { data } = await api.post('/users/me/2fa/setup');
      setSecret(data.data.secret);
      setStage('settingUp');
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Could not start setup.' });
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmSetup(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const { data } = await api.post('/users/me/2fa/enable', { code: confirmCode.trim() });
      setBackupCodes(data.data.backupCodes);
      setStage('backupCodes');
      await onChange?.();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'That code was incorrect.' });
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await api.post('/users/me/2fa/disable', disableForm);
      await onChange?.();
      resetToIdle();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Could not turn off two-factor authentication.' });
    } finally {
      setLoading(false);
    }
  }

  function copySecret() {
    navigator.clipboard?.writeText(secret).then(() => {
      setSecretCopied(true);
      setTimeout(() => setSecretCopied(false), 1600);
    });
  }

  function downloadBackupCodes() {
    const blob = new Blob([`Waypoint two-factor backup codes\n\n${backupCodes.join('\n')}\n`], {
      type: 'text/plain',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'waypoint-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card className="card-sheen animate-[fade-in-up_0.2s_ease-out]">
      <CardBody>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-ink">Two-factor authentication</h3>
              <p className="text-xs text-ink-muted">Require a code from your phone in addition to your password.</p>
            </div>
          </div>
          <span
            className={
              'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ' +
              (user.twoFactorEnabled ? 'bg-success-50 text-success-600' : 'bg-ink-muted/10 text-ink-muted')
            }
          >
            {user.twoFactorEnabled ? 'Enabled' : 'Not enabled'}
          </span>
        </div>

        {/* Idle: nothing set up yet */}
        {stage === 'idle' && !user.twoFactorEnabled && (
          <Button variant="secondary" size="sm" onClick={handleStartSetup} loading={loading}>
            Set up two-factor authentication
          </Button>
        )}

        {/* Idle: already on — offer to turn it off */}
        {stage === 'idle' && user.twoFactorEnabled && (
          <Button variant="secondary" size="sm" onClick={() => setStage('disabling')}>
            <ShieldOff className="h-4 w-4" /> Turn off
          </Button>
        )}

        {/* Setup: show manual-entry key, ask for a confirming code */}
        {stage === 'settingUp' && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="mb-1.5 text-sm text-ink">
                In your authenticator app (Google Authenticator, Authy, 1Password…), add a new account and enter
                this setup key manually:
              </p>
              <div className="flex items-center justify-between gap-2 rounded-lg border border-line bg-paper px-3.5 py-2.5">
                <code className="truncate font-mono text-sm tracking-wide text-ink">{formatSecret(secret)}</code>
                <button
                  type="button"
                  onClick={copySecret}
                  className="shrink-0 rounded p-1 text-ink-muted hover:bg-surface hover:text-route-600"
                  aria-label="Copy setup key"
                >
                  {secretCopied ? <Check className="h-4 w-4 text-success-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <form onSubmit={handleConfirmSetup} className="flex flex-col gap-3">
              <Field label="Enter the 6-digit code it shows" htmlFor="confirmCode">
                <Input
                  id="confirmCode"
                  autoFocus
                  inputMode="numeric"
                  placeholder="123456"
                  maxLength={6}
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, ''))}
                />
              </Field>
              <InlineMessage message={message} />
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={resetToIdle} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" loading={loading} disabled={confirmCode.length !== 6}>
                  Confirm and turn on
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Just enabled: show one-time backup codes */}
        {stage === 'backupCodes' && (
          <div className="flex flex-col gap-3">
            <p className="flex items-start gap-2 rounded-lg bg-success-50 px-3 py-2.5 text-sm text-success-700">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              Two-factor authentication is on. Save these backup codes somewhere safe — each works once if you lose
              access to your authenticator app, and they won't be shown again.
            </p>
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-line bg-paper p-3.5 font-mono text-sm text-ink">
              {backupCodes.map((code) => (
                <span key={code}>{code}</span>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={downloadBackupCodes}>
                <Download className="h-4 w-4" /> Download codes
              </Button>
              <Button size="sm" onClick={resetToIdle}>
                Done
              </Button>
            </div>
          </div>
        )}

        {/* Disabling: require password + a live/backup code */}
        {stage === 'disabling' && (
          <form onSubmit={handleDisable} className="flex flex-col gap-3">
            <p className="flex items-start gap-2 rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Turning this off makes your account easier to break into if your password ever leaks.
            </p>
            <Field label="Current password" htmlFor="disablePassword">
              <PasswordInput
                id="disablePassword"
                autoComplete="current-password"
                required
                value={disableForm.password}
                onChange={(e) => setDisableForm({ ...disableForm, password: e.target.value })}
              />
            </Field>
            <Field label="Authentication code" htmlFor="disableCode">
              <Input
                id="disableCode"
                icon={KeyRound}
                placeholder="123456 or a backup code"
                required
                value={disableForm.code}
                onChange={(e) => setDisableForm({ ...disableForm, code: e.target.value })}
              />
            </Field>
            <InlineMessage message={message} />
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={resetToIdle} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" size="sm" loading={loading}>
                Turn off two-factor authentication
              </Button>
            </div>
          </form>
        )}
      </CardBody>
    </Card>
  );
}
