import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, AlertTriangle } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import Card, { CardBody } from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import InlineMessage from '../ui/InlineMessage.jsx';

// Lets someone still signed in generate + email themselves a brand-new
// password when they've forgotten the current one. Since the whole point is
// "I don't know my password", the backend also revokes every session
// (including this one), so this always ends in a sign-out + redirect.
export default function EmailResetCard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleConfirm() {
    setLoading(true);
    setMessage(null);
    try {
      await api.post('/users/me/password/email-reset');
      await logout();
      navigate('/login', {
        state: { flash: `We emailed a new password to ${user.email}. Sign in with it below.` },
      });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Could not send a new password.' });
      setConfirming(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="card-sheen animate-[fade-in-up_0.2s_ease-out]">
      <CardBody>
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
            <KeyRound className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold text-ink">Lost your password?</h3>
            <p className="text-xs text-ink-muted">We'll email a new one to {user.email} and sign you out everywhere.</p>
          </div>
        </div>

        {!confirming ? (
          <Button variant="secondary" size="sm" onClick={() => setConfirming(true)}>
            Email me a new password
          </Button>
        ) : (
          <div className="flex flex-col gap-3 rounded-lg border border-accent-200 bg-accent-50/50 p-3.5">
            <p className="flex items-start gap-2 text-sm text-ink">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
              This replaces your current password right away and signs every device out, including this one. Continue?
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={loading}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleConfirm} loading={loading}>
                Yes, email a new password
              </Button>
            </div>
          </div>
        )}

        <div className="mt-3">
          <InlineMessage message={message} />
        </div>
      </CardBody>
    </Card>
  );
}
