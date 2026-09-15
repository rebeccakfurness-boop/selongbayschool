import { Document, Page, View, Text, Image, Link, StyleSheet } from '@react-pdf/renderer';
import { registerBrandFonts, BRAND_COLORS } from './fonts';
import { LOGO_PNG_BUFFER } from './assets';
import { siteConfig } from '@/lib/site-content';

registerBrandFonts();

export interface WelcomeLetterPdfData {
  child_full_name: string;
  parent1_name: string | null;
  parent2_name: string | null;
  enrolment_date: string;
  class_name: string | null;
}

const styles = StyleSheet.create({
  page: { padding: 0, fontFamily: 'Nunito Sans', fontSize: 10, color: BRAND_COLORS.ink, backgroundColor: BRAND_COLORS.paper },
  body: { paddingHorizontal: 40, paddingTop: 40, paddingBottom: 24 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  logo: { width: 100, height: 79 },
  scriptTitle: { fontFamily: 'Shadows Into Light', fontSize: 32, color: BRAND_COLORS.teal },
  meta: { textAlign: 'right', marginTop: 6, fontSize: 10, color: BRAND_COLORS.ink },
  paragraph: { fontSize: 10, lineHeight: 1.6, color: BRAND_COLORS.ink, marginTop: 12 },
  // Each section is its own "don't split me across a page break" unit (wrap={false} below) --
  // without it, react-pdf will happily slice a box or a two-column row right at the page boundary,
  // which is what made the previous version hard to read where it broke onto page 2.
  section: { marginTop: 4 },
  sectionTitle: { fontSize: 12, fontWeight: 700, color: BRAND_COLORS.tealDeep, marginTop: 18, marginBottom: 8 },
  box: { borderWidth: 1, borderColor: BRAND_COLORS.teal, borderRadius: 6, padding: 14 },
  twoCol: { flexDirection: 'row', gap: 14 },
  colHalf: { flex: 1 },
  bulletRow: { flexDirection: 'row', marginBottom: 5 },
  bulletDot: { width: 12, fontSize: 10, color: BRAND_COLORS.orangeDeep },
  bulletText: { flex: 1, fontSize: 10, lineHeight: 1.4, color: BRAND_COLORS.ink },
  bulletLink: { flex: 1, fontSize: 10, lineHeight: 1.4, color: BRAND_COLORS.tealDeep, textDecoration: 'underline' },
  detailRow: { flexDirection: 'row', marginBottom: 6 },
  detailLabel: { width: 90, fontSize: 9, fontWeight: 700, color: BRAND_COLORS.ink },
  detailValue: { flex: 1, fontSize: 9.5, color: BRAND_COLORS.ink },
  footer: {
    backgroundColor: BRAND_COLORS.tealDeep,
    color: '#ffffff',
    fontSize: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});

const WHAT_TO_BRING = [
  'A hat, for sun protection',
  'Sunblock, applied before drop-off',
  'A drink bottle, labelled with their name',
  'Their own stationery, if they have any',
  'Comfortable, closed-toe shoes',
  'Swimming clothes, on days with water-based activities',
  'A morning tea snack and an afternoon tea snack',
];

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export function WelcomeLetterDocument({ letter }: { letter: WelcomeLetterPdfData }) {
  const parents = [letter.parent1_name, letter.parent2_name].filter(Boolean).join(' and ');

  return (
    <Document title={`Welcome Letter - ${letter.child_full_name}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.body}>
          <View style={styles.topRow} wrap={false}>
            <Image src={LOGO_PNG_BUFFER} style={styles.logo} />
            <View>
              <Text style={styles.scriptTitle}>Welcome to Selong Bay School</Text>
              <Text style={styles.meta}>Start date: {formatDateLabel(letter.enrolment_date)}</Text>
            </View>
          </View>

          <View wrap={false}>
            <Text style={styles.paragraph}>Dear {parents || 'Parent/Guardian'},</Text>
            <Text style={styles.paragraph}>
              We can&apos;t wait to welcome {letter.child_full_name} to Selong Bay School{letter.class_name ? ` in ${letter.class_name}` : ''}
              {' '}on {formatDateLabel(letter.enrolment_date)}. Here&apos;s everything you need to know before their first day.
            </Text>
          </View>

          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>What to bring on the first day</Text>
            <View style={styles.box}>
              {WHAT_TO_BRING.map((item) => (
                <View key={item} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.twoCol, styles.section]} wrap={false}>
            <View style={styles.colHalf}>
              <Text style={styles.sectionTitle}>Daily schedule</Text>
              <View style={styles.box}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Drop-off</Text>
                  <Text style={styles.detailValue}>8:20am</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Class begins</Text>
                  <Text style={styles.detailValue}>8:30am</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Lunch</Text>
                  <Text style={styles.detailValue}>12:00pm – 1:30pm</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Pick-up</Text>
                  <Text style={styles.detailValue}>3:30pm — from school, or from Lantis Resto on Tuesdays and Thursdays</Text>
                </View>
              </View>
            </View>

            <View style={styles.colHalf}>
              <Text style={styles.sectionTitle}>Key contacts</Text>
              <View style={styles.box}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>School</Text>
                  <Text style={styles.detailValue}>{siteConfig.contact.phone} (WhatsApp)</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Ms Indhira</Text>
                  <Text style={styles.detailValue}>Principal, via the school number above</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Mariya</Text>
                  <Text style={styles.detailValue}>Admin, via the school number above</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Emergency</Text>
                  <Text style={styles.detailValue}>Ms Indhie — +628111959911</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={[styles.twoCol, styles.section]} wrap={false}>
            <View style={styles.colHalf}>
              <Text style={styles.sectionTitle}>Our campus at SABA</Text>
              <View style={styles.box}>
                <View style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Link src="https://maps.app.goo.gl/KPUDWS1TzADn1MK69" style={styles.bulletLink}>
                    Find SABA on Google Maps
                  </Link>
                </View>
                <View style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Link src="https://saba-lombok.com/" style={styles.bulletLink}>
                    saba-lombok.com
                  </Link>
                </View>
              </View>
            </View>

            <View style={styles.colHalf}>
              <Text style={styles.sectionTitle}>Wifi</Text>
              <View style={styles.box}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Network</Text>
                  <Text style={styles.detailValue}>Selong BaySchool2</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Password</Text>
                  <Text style={styles.detailValue}>SBS2026!</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Tuesday & Thursday activities</Text>
            <View style={styles.box}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>When</Text>
                <Text style={styles.detailValue}>1:30pm – 3:30pm, Tuesdays and Thursdays</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Where</Text>
                <Text style={styles.detailValue}>Lantis Resto & Bar</Text>
              </View>
              <View style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Link src="https://share.google/pHectYCXWBheJz5RA" style={styles.bulletLink}>
                  Find Lantis Resto & Bar on Google Maps
                </Link>
              </View>
              <View style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Link src="https://linktr.ee/lantisrestoandbar" style={styles.bulletLink}>
                  linktr.ee/lantisrestoandbar
                </Link>
              </View>
              <View style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>
                  Pick-up on these two days is from Lantis Resto at 3:30pm, not from school.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Payments</Text>
            <View style={styles.box}>
              <View style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>You can pay by bank transfer or via Wise.</Text>
              </View>
              <View style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>Our school administrator will send an invoice to your email address.</Text>
              </View>
              <View style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>
                  Please send proof of payment, such as a screenshot, to the school WhatsApp or school email.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>The Parent Portal</Text>
            <View style={styles.box}>
              <View style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>
                  Log in from the &apos;Log in&apos; link on our website to check {letter.child_full_name} in and out each day.
                </Text>
              </View>
              <View style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>You can also book lunches, browse the school library, and book extra activities.</Text>
              </View>
              <View style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>Trouble logging in? Just contact us and we&apos;ll help.</Text>
              </View>
              <View style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>
                  You&apos;ll also be added to our Parent Communication WhatsApp group — let us know if you don&apos;t
                  get access, or don&apos;t use WhatsApp.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Before the first day</Text>
            <View style={styles.box}>
              <View style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>Confirm {letter.child_full_name}&apos;s lunch selection via the parent portal.</Text>
              </View>
              <View style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>
                  Log into the parent portal each day to check {letter.child_full_name} in at drop-off and out at pick-up.
                </Text>
              </View>
            </View>
          </View>

          <View wrap={false}>
            <Text style={styles.paragraph}>
              If you have any questions before the first day, just reply to the email this letter was sent with.
              We&apos;re looking forward to meeting you!
            </Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text>www.selongbayschool.com</Text>
          <Text>{siteConfig.contact.phone}</Text>
          <Text>{siteConfig.contact.email}</Text>
        </View>
      </Page>
    </Document>
  );
}
