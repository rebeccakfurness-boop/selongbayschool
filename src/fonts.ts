import { Telex, Shadows_Into_Light, Nunito_Sans } from 'next/font/google';

export const telex = Telex({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-telex',
  display: 'swap',
});

export const shadowsIntoLight = Shadows_Into_Light({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-shadows-into-light',
  display: 'swap',
});

export const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-nunito-sans',
  display: 'swap',
});
