import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { registerBrandFonts, BRAND_COLORS } from './fonts';
import { LOGO_PNG_BUFFER } from './assets';

registerBrandFonts();

export interface InvoiceLineItemData {
  child_id: number | null;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface InvoiceChildData {
  child_id: number;
  discount_percent: number;
}

export interface InvoiceData {
  invoice_number: number;
  invoice_type: 'tuition' | 'activity' | 'lunch';
  billed_to_name: string;
  issue_date: string;
  due_date: string;
  currency: string;
  subtotal_amount: number;
  sibling_discount_amount: number;
  total_amount: number;
  notes: string | null;
}

export interface SchoolSettingsData {
  payable_to: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  swift_code: string;
  bank_address: string | null;
  bank_code: string | null;
  branch_code: string | null;
  clearing_code: string | null;
}

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat('id-ID').format(amount) + (currency === 'IDR' ? '' : ` ${currency}`);
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
  invoiceMeta: { textAlign: 'right', marginTop: 6, fontSize: 10, color: BRAND_COLORS.ink },
  sectionLabel: { fontSize: 9, fontWeight: 700, letterSpacing: 0.5, color: BRAND_COLORS.ink, marginBottom: 4 },
  payableRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 28 },
  billedTo: { fontSize: 10, color: BRAND_COLORS.ink },
  tableWrap: { marginTop: 24, borderWidth: 1, borderColor: BRAND_COLORS.teal, borderRadius: 6, overflow: 'hidden' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: BRAND_COLORS.teal },
  th: { color: '#ffffff', fontWeight: 700, fontSize: 9, padding: 8 },
  tr: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#e5ded0' },
  td: { fontSize: 9.5, padding: 8 },
  totalsBox: { marginTop: 16, alignSelf: 'flex-end', width: 220, borderWidth: 1, borderColor: BRAND_COLORS.sand, borderRadius: 6, padding: 10 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, alignItems: 'flex-start' },
  notesBox: { flex: 1, marginRight: 16 },
  qrBox: { width: 70, height: 70, backgroundColor: BRAND_COLORS.tealDeep, borderRadius: 6 },
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

export function InvoiceDocument({
  invoice,
  lineItems,
  settings,
}: {
  invoice: InvoiceData;
  lineItems: InvoiceLineItemData[];
  settings: SchoolSettingsData;
}) {
  return (
    <Document title={`Invoice ${invoice.invoice_number}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.body}>
          <View style={styles.topRow}>
            <Image src={LOGO_PNG_BUFFER} style={styles.logo} />
            <View>
              <Text style={styles.scriptTitle}>Invoice</Text>
              <Text style={styles.invoiceMeta}>Number: {String(invoice.invoice_number).padStart(3, '0')}</Text>
              <Text style={styles.invoiceMeta}>Date: {formatDateLabel(invoice.issue_date)}</Text>
            </View>
          </View>

          <View style={styles.payableRow}>
            <View style={{ maxWidth: 260 }}>
              <Text style={styles.sectionLabel}>PAYABLE TO</Text>
              <Text style={styles.billedTo}>{settings.payable_to}</Text>

              <Text style={[styles.sectionLabel, { marginTop: 16 }]}>BANK DETAILS</Text>
              <Text style={styles.billedTo}>Account Number : {settings.account_number}</Text>
              <Text style={styles.billedTo}>Account Name : {settings.account_name}</Text>
              <Text style={styles.billedTo}>SWIFT Code : {settings.swift_code}</Text>
              <Text style={styles.billedTo}>Bank Name : {settings.bank_name}</Text>
            </View>
            <Text style={styles.billedTo}>{invoice.billed_to_name}</Text>
          </View>

          <View style={styles.tableWrap}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.th, { flex: 3 }]}>ITEM DESCRIPTION</Text>
              <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>QTY</Text>
              <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>PRICE</Text>
              <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>TOTAL</Text>
            </View>
            {lineItems.map((li, i) =>
              li.quantity === 0 ? (
                // Informational row — e.g. "Lunches - provided by parents" — matches the real
                // invoice template's blank qty/price/total cells, not a charge of zero.
                <View key={i} style={styles.tr}>
                  <Text style={[styles.td, { flex: 6 }]}>{li.description}</Text>
                </View>
              ) : (
                <View key={i} style={styles.tr}>
                  <Text style={[styles.td, { flex: 3 }]}>{li.description}</Text>
                  <Text style={[styles.td, { flex: 1, textAlign: 'center' }]}>{li.quantity}</Text>
                  <Text style={[styles.td, { flex: 1, textAlign: 'right' }]}>{formatMoney(li.unit_price, invoice.currency)}</Text>
                  <Text style={[styles.td, { flex: 1, textAlign: 'right' }]}>{formatMoney(li.line_total, invoice.currency)}</Text>
                </View>
              )
            )}
          </View>

          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text>Subtotal</Text>
              <Text>{formatMoney(invoice.subtotal_amount, invoice.currency)}</Text>
            </View>
            {invoice.sibling_discount_amount > 0 && (
              <View style={styles.totalsRow}>
                <Text>Sibling Discount</Text>
                <Text>-{formatMoney(invoice.sibling_discount_amount, invoice.currency)}</Text>
              </View>
            )}
            <View style={[styles.totalsRow, { marginTop: 6, borderTopWidth: 1, borderTopColor: BRAND_COLORS.sand, paddingTop: 6 }]}>
              <Text style={{ fontWeight: 700 }}>TOTAL</Text>
              <Text style={{ fontWeight: 700 }}>{formatMoney(invoice.total_amount, invoice.currency)}</Text>
            </View>
          </View>

          <View style={styles.bottomRow}>
            <View style={styles.notesBox}>
              <Text style={styles.sectionLabel}>NOTES:</Text>
              <Text style={{ fontSize: 8, lineHeight: 1.5, color: BRAND_COLORS.inkSoft }}>
                Due date {formatDateLabel(invoice.due_date)}. Price is listed in {invoice.currency === 'IDR' ? 'Indonesian Rupiah' : invoice.currency}.
                {'\n'}Bank Name : {settings.bank_name}
                {'\n'}Account Number : {settings.account_number}
                {'\n'}Account Name : {settings.account_name}
                {settings.bank_address ? `\nAddress : ${settings.bank_address}` : ''}
                {'\n'}SWIFT Code : {settings.swift_code}
                {settings.bank_code ? `\nBank Code : ${settings.bank_code}` : ''}
                {settings.branch_code ? `\nBranch Code : ${settings.branch_code}` : ''}
                {settings.clearing_code ? `\nClearing Code : ${settings.clearing_code}` : ''}
                {invoice.notes ? `\n\n${invoice.notes}` : ''}
              </Text>
            </View>
            <View style={styles.qrBox} />
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
