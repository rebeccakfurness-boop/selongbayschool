import path from 'path';
import { Font } from '@react-pdf/renderer';

/**
 * Registered from local files in public/fonts (downloaded from Google Fonts) rather than fetched
 * over the network at request time — a PDF route failing because an external font CDN is briefly
 * unreachable would be a bad failure mode, so these ship in the repo instead.
 */
let registered = false;

export function registerBrandFonts() {
  if (registered) return;
  registered = true;
  const dir = path.join(process.cwd(), 'public/fonts');
  Font.register({
    family: 'Nunito Sans',
    fonts: [
      { src: path.join(dir, 'NunitoSans-Regular.woff'), fontWeight: 400 },
      { src: path.join(dir, 'NunitoSans-Bold.woff'), fontWeight: 700 },
      { src: path.join(dir, 'NunitoSans-ExtraBold.woff'), fontWeight: 800 },
    ],
  });
  Font.register({
    family: 'Telex',
    src: path.join(dir, 'Telex-Regular.woff'),
  });
  Font.register({
    family: 'Shadows Into Light',
    src: path.join(dir, 'ShadowsIntoLight-Regular.woff'),
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
