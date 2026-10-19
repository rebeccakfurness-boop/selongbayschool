import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { registerBrandFonts, BRAND_COLORS } from './fonts';
import { LOGO_PNG_BUFFER } from './assets';
import type { CreditNoteRow } from '../credit-notes';

registerBrandFonts();

function formatMoney(amount: number): string {
  return `Rp ${new Intl.NumberFormat('en-US').format(Math.round(amount))}`;
}

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

const styles = StyleSheet.create({
  page: { padding: 0, fontFamily: 'Nunito Sans', fontSize: 10, color: BRAND_COLORS.ink, backgroundColor: BRAND_COLORS.paper },
  body: { paddingHorizontal: 40, paddingTop: 40, paddingBottom: 24 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  logo: { width: 100, height: 79 },
  scriptTitle: { fontFamily: 'Shadows Into Light', fontSize: 40, color: BRAND_COLORS.teal },
  meta: { textAlign: 'right', marginTop: 6, fontSize: 10, color: BRAND_COLORS.ink },
  sectionLabel: { fontSize: 9, fontWeight: 700, letterSpacing: 0.5, color: BRAND_COLORS.ink, marginBottom: 4 },
  billedToRow: { marginTop: 28 },
  billedTo: { fontSize: 10, color: BRAND_COLORS.ink },
  kindPill: { marginTop: 24, alignSelf: 'flex-start', borderRadius: 4, paddingVertical: 4, paddingHorizontal: 10, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 },
  amountBox: { marginTop: 20, borderWidth: 1, borderColor: BRAND_COLORS.teal, borderRadius: 6, padding: 16 },
  amountLabel: { fontSize: 9, color: BRAND_COLORS.inkSoft, textTransform: 'uppercase', letterSpacing: 0.4 },
  amountValue: { fontSize: 22, fontWeight: 700, color: BRAND_COLORS.tealDeep, marginTop: 4, fontVariantNumeric: 'tabular-nums' },
  reasonBox: { marginTop: 20 },
  reasonText: { fontSize: 10, lineHeight: 1.5, color: BRAND_COLORS.ink },
  table: { marginTop: 20, borderWidth: 1, borderColor: BRAND_COLORS.sand, borderRadius: 6, overflow: 'hidden' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: BRAND_COLORS.teal },
  tableHeaderCell: { color: '#ffffff', fontWeight: 700, fontSize: 8.5, padding: 7 },
  tableRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#e5ded0' },
  tableCell: { fontSize: 9, padding: 7, color: BRAND_COLORS.ink },
  tableCellNum: { fontSize: 9, padding: 7, color: BRAND_COLORS.ink, fontVariantNumeric: 'tabular-nums', textAlign: 'right' },
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

const KIND_LABELS: Record<CreditNoteRow['kind'], string> = {
  refund: 'Refund',
  credit_hold: 'Credit held for future invoices',
};

const STATUS_LABELS: Record<CreditNoteRow['status'], string> = {
  open: 'Open',
  applied: 'Fully applied',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
};

export function CreditNoteDocument({ creditNote }: { creditNote: CreditNoteRow }) {
  return (
    <Document title={`Credit Note ${creditNote.credit_note_number}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.body}>
          <View style={styles.topRow}>
            <Image src={LOGO_PNG_BUFFER} style={styles.logo} />
            <View>
              <Text style={styles.scriptTitle}>Credit Note</Text>
              <Text style={styles.meta}>Number: {String(creditNote.credit_note_number).padStart(3, '0')}</Text>
              <Text style={styles.meta}>Date: {formatDateLabel(creditNote.issued_at.slice(0, 10))}</Text>
              <Text style={styles.meta}>Status: {STATUS_LABELS[creditNote.status]}</Text>
            </View>
          </View>

          <View style={styles.billedToRow}>
            <Text style={styles.sectionLabel}>ISSUED TO</Text>
            <Text style={styles.billedTo}>{creditNote.child_full_name}</Text>
            {creditNote.original_invoice_number != null && (
              <Text style={[styles.billedTo, { marginTop: 4 }]}>
                Relates to invoice #{String(creditNote.original_invoice_number).padStart(3, '0')}
              </Text>
            )}
          </View>

          <Text
            style={[
              styles.kindPill,
              creditNote.kind === 'refund' ? { backgroundColor: `${BRAND_COLORS.orange}33`, color: BRAND_COLORS.orangeDeep } : { backgroundColor: `${BRAND_COLORS.teal}26`, color: BRAND_COLORS.tealDeep },
            ]}
          >
            {KIND_LABELS[creditNote.kind]}
          </Text>

          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>{creditNote.kind === 'refund' ? 'Refund amount' : 'Credit amount'}</Text>
            <Text style={styles.amountValue}>{formatMoney(creditNote.amount_idr)}</Text>
            {creditNote.kind === 'credit_hold' && creditNote.remaining_idr !== creditNote.amount_idr && (
              <Text style={{ fontSize: 9, color: BRAND_COLORS.inkSoft, marginTop: 6 }}>
                {formatMoney(creditNote.remaining_idr)} remaining, {formatMoney(creditNote.amount_idr - creditNote.remaining_idr)} already applied.
              </Text>
            )}
          </View>

          <View style={styles.reasonBox}>
            <Text style={styles.sectionLabel}>REASON</Text>
            <Text style={styles.reasonText}>{creditNote.reason}</Text>
          </View>

          {creditNote.applications.length > 0 && (
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Applied to invoice</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Date</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Amount</Text>
              </View>
              {creditNote.applications.map((a) => (
                <View key={a.id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>Invoice #{String(a.invoice_number).padStart(3, '0')}</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>{formatDateLabel(a.applied_at.slice(0, 10))}</Text>
                  <Text style={[styles.tableCellNum, { flex: 1 }]}>{formatMoney(a.amount_idr)}</Text>
                </View>
              ))}
            </View>
          )}
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
