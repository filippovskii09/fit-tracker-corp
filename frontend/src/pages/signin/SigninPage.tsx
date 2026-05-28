import { DICTIONARY } from '@locales';
import { APP_ROUTES } from '@constants';
import { AuthPageHeader } from '@components';
import { SigninForm } from './components';

const SigninPage = () => {
  const t = DICTIONARY.auth.login;

  return (
    <main>
      <AuthPageHeader
        title={t.title}
        linkText={t.noAccount}
        linkActionText={t.registerLink}
        linkTo={APP_ROUTES.AUTH.REGISTER}
      />
      <SigninForm />
    </main>
  );
};

export default SigninPage;
