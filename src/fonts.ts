import { Fredoka, Yellowtail, Nunito_Sans } from 'next/font/google';

export const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-fredoka',
  display: 'swap',
});

export const yellowtail = Yellowtail({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-yellowtail',
  display: 'swap',
});

export const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-nunito-sans',
  display: 'swap',
});
