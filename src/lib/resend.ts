import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not defined in the environment variables.');
}