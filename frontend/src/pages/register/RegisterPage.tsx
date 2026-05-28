import { DICTIONARY } from '@locales';
import { APP_ROUTES } from '@constants';
import { AuthPageHeader } from '@components';
import { RegisterForm } from './components';

const RegisterPage = () => {
  const t = DICTIONARY.auth.register;

  return (
    <main>
      <AuthPageHeader
        title={t.title}
        linkText={t.haveAccount}
        linkActionText={t.loginLink}
        linkTo={APP_ROUTES.AUTH.SIGNIN}
      />
      <RegisterForm />
    </main>
  );
};

export default RegisterPage;
