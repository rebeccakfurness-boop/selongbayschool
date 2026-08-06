import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
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
  sectionTitle: { fontSize: 12, fontWeight: 700, color: BRAND_COLORS.tealDeep, marginTop: 18, marginBottom: 8 },
  box: { borderWidth: 1, borderColor: BRAND_COLORS.teal, borderRadius: 6, padding: 14 },
  twoCol: { flexDirection: 'row', gap: 14 },
  colHalf: { flex: 1 },
  bulletRow: { flexDirection: 'row', marginBottom: 5 },
  bulletDot: { width: 12, fontSize: 10, color: BRAND_COLORS.orangeDeep },
  bulletText: { flex: 1, fontSize: 10, lineHeight: 1.4, color: BRAND_COLORS.ink },
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
          <View style={styles.topRow}>
            <Image src={LOGO_PNG_BUFFER} style={styles.logo} />
            <View>
              <Text style={styles.scriptTitle}>Welcome to Selong Bay School</Text>
              <Text style={styles.meta}>Start date: {formatDateLabel(letter.enrolment_date)}</Text>
            </View>
          </View>

          <Text style={styles.paragraph}>Dear {parents || 'Parent/Guardian'},</Text>
          <Text style={styles.paragraph}>
            We can&apos;t wait to welcome {letter.child_full_name} to Selong Bay School{letter.class_name ? ` in ${letter.class_name}` : ''}
            {' '}on {formatDateLabel(letter.enrolment_date)}. Here&apos;s everything you need to know before their first day.
          </Text>

          <Text style={styles.sectionTitle}>What to bring on the first day</Text>
          <View style={styles.box}>
            {WHAT_TO_BRING.map((item) => (
              <View key={item} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.twoCol}>
            <View style={styles.colHalf}>
              <Text style={styles.sectionTitle}>Daily schedule</Text>
              <View style={styles.box}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Drop-off</Text>
                  <Text style={styles.detailValue}>8:30am</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Lunch</Text>
                  <Text style={styles.detailValue}>12:00pm – 1:30pm</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Pick-up</Text>
                  <Text style={styles.detailValue}>3:30pm</Text>
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
              </View>
            </View>
          </View>

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

          <Text style={styles.paragraph}>
            If you have any questions before the first day, just reply to the email this letter was sent with.
            We&apos;re looking forward to meeting you!
          </Text>
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
