import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../supabaseClient';
import { mapSupabaseUser } from '../../utils/supabase';
import { removeCachedProfile } from '../../utils/profileStorage';

/**
 * Custom hook for managing authentication state and operations
 * Handles user login, registration, logout, password reset, and email verification
 */
export const useAuth = ({ translate, setFeedback }) => {
  // User state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(true);

  // Modal states
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);

  // Form states
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    type: 'student' 
  });
  const [registerConfirm, setRegisterConfirm] = useState('');

  // Error states
  const [authError, setAuthError] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');

  // Password reset states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordResetError, setPasswordResetError] = useState('');
  const [passwordResetSaving, setPasswordResetSaving] = useState(false);

  // Security states
  const [securityOldPassword, setSecurityOldPassword] = useState('');
  const [securityNewPassword, setSecurityNewPassword] = useState('');
  const [securityConfirmPassword, setSecurityConfirmPassword] = useState('');
  const [securitySaving, setSecuritySaving] = useState(false);
  const [securityError, setSecurityError] = useState('');
  const [securityEmail, setSecurityEmail] = useState('');
  const [securityEmailSaving, setSecurityEmailSaving] = useState(false);
  const [securityEmailMessage, setSecurityEmailMessage] = useState('');

  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirm, setShowRegisterConfirm] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewConfirm, setShowNewConfirm] = useState(false);

  // Other states
  const [resendingEmail, setResendingEmail] = useState(false);

  // Initialize session and auth listener
  useEffect(() => {
    const initialiseSession = async () => {
      const sessionResponse = await supabase.auth.getSession();
      const { data, error } = sessionResponse || {};
      if (error) {
        console.error('Session load error', error);
      }
      const session = data?.session ?? null;
      const mapped = mapSupabaseUser(session?.user);
      setUser(mapped);
      setEmailVerified(!!session?.user?.email_confirmed_at);
      setAuthLoading(false);
    };

    initialiseSession();

    const authListener = supabase.auth.onAuthStateChange((event, session) => {
      const mapped = mapSupabaseUser(session?.user);
      setUser(mapped);
      setEmailVerified(!!session?.user?.email_confirmed_at);
      if (event === 'PASSWORD_RECOVERY') {
        setResetPasswordModalOpen(true);
        setShowLoginModal(false);
      }
    });

    const subscription = authListener?.data?.subscription ?? null;

    return () => {
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Sync security email with user email
  useEffect(() => {
    if (user?.email) {
      setSecurityEmail(user.email);
    }
  }, [user?.email]);

  // Login handler
  const handleLogin = useCallback(async (event) => {
    event.preventDefault();
    setAuthError('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginForm.email.trim(),
        password: loginForm.password,
      });
      if (error) {
        setAuthError(error.message);
        return;
      }
      if (data.user) {
        const mapped = mapSupabaseUser(data.user);
        setUser(mapped);
        setEmailVerified(!!data.user.email_confirmed_at);
        if (!data.user.email_confirmed_at) {
          setFeedback({
            type: 'info',
            message: translate(
              'authModal.feedback.confirmEmail',
              'Check your inbox and confirm your email to unlock all features.'
            ),
          });
        }
        setFeedback({
          type: 'success',
          message: translate('authModal.feedback.welcome', 'Welcome back, {{name}}!', {
            name: mapped.name,
          }),
        });
        setShowLoginModal(false);
        setLoginForm({ email: '', password: '' });
      }
    } catch (error) {
      setAuthError(error.message);
    }
  }, [loginForm, translate, setFeedback]);

  // Register handler
  const handleRegister = useCallback(async (event) => {
    event.preventDefault();
    setAuthError('');
    if (!registerForm.name.trim()) {
      setAuthError('Please add your name so startups know who to contact.');
      return;
    }
    if (registerForm.password.length < 8) {
      setAuthError('Password must be at least 8 characters long.');
      return;
    }
    if (registerForm.password !== registerConfirm) {
      setAuthError('Passwords do not match.');
      return;
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email: registerForm.email.trim(),
        password: registerForm.password,
        options: {
          data: {
            name: registerForm.name.trim(),
            type: registerForm.type,
          },
        },
      });
      if (error) {
        setAuthError(error.message);
        return;
      }
      setRegisterForm({ name: '', email: '', password: '', type: 'student' });
      setRegisterConfirm('');
      setFeedback({
        type: 'success',
        message: translate(
          'authModal.feedback.registered',
          'Account created! Check your email to verify your account.'
        ),
      });
      setIsRegistering(false);
      setShowLoginModal(false);
    } catch (error) {
      setAuthError(error.message);
    }
  }, [registerForm, registerConfirm, translate, setFeedback]);

  // Logout handler
  const handleLogout = useCallback(async () => {
    const previousUserId = user?.id;
    await supabase.auth.signOut();
    if (previousUserId) {
      removeCachedProfile(previousUserId);
    }
    setUser(null);
    setFeedback({ type: 'info', message: 'Signed out. Your saved roles stay here for you.' });
  }, [user, setFeedback]);

  // Resend verification email
  const resendVerificationEmail = useCallback(async () => {
    if (!user?.email) return;
    setResendingEmail(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (error) {
        setFeedback({ type: 'error', message: error.message });
      } else {
        setFeedback({
          type: 'success',
          message: translate(
            'authModal.feedback.verificationSent',
            'Verification email sent. Check your inbox and spam folder.'
          ),
        });
      }
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setResendingEmail(false);
    }
  }, [user, translate, setFeedback]);

  // Forgot password handler
  const handleForgotPassword = useCallback(async () => {
    if (!loginForm.email.trim()) {
      setAuthError(
        translate(
          'authModal.forgotPassword.emailRequired',
          'Please enter your email address first.'
        )
      );
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(loginForm.email.trim(), {
        redirectTo: window.location.origin,
      });

      if (error) {
        setAuthError(error.message);
        return;
      }

      setForgotPasswordMessage(
        translate(
          'authModal.forgotPassword.emailSent',
          'Password reset instructions sent. Check your email.'
        )
      );

      setTimeout(() => {
        setForgotPasswordMessage('');
      }, 5000);
    } catch (error) {
      setAuthError(error.message);
    }
  }, [loginForm.email, translate]);

  // Reset password handler
  const handleResetPassword = useCallback(async (event) => {
    event.preventDefault();
    setPasswordResetError('');

    if (newPassword.length < 8) {
      setPasswordResetError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordResetError('Passwords do not match.');
      return;
    }

    setPasswordResetSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setPasswordResetError(error.message);
        return;
      }

      setFeedback({
        type: 'success',
        message: translate(
          'security.passwordResetSuccess',
          'Password reset successfully. You can now log in with your new password.'
        ),
      });

      setResetPasswordModalOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordResetError(error.message);
    } finally {
      setPasswordResetSaving(false);
    }
  }, [newPassword, confirmPassword, translate, setFeedback]);

  // Update password handler
  const handleUpdatePassword = useCallback(async (event) => {
    event.preventDefault();
    setSecurityError('');

    if (!securityOldPassword) {
      setSecurityError('Please enter your current password.');
      return;
    }

    if (securityNewPassword.length < 8) {
      setSecurityError('New password must be at least 8 characters long.');
      return;
    }

    if (securityNewPassword !== securityConfirmPassword) {
      setSecurityError('New passwords do not match.');
      return;
    }

    setSecuritySaving(true);

    try {
      // First verify the old password by trying to sign in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: securityOldPassword,
      });

      if (verifyError) {
        setSecurityError('Current password is incorrect.');
        setSecuritySaving(false);
        return;
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: securityNewPassword,
      });

      if (error) {
        setSecurityError(error.message);
        return;
      }

      setFeedback({
        type: 'success',
        message: translate('security.passwordUpdateSuccess', 'Password updated successfully.'),
      });

      setSecurityOldPassword('');
      setSecurityNewPassword('');
      setSecurityConfirmPassword('');
    } catch (error) {
      setSecurityError(error.message);
    } finally {
      setSecuritySaving(false);
    }
  }, [securityOldPassword, securityNewPassword, securityConfirmPassword, user, translate, setFeedback]);

  // Update email handler
  const handleUpdateEmail = useCallback(async (event) => {
    event.preventDefault();
    setSecurityEmailMessage('');

    if (!securityEmail.trim()) {
      setSecurityEmailMessage('Please enter a valid email address.');
      return;
    }

    if (securityEmail.trim() === user?.email) {
      setSecurityEmailMessage('This is already your current email address.');
      return;
    }

    setSecurityEmailSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({
        email: securityEmail.trim(),
      });

      if (error) {
        setSecurityEmailMessage(error.message);
        return;
      }

      setFeedback({
        type: 'success',
        message: translate(
          'security.emailUpdateSuccess',
          'Email update initiated. Check your new email to confirm.'
        ),
      });
    } catch (error) {
      setSecurityEmailMessage(error.message);
    } finally {
      setSecurityEmailSaving(false);
    }
  }, [securityEmail, user, translate, setFeedback]);

  return {
    // User state
    user,
    setUser,
    authLoading,
    emailVerified,
    setEmailVerified,

    // Modal states
    showLoginModal,
    setShowLoginModal,
    isRegistering,
    setIsRegistering,
    resetPasswordModalOpen,
    setResetPasswordModalOpen,
    securityModalOpen,
    setSecurityModalOpen,

    // Form states
    loginForm,
    setLoginForm,
    registerForm,
    setRegisterForm,
    registerConfirm,
    setRegisterConfirm,

    // Error states
    authError,
    setAuthError,
    forgotPasswordMessage,
    setForgotPasswordMessage,

    // Password reset states
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passwordResetError,
    setPasswordResetError,
    passwordResetSaving,

    // Security states
    securityOldPassword,
    setSecurityOldPassword,
    securityNewPassword,
    setSecurityNewPassword,
    securityConfirmPassword,
    setSecurityConfirmPassword,
    securitySaving,
    securityError,
    setSecurityError,
    securityEmail,
    setSecurityEmail,
    securityEmailSaving,
    securityEmailMessage,
    setSecurityEmailMessage,

    // Password visibility states
    showLoginPassword,
    setShowLoginPassword,
    showRegisterPassword,
    setShowRegisterPassword,
    showRegisterConfirm,
    setShowRegisterConfirm,
    showOldPassword,
    setShowOldPassword,
    showNewPassword,
    setShowNewPassword,
    showNewConfirm,
    setShowNewConfirm,

    // Other states
    resendingEmail,

    // Functions
    handleLogin,
    handleRegister,
    handleLogout,
    resendVerificationEmail,
    handleForgotPassword,
    handleResetPassword,
    handleUpdatePassword,
    handleUpdateEmail,
  };
};

