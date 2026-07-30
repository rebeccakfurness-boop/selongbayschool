import { Font } from '@react-pdf/renderer';
import {
  NUNITO_SANS_REGULAR_DATA_URL,
  NUNITO_SANS_BOLD_DATA_URL,
  NUNITO_SANS_EXTRABOLD_DATA_URL,
  TELEX_REGULAR_DATA_URL,
  SHADOWS_INTO_LIGHT_REGULAR_DATA_URL,
} from './assets';

/**
 * Registered from the inlined font data URLs in ./assets.ts (originally downloaded from Google
 * Fonts) rather than fetched over the network at request time or read from the filesystem — see
 * assets.ts for why a filesystem read isn't reliable in Vercel's serverless bundling, and why
 * fonts specifically need a data: URL string rather than a raw Buffer.
 */
let registered = false;

export function registerBrandFonts() {
  if (registered) return;
  registered = true;
  Font.register({
    family: 'Nunito Sans',
    fonts: [
      { src: NUNITO_SANS_REGULAR_DATA_URL, fontWeight: 400 },
      { src: NUNITO_SANS_BOLD_DATA_URL, fontWeight: 700 },
      { src: NUNITO_SANS_EXTRABOLD_DATA_URL, fontWeight: 800 },
    ],
  });
  Font.register({
    family: 'Telex',
    src: TELEX_REGULAR_DATA_URL,
  });
  Font.register({
    family: 'Shadows Into Light',
    src: SHADOWS_INTO_LIGHT_REGULAR_DATA_URL,
  });
}

export const BRAND_COLORS = {
  teal: '#007c83',
  tealDeep: '#045157',
  orange: '#fea74a',
  orangeDeep: '#d97f1f',
  sand: '#dad0bc',
  cream: '#f6f1e6',
  paper: '#fffdf8',
  ink: '#17282b',
  inkSoft: '#3f5559',
};
