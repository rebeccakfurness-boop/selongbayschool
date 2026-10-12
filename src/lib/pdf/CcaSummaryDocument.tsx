import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { registerBrandFonts, BRAND_COLORS } from './fonts';
import type { CcaSummaryReportData } from '../cca';

registerBrandFonts();

function formatMoney(amount: number): string {
  return `Rp ${new Intl.NumberFormat('en-US').format(Math.round(amount))}`;
}

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

// Same fixed header/footer pagination pattern as BudgetReportDocument.tsx / SchoolReportDocument.tsx.
const HEADER_HEIGHT = 92;
const FOOTER_HEIGHT = 40;

const styles = StyleSheet.create({
  page: { paddingTop: HEADER_HEIGHT, paddingBottom: FOOTER_HEIGHT, paddingHorizontal: 40, fontFamily: 'Nunito Sans', fontSize: 10, color: BRAND_COLORS.ink, backgroundColor: BRAND_COLORS.paper },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    paddingHorizontal: 40,
    paddingTop: 28,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.sand,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  schoolName: { fontFamily: 'Shadows Into Light', fontSize: 26, color: BRAND_COLORS.teal },
  docTitle: { fontSize: 12, fontWeight: 700, letterSpacing: 0.5, color: BRAND_COLORS.tealDeep, textTransform: 'uppercase' },
  docSubtitle: { fontSize: 9, color: BRAND_COLORS.inkSoft, marginTop: 2 },
  meta: { textAlign: 'right', marginTop: 4, fontSize: 9.5 },
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 40,
    right: 40,
    fontSize: 7.5,
    color: BRAND_COLORS.inkSoft,
    lineHeight: 1.4,
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.sand,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  statBox: { flexGrow: 1, flexBasis: '30%', borderWidth: 1, borderColor: BRAND_COLORS.sand, borderRadius: 6, paddingVertical: 10, paddingHorizontal: 12 },
  statLabel: { fontSize: 7.5, color: BRAND_COLORS.inkSoft, textTransform: 'uppercase', letterSpacing: 0.4 },
  statValue: { fontSize: 15, fontWeight: 700, color: BRAND_COLORS.ink, marginTop: 3, fontVariantNumeric: 'tabular-nums' },
  table: { marginTop: 18, borderWidth: 1, borderColor: BRAND_COLORS.sand, borderRadius: 6, overflow: 'hidden' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: BRAND_COLORS.teal },
  tableHeaderCell: { color: '#ffffff', fontWeight: 700, fontSize: 8.5, padding: 7 },
  tableRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#e5ded0' },
  tableRowAlt: { backgroundColor: BRAND_COLORS.cream },
  tableCell: { fontSize: 9, padding: 7, color: BRAND_COLORS.ink },
  tableCellItems: { fontSize: 8.5, padding: 7, color: BRAND_COLORS.ink, lineHeight: 1.5 },
  excludedNote: { color: BRAND_COLORS.inkSoft },
  tableCellNum: { fontSize: 9, padding: 7, color: BRAND_COLORS.ink, fontVariantNumeric: 'tabular-nums', textAlign: 'right' },
  statusPill: { fontSize: 7.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 },
  totalRow: { flexDirection: 'row', backgroundColor: BRAND_COLORS.cream, borderTopWidth: 1, borderTopColor: BRAND_COLORS.teal },
  totalCell: { fontSize: 9, fontWeight: 700, padding: 7, color: BRAND_COLORS.ink },
  totalCellNum: { fontSize: 9, fontWeight: 700, padding: 7, color: BRAND_COLORS.ink, fontVariantNumeric: 'tabular-nums', textAlign: 'right' },
});

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export function CcaSummaryDocument({ report, generatedByLabel }: { report: CcaSummaryReportData; generatedByLabel: string }) {
  return (
    <Document title={`CCA Submissions Summary - ${report.termLabel}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.schoolName}>Selong Bay School</Text>
            <Text style={styles.docSubtitle}>Co-Curricular Activities submissions summary</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>CCA Summary</Text>
            <Text style={styles.meta}>{report.termLabel}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatBox label="Students who submitted" value={report.studentCount} />
          <StatBox label="Total CCA revenue" value={formatMoney(report.grandTotalIdr)} />
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Student</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Status</Text>
            <Text style={[styles.tableHeaderCell, { flex: 4 }]}>CCAs signed up to</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Cost</Text>
          </View>
          {report.children.map((c, i) => (
            <View key={c.child_id} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.tableCell, { flex: 2 }]}>{c.child_full_name}</Text>
              <Text style={[styles.tableCell, { flex: 1, textTransform: 'capitalize' }]}>{c.status}</Text>
              <View style={{ flex: 4, padding: 7 }}>
                {c.items.length === 0 ? (
                  <Text style={[styles.tableCellItems, styles.excludedNote, { padding: 0 }]}>Nothing selected</Text>
                ) : (
                  c.items.map((item, j) => (
                    <Text key={j} style={[styles.tableCellItems, { padding: 0, marginBottom: j < c.items.length - 1 ? 2 : 0 }, item.excluded_at_invoicing ? styles.excludedNote : {}]}>
                      {item.cca_name}
                      {item.option_name ? ` - ${item.option_name}` : ''} ({formatMoney(item.price_idr)})
                      {item.excluded_at_invoicing ? ' - not running, excluded' : ''}
                    </Text>
                  ))
                )}
              </View>
              <Text style={[styles.tableCellNum, { flex: 1 }]}>{formatMoney(c.total_amount_idr)}</Text>
            </View>
          ))}
          {report.children.length === 0 && (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1 }]}>No submissions yet for this term.</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={[styles.totalCell, { flex: 3 }]}>Total</Text>
            <Text style={[styles.totalCell, { flex: 4 }]} />
            <Text style={[styles.totalCellNum, { flex: 1 }]}>{formatMoney(report.grandTotalIdr)}</Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text>Prepared by {generatedByLabel} on {formatDateLabel(report.generatedAt.slice(0, 10))}. Cost excludes any CCA excluded for not meeting the minimum student count.</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
