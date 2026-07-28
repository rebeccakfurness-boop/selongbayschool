import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { registerBrandFonts, BRAND_COLORS } from './fonts';
import { LOGO_PNG_BUFFER } from './assets';
import type { ComplianceFormContent } from '@/lib/compliance-forms';

registerBrandFonts();

export interface ComplianceSignatureData {
  signedByName: string;
  signatureDataUrl: string;
  signedAt: string;
}

const styles = StyleSheet.create({
  page: { padding: 0, fontFamily: 'Nunito Sans', fontSize: 10, color: BRAND_COLORS.ink, backgroundColor: BRAND_COLORS.paper },
  body: { paddingHorizontal: 40, paddingTop: 40, paddingBottom: 24 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  logo: { width: 100, height: 79 },
  scriptTitle: { fontFamily: 'Shadows Into Light', fontSize: 32, color: BRAND_COLORS.teal, maxWidth: 320, textAlign: 'right' },
  childMeta: { textAlign: 'right', marginTop: 6, fontSize: 10, color: BRAND_COLORS.ink },
  paragraph: { fontSize: 10, lineHeight: 1.6, color: BRAND_COLORS.ink, marginTop: 12 },
  signatureBox: {
    marginTop: 36,
    borderWidth: 1,
    borderColor: BRAND_COLORS.sand,
    borderRadius: 6,
    padding: 16,
  },
  signatureRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  signatureImage: { width: 180, height: 70, objectFit: 'contain' },
  signatureLine: { width: 180, height: 1, backgroundColor: BRAND_COLORS.sand, marginTop: 50 },
  signatureLabel: { fontSize: 8, color: BRAND_COLORS.inkSoft, marginTop: 4 },
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

export function ComplianceFormDocument({
  childFullName,
  className,
  content,
  signature,
}: {
  childFullName: string;
  className: string | null;
  content: ComplianceFormContent;
  signature: ComplianceSignatureData | null;
}) {
  const filledParagraphs = content.paragraphs.map((p) => p.replaceAll('{{childFullName}}', childFullName));

  return (
    <Document title={content.title}>
      <Page size="A4" style={styles.page}>
        <View style={styles.body}>
          <View style={styles.topRow}>
            <Image src={LOGO_PNG_BUFFER} style={styles.logo} />
            <View>
              <Text style={styles.scriptTitle}>{content.title}</Text>
              <Text style={styles.childMeta}>Child: {childFullName}</Text>
              {className && <Text style={styles.childMeta}>Class: {className}</Text>}
            </View>
          </View>

          {filledParagraphs.map((paragraph, i) => (
            <Text key={i} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}

          <View style={styles.signatureBox}>
            <View style={styles.signatureRow}>
              <View>
                {signature ? (
                  <Image src={signature.signatureDataUrl} style={styles.signatureImage} />
                ) : (
                  <View style={styles.signatureLine} />
                )}
                <Text style={styles.signatureLabel}>Signature</Text>
              </View>
              <View>
                <Text style={{ fontSize: 10 }}>{signature ? signature.signedByName : '________________________'}</Text>
                <Text style={styles.signatureLabel}>Signed by (print name)</Text>
              </View>
              <View>
                <Text style={{ fontSize: 10 }}>{signature ? formatDateLabel(signature.signedAt) : '__ / __ / ____'}</Text>
                <Text style={styles.signatureLabel}>Date</Text>
              </View>
            </View>
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
