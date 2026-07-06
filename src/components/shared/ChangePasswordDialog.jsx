import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { base44, getErrorMessage } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, Lock } from 'lucide-react';

// Secure change-password dialog for the signed-in admin. The backend re-verifies
// the current password server-side; this adds client-side validation + clear errors.
export default function ChangePasswordDialog({ open, onOpenChange }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setCurrent('');
    setNext('');
    setConfirm('');
  };

  const close = (v) => {
    if (loading) return;
    if (!v) reset();
    onOpenChange(v);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!current) {
      toast.error('Current password required', { description: 'Enter your current password.' });
      return;
    }
    if (next.length < 6) {
      toast.error('Weak password', { description: 'New password must be at least 6 characters.' });
      return;
    }
    if (next !== confirm) {
      toast.error('Passwords do not match', { description: 'New password and confirmation differ.' });
      return;
    }
    if (next === current) {
      toast.error('Choose a different password', { description: 'New password must differ from the current one.' });
      return;
    }

    setLoading(true);
    try {
      await base44.auth.changePassword(current, next);
      toast.success('Password changed', { description: 'Use your new password next time you sign in.' });
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error('Could not change password', { description: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-violet-600" /> Change password
          </DialogTitle>
          <DialogDescription>Enter your current password and choose a new one.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cur-pw">Current password</Label>
            <Input id="cur-pw" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-pw">New password</Label>
            <Input id="new-pw" type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" placeholder="At least 6 characters" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="conf-pw">Confirm new password</Label>
            <Input id="conf-pw" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => close(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" className="bg-violet-600 hover:bg-violet-700" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Change password'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
