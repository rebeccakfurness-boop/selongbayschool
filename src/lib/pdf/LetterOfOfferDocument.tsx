import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { registerBrandFonts, BRAND_COLORS } from './fonts';
import { LOGO_PNG_BUFFER } from './assets';

registerBrandFonts();

export interface LetterOfOfferPdfData {
  id: number;
  status: 'draft' | 'sent' | 'accepted';
  start_date: string;
  programme: string | null;
  class_name: string | null;
  tuition_plan: string | null;
  fees_note: string | null;
  additional_terms: string | null;
  accepted_at: string | null;
  accepted_by_name: string | null;
  child_full_name: string;
  parent1_name: string | null;
  parent2_name: string | null;
  created_at: string;
}

const styles = StyleSheet.create({
  page: { padding: 0, fontFamily: 'Nunito Sans', fontSize: 10, color: BRAND_COLORS.ink, backgroundColor: BRAND_COLORS.paper },
  body: { paddingHorizontal: 40, paddingTop: 40, paddingBottom: 24 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  logo: { width: 100, height: 79 },
  scriptTitle: { fontFamily: 'Shadows Into Light', fontSize: 36, color: BRAND_COLORS.teal },
  meta: { textAlign: 'right', marginTop: 6, fontSize: 10, color: BRAND_COLORS.ink },
  paragraph: { fontSize: 10, lineHeight: 1.6, color: BRAND_COLORS.ink, marginTop: 12 },
  detailsBox: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: BRAND_COLORS.teal,
    borderRadius: 6,
    padding: 14,
  },
  detailRow: { flexDirection: 'row', marginBottom: 6 },
  detailLabel: { width: 130, fontSize: 9, fontWeight: 700, color: BRAND_COLORS.ink },
  detailValue: { flex: 1, fontSize: 9.5, color: BRAND_COLORS.ink },
  acceptanceBox: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: BRAND_COLORS.sand,
    borderRadius: 6,
    padding: 16,
  },
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

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export function LetterOfOfferDocument({ letter }: { letter: LetterOfOfferPdfData }) {
  const parents = [letter.parent1_name, letter.parent2_name].filter(Boolean).join(' and ');

  return (
    <Document title={`Letter of Offer - ${letter.child_full_name}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.body}>
          <View style={styles.topRow}>
            <Image src={LOGO_PNG_BUFFER} style={styles.logo} />
            <View>
              <Text style={styles.scriptTitle}>Letter of Offer</Text>
              <Text style={styles.meta}>Date: {formatDateLabel(letter.created_at.slice(0, 10))}</Text>
            </View>
          </View>

          <Text style={styles.paragraph}>Dear {parents || 'Parent/Guardian'},</Text>
          <Text style={styles.paragraph}>
            We are delighted to offer {letter.child_full_name} a place at Selong Bay School. This letter confirms
            the details of the offer below. Please review them carefully, and let us know if anything needs
            correcting before you accept.
          </Text>

          <View style={styles.detailsBox}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Student</Text>
              <Text style={styles.detailValue}>{letter.child_full_name}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Start date</Text>
              <Text style={styles.detailValue}>{formatDateLabel(letter.start_date)}</Text>
            </View>
            {letter.programme && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Programme</Text>
                <Text style={styles.detailValue}>{letter.programme}</Text>
              </View>
            )}
            {letter.class_name && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Class</Text>
                <Text style={styles.detailValue}>{letter.class_name}</Text>
              </View>
            )}
            {letter.tuition_plan && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tuition plan</Text>
                <Text style={styles.detailValue}>{letter.tuition_plan}</Text>
              </View>
            )}
            {letter.fees_note && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Fees</Text>
                <Text style={styles.detailValue}>{letter.fees_note}</Text>
              </View>
            )}
          </View>

          {letter.additional_terms && (
            <Text style={styles.paragraph}>{letter.additional_terms}</Text>
          )}

          <Text style={styles.paragraph}>
            Once you&apos;re ready, please accept this offer using the link in the email it was sent with — a
            tuition invoice will follow once you&apos;ve accepted.
          </Text>

          <View style={styles.acceptanceBox}>
            {letter.status === 'accepted' && letter.accepted_at ? (
              <Text style={{ fontSize: 10 }}>
                Accepted by {letter.accepted_by_name} on {formatDateLabel(letter.accepted_at.slice(0, 10))}
              </Text>
            ) : (
              <Text style={{ fontSize: 10, color: BRAND_COLORS.inkSoft }}>Awaiting parent acceptance.</Text>
            )}
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text>www.selongbayschool.com</Text>
          <Text>+62 813-5974-095</Text>
          <Text>hello@selongbayschool.com</Text>
        </View>
      </Page>
    </Document>
  );
}
