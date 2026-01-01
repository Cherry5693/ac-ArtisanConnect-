import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useMutation } from '@tanstack/react-query';
import { forgotPassword, verifyPasswordResetOtp, resetPassword } from '../services/authService';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ForgotPasswordDialog = ({ children, open, onOpenChange }) => {
  const [step, setStep] = useState('enter-email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const forgotPasswordMutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: () => {
      console.log('ForgotPasswordDialog: forgotPasswordMutation success');
      toast({ title: 'OTP Sent', description: 'An OTP has been sent to your email address.' });
      setStep('enter-otp');
    },
    onError: (error) => {
      console.error('ForgotPasswordDialog: forgotPasswordMutation error', error);
      const errorMessage = error.response?.status === 404 
        ? 'User does not exist' 
        : error.response?.data?.msg || 'An error occurred';
      toast({ variant: 'destructive', title: 'Error', description: errorMessage });
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: verifyPasswordResetOtp,
    onSuccess: () => {
      toast({ title: 'OTP Verified', description: 'You can now reset your password.' });
      setStep('enter-password');
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.response?.data?.msg || 'An error occurred' });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      toast({ title: 'Success', description: 'Your password has been reset successfully.' });
      setStep('enter-email'); // Reset to initial step
      onOpenChange(false); // Close the dialog
      navigate('/login'); // Redirect to login page
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.response?.data?.msg || 'An error occurred' });
    },
  });

  const handleForgotPassword = (e) => {
    e.preventDefault();
    forgotPasswordMutation.mutate({ email });
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    verifyOtpMutation.mutate({ email, otp });
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Error', description: 'Passwords do not match' });
      return;
    }
    resetPasswordMutation.mutate({ email, otp, password });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Trigger: always render a trigger so the render tree is stable */}
      <DialogTrigger asChild>
        {children ? children : (
          <Button variant="link" type="button" className="text-sm font-medium text-red-600 hover:underline">
            Forgot Password?
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-gradient-to-br from-indigo-50 via-white to-green-50 rounded-xl shadow-2xl border p-8 max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-indigo-700">Forgot Password</DialogTitle>
          <DialogDescription className="text-gray-700 mt-1">
            {step === 'enter-email' && 'Enter your email to receive a password reset OTP.'}
            {step === 'enter-otp' && 'Enter the OTP sent to your email.'}
            {step === 'enter-password' && 'Enter your new password.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={step === 'enter-email' ? handleForgotPassword : step === 'enter-otp' ? handleVerifyOtp : handleResetPassword} className="space-y-6">
          {step === 'enter-email' && (
            <div>
              <Label htmlFor="email" className="font-semibold text-lg text-indigo-700">Email</Label>
              <Input id="email" name="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 px-3 py-2 bg-white rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-400 transition w-full" required />
              <Button type="submit" className="bg-indigo-700 text-white px-5 py-2 rounded-lg shadow hover:bg-indigo-800 mt-3 flex items-center gap-2">
                {forgotPasswordMutation.isPending && <Loader2 className="animate-spin w-5 h-5" />} Send OTP
              </Button>
            </div>
          )}
          {step === 'enter-otp' && (
            <div>
              <Label htmlFor="otp" className="font-semibold text-lg text-green-700">OTP</Label>
              <Input id="otp" name="otp" value={otp} onChange={e => setOtp(e.target.value)} className="mt-1 px-3 py-2 bg-white rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-400 transition w-full" required />
              <Button type="submit" className="bg-green-600 text-white px-5 py-2 rounded-lg shadow hover:bg-green-700 mt-3 flex items-center gap-2">
                {verifyOtpMutation.isPending && <Loader2 className="animate-spin w-5 h-5" />} Verify OTP
              </Button>
            </div>
          )}
          {step === 'enter-password' && (
            <div>
              <Label htmlFor="password" className="font-semibold text-lg text-indigo-700">New Password</Label>
              <Input id="password" name="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 px-3 py-2 bg-white rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-400 transition w-full" required />
              <Label htmlFor="confirmPassword" className="font-semibold text-lg text-indigo-700 mt-3">Confirm New Password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1 px-3 py-2 bg-white rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-400 transition w-full" required />
              <Button type="submit" className="bg-indigo-700 text-white px-5 py-2 rounded-lg shadow hover:bg-indigo-800 mt-3 flex items-center gap-2">
                {resetPasswordMutation.isPending && <Loader2 className="animate-spin w-5 h-5" />} Reset Password
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>

  );
};

export default ForgotPasswordDialog;
