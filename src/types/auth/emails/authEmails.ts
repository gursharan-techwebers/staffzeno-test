export type VerificationEmailProps = {
  name: string;
  email: string;
  url: string;
};

export type PasswordResetEmailProps = {
  name: string;
  url: string;
};

export type PasswordResetConfirmationEmailProps = {
  name: string;
  email: string;
  changedAt: string;
};