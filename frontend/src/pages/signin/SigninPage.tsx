import { DICTIONARY } from '@locales';
import { APP_ROUTES } from '@constants';
import { AuthPageHeader } from '@components';
import { SigninForm } from './components';

export const SigninPage = () => {
  const t = DICTIONARY.auth.login;

  return (
    <>
      <AuthPageHeader
        title={t.title}
        linkText={t.noAccount}
        linkActionText={t.registerLink}
        linkTo={APP_ROUTES.AUTH.REGISTER}
      />
      <SigninForm />
    </>
  );
};
