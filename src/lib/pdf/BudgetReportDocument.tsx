import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { registerBrandFonts, BRAND_COLORS } from './fonts';
import type { BudgetReportData } from '../budget';

registerBrandFonts();

function formatMoney(amount: number): string {
  return `Rp ${new Intl.NumberFormat('en-US').format(Math.round(amount))}`;
}

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

// Header/footer are `fixed` (repeat on every page, never shift with content flow) -- the Page's
// own paddingTop/paddingBottom below reserve real space matching their rendered heights so normal
// body content never renders underneath them on a report that spills onto a second page. Same
// pattern as LearningProfileDocument.tsx, verified there against pdfjs-dist across multi-page
// stress tests.
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
  statBox: { flex: 1, borderWidth: 1, borderColor: BRAND_COLORS.sand, borderRadius: 6, paddingVertical: 10, paddingHorizontal: 12 },
  statLabel: { fontSize: 7.5, color: BRAND_COLORS.inkSoft, textTransform: 'uppercase', letterSpacing: 0.4 },
  statValue: { fontSize: 13, fontWeight: 700, color: BRAND_COLORS.ink, marginTop: 3, fontVariantNumeric: 'tabular-nums' },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: BRAND_COLORS.tealDeep, marginTop: 22, marginBottom: 8 },
  table: { borderWidth: 1, borderColor: BRAND_COLORS.sand, borderRadius: 6, overflow: 'hidden' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: BRAND_COLORS.teal },
  tableHeaderCell: { color: '#ffffff', fontWeight: 700, fontSize: 8.5, padding: 7 },
  tableRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#e5ded0' },
  tableRowAlt: { backgroundColor: BRAND_COLORS.cream },
  tableCell: { fontSize: 9, padding: 7, color: BRAND_COLORS.ink },
  tableCellNum: { fontSize: 9, padding: 7, color: BRAND_COLORS.ink, fontVariantNumeric: 'tabular-nums', textAlign: 'right' },
  tableCellNegative: { color: '#b91c1c' },
  totalRow: { flexDirection: 'row', backgroundColor: BRAND_COLORS.cream, borderTopWidth: 1, borderTopColor: BRAND_COLORS.teal },
  totalCell: { fontSize: 9, fontWeight: 700, padding: 7, color: BRAND_COLORS.ink },
  totalCellNum: { fontSize: 9, fontWeight: 700, padding: 7, color: BRAND_COLORS.ink, fontVariantNumeric: 'tabular-nums', textAlign: 'right' },
});

function StatBox({ label, value, negative }: { label: string; value: string; negative?: boolean }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, negative ? styles.tableCellNegative : {}]}>{value}</Text>
    </View>
  );
}

export function BudgetReportDocument({ report, generatedByLabel }: { report: BudgetReportData; generatedByLabel: string }) {
  const showBudgetColumn = report.kind === 'month';
  const totalSpent = report.categories.reduce((sum, c) => sum + c.spentIdr, 0);
  const totalBudgeted = showBudgetColumn ? report.categories.reduce((sum, c) => sum + (c.monthlyBudgetIdr ?? 0), 0) : 0;

  return (
    <Document title={`Financial Report - ${report.periodLabel}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.schoolName}>Selong Bay School</Text>
            <Text style={styles.docSubtitle}>Financial report prepared for the Yayasan board</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>{report.kind === 'month' ? 'Monthly Report' : 'Term Report'}</Text>
            <Text style={styles.meta}>{report.periodLabel}</Text>
            <Text style={styles.meta}>
              {formatDateLabel(report.periodStart)} – {formatDateLabel(report.periodEnd)}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatBox label="Opening balance" value={formatMoney(report.openingBalanceIdr)} />
          <StatBox label="Revenue" value={formatMoney(report.revenueIdr)} />
          <StatBox label="Expenses" value={formatMoney(report.expensesIdr)} />
          <StatBox label="Net" value={formatMoney(report.netIdr)} negative={report.netIdr < 0} />
          <StatBox label="Closing balance" value={formatMoney(report.closingBalanceIdr)} />
        </View>

        <Text style={styles.sectionTitle}>Revenue by method</Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Method</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Amount</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 1 }]}>Bank transfer</Text>
            <Text style={[styles.tableCellNum, { flex: 1 }]}>{formatMoney(report.bankTransferIdr)}</Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowAlt]}>
            <Text style={[styles.tableCell, { flex: 1 }]}>Cash</Text>
            <Text style={[styles.tableCellNum, { flex: 1 }]}>{formatMoney(report.cashIdr)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Expenses by category</Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Category</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Spent</Text>
            {showBudgetColumn && (
              <>
                <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Budgeted</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Remaining</Text>
              </>
            )}
          </View>
          {report.categories.map((c, i) => {
            const remaining = showBudgetColumn ? (c.monthlyBudgetIdr ?? 0) - c.spentIdr : 0;
            return (
              <View key={c.categoryName} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCell, { flex: 2 }]}>{c.categoryName}</Text>
                <Text style={[styles.tableCellNum, { flex: 1 }]}>{formatMoney(c.spentIdr)}</Text>
                {showBudgetColumn && (
                  <>
                    <Text style={[styles.tableCellNum, { flex: 1 }]}>{formatMoney(c.monthlyBudgetIdr ?? 0)}</Text>
                    <Text style={[styles.tableCellNum, { flex: 1 }, remaining < 0 ? styles.tableCellNegative : {}]}>{formatMoney(remaining)}</Text>
                  </>
                )}
              </View>
            );
          })}
          {report.categories.length === 0 && (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1 }]}>No categories.</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={[styles.totalCell, { flex: 2 }]}>Total</Text>
            <Text style={[styles.totalCellNum, { flex: 1 }]}>{formatMoney(totalSpent)}</Text>
            {showBudgetColumn && (
              <>
                <Text style={[styles.totalCellNum, { flex: 1 }]}>{formatMoney(totalBudgeted)}</Text>
                <Text style={[styles.totalCellNum, { flex: 1 }]}>{formatMoney(totalBudgeted - totalSpent)}</Text>
              </>
            )}
          </View>
        </View>

        {report.kind === 'term' && report.monthlyBreakdown.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Month by month</Text>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Month</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Revenue</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Expenses</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Net</Text>
              </View>
              {report.monthlyBreakdown.map((m, i) => (
                <View key={m.label} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{m.label}</Text>
                  <Text style={[styles.tableCellNum, { flex: 1 }]}>{formatMoney(m.revenueIdr)}</Text>
                  <Text style={[styles.tableCellNum, { flex: 1 }]}>{formatMoney(m.expensesIdr)}</Text>
                  <Text style={[styles.tableCellNum, { flex: 1 }, m.netIdr < 0 ? styles.tableCellNegative : {}]}>{formatMoney(m.netIdr)}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.footer} fixed>
          <Text>Prepared by {generatedByLabel} on {formatDateLabel(report.generatedAt.slice(0, 10))}. Figures are drawn directly from the Budget Tracker.</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
