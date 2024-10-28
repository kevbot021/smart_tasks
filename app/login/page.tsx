import AuthForm from '../../components/auth-form';
import { getBaseUrl } from '../utils/config';

export default function LoginPage() {
  const handleGoogleSignIn = async () => {
    const baseUrl = getBaseUrl();
    try {
      await signIn('google', {
        callbackUrl: `${baseUrl}/todo`
      });
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Log in to access your account
          </h2>
        </div>
        <AuthForm mode="login" />
      </div>
    </div>
  );
}
