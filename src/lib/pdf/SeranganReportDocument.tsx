import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { registerBrandFonts, BRAND_COLORS } from './fonts';
import type { SeranganReportData } from '@/lib/serangan';

registerBrandFonts();

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function formatIDR(n: number): string {
  return `Rp ${new Intl.NumberFormat('id-ID').format(Math.round(n))}`;
}

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
  schoolName: { fontFamily: 'Shadows Into Light', fontSize: 24, color: BRAND_COLORS.teal },
  docTitle: { fontSize: 12, fontWeight: 700, letterSpacing: 0.5, color: BRAND_COLORS.tealDeep, textTransform: 'uppercase' },
  docSubtitle: { fontSize: 9, color: BRAND_COLORS.inkSoft, marginTop: 2 },
  meta: { textAlign: 'right', marginTop: 4, fontSize: 9.5 },
  footer: {
    // No lineHeight here -- on this @react-pdf/renderer version, a `lineHeight` style on a
    // `fixed` absolutely-positioned View makes the whole View silently fail to render (confirmed
    // via a minimal repro; also reproduces on the existing BudgetReportDocument.tsx footer, which
    // uses the identical style and is apparently affected too).
    position: 'absolute',
    bottom: 16,
    left: 40,
    right: 40,
    fontSize: 7.5,
    color: BRAND_COLORS.inkSoft,
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.sand,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 4, flexWrap: 'wrap' },
  statBox: { flexGrow: 1, flexBasis: '22%', borderWidth: 1, borderColor: BRAND_COLORS.sand, borderRadius: 6, paddingVertical: 10, paddingHorizontal: 12 },
  statLabel: { fontSize: 7.5, color: BRAND_COLORS.inkSoft, textTransform: 'uppercase', letterSpacing: 0.4 },
  statValue: { fontSize: 15, fontWeight: 700, color: BRAND_COLORS.ink, marginTop: 3, fontVariantNumeric: 'tabular-nums' },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: BRAND_COLORS.tealDeep, marginTop: 20, marginBottom: 8 },
  sectionNote: { fontSize: 8, color: BRAND_COLORS.inkSoft, marginTop: -5, marginBottom: 8 },
  table: { borderWidth: 1, borderColor: BRAND_COLORS.sand, borderRadius: 6, overflow: 'hidden' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: BRAND_COLORS.teal },
  tableHeaderCell: { color: '#ffffff', fontWeight: 700, fontSize: 8.5, padding: 6 },
  tableRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#e5ded0' },
  tableRowAlt: { backgroundColor: BRAND_COLORS.cream },
  tableCell: { fontSize: 8.5, padding: 6, color: BRAND_COLORS.ink },
  tableCellNum: { fontSize: 8.5, padding: 6, color: BRAND_COLORS.ink, fontVariantNumeric: 'tabular-nums', textAlign: 'right' },
  totalRow: { flexDirection: 'row', backgroundColor: BRAND_COLORS.cream, borderTopWidth: 1, borderTopColor: BRAND_COLORS.teal },
  totalCell: { fontSize: 8.5, fontWeight: 700, padding: 6, color: BRAND_COLORS.ink },
  totalCellNum: { fontSize: 8.5, fontWeight: 700, padding: 6, color: BRAND_COLORS.ink, fontVariantNumeric: 'tabular-nums', textAlign: 'right' },
  campaignCard: { borderWidth: 1, borderColor: BRAND_COLORS.sand, borderRadius: 6, padding: 10, marginBottom: 6 },
  campaignTitle: { fontSize: 9.5, fontWeight: 700, color: BRAND_COLORS.ink },
  campaignStatus: { fontSize: 7.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: BRAND_COLORS.orangeDeep },
  campaignDesc: { fontSize: 8.5, color: BRAND_COLORS.inkSoft, marginTop: 2 },
});

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export function SeranganReportDocument({ report, generatedByLabel }: { report: SeranganReportData; generatedByLabel: string }) {
  const netThisPeriod = report.donationsTotal - report.expenditureTotal;
  const annualBudgetAmount = Number(report.annualBudget.budget_amount_idr);

  return (
    <Document title={`Serangan English School Report - ${report.periodLabel}`}>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.schoolName}>Serangan English School</Text>
            <Text style={styles.docSubtitle}>A Selong Bay School community programme, Serangan village</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>Activity Report</Text>
            <Text style={styles.meta}>{report.periodLabel}</Text>
            <Text style={styles.meta}>
              {formatDateLabel(report.periodStart)} – {formatDateLabel(report.periodEnd)}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatBox label="Sessions held" value={report.sessionsCount} />
          <StatBox label="Children reached (total)" value={report.totalChildrenAttendance} />
          <StatBox label="Avg. children / session" value={report.avgChildrenPerSession} />
          <StatBox label="Boys / Girls (est.)" value={`${report.totalBoys} / ${report.totalGirls}`} />
          <StatBox label="Donations received" value={formatIDR(report.donationsTotal)} />
          <StatBox label="Expenditure" value={formatIDR(report.expenditureTotal)} />
          <StatBox label="Net this period" value={formatIDR(netThisPeriod)} />
          <StatBox label={`${report.periodStart.slice(0, 4)} annual budget`} value={formatIDR(annualBudgetAmount)} />
        </View>

        <Text style={styles.sectionTitle}>Weekly sessions</Text>
        {report.entries.length > 0 ? (
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, { flex: 1.1 }]}>Date</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Activity</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Children</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Boys/Girls</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Staff / visitors</Text>
            </View>
            {report.entries.map((e, i) => (
              <View key={e.id} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCell, { flex: 1.1 }]}>{formatDateLabel(e.entry_date)}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{e.activity}</Text>
                <Text style={[styles.tableCellNum, { flex: 1 }]}>{e.children_count ?? '—'}</Text>
                <Text style={[styles.tableCellNum, { flex: 1 }]}>
                  {e.boys_estimate ?? '—'}/{e.girls_estimate ?? '—'}
                </Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>
                  {[e.staff_present, e.visitors_present].filter(Boolean).join(' · ') || '—'}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.sectionNote}>No sessions logged for this period.</Text>
        )}

        <Text style={styles.sectionTitle}>Donations</Text>
        {report.donations.length > 0 ? (
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, { flex: 1.1 }]}>Date</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Donor</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Amount</Text>
            </View>
            {report.donations.map((d, i) => (
              <View key={d.id} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCell, { flex: 1.1 }]}>{formatDateLabel(d.donation_date)}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{d.donor_name || 'Anonymous'}</Text>
                <Text style={[styles.tableCellNum, { flex: 1 }]}>{formatIDR(Number(d.amount_idr))}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={[styles.totalCell, { flex: 3.1 }]}>Total</Text>
              <Text style={[styles.totalCellNum, { flex: 1 }]}>{formatIDR(report.donationsTotal)}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.sectionNote}>No donations recorded for this period.</Text>
        )}

        <Text style={styles.sectionTitle}>Expenditure</Text>
        {report.expenditures.length > 0 ? (
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, { flex: 1.1 }]}>Date</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Category</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Description</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Amount</Text>
            </View>
            {report.expenditures.map((e, i) => (
              <View key={e.id} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCell, { flex: 1.1 }]}>{formatDateLabel(e.expense_date)}</Text>
                <Text style={[styles.tableCell, { flex: 1.2 }]}>{e.category || '—'}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{e.description}</Text>
                <Text style={[styles.tableCellNum, { flex: 1 }]}>{formatIDR(Number(e.amount_idr))}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={[styles.totalCell, { flex: 4.3 }]}>Total</Text>
              <Text style={[styles.totalCellNum, { flex: 1 }]}>{formatIDR(report.expenditureTotal)}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.sectionNote}>No expenditure recorded for this period.</Text>
        )}

        <Text style={styles.sectionTitle}>Campaigns active in this period</Text>
        {report.campaigns.length > 0 ? (
          report.campaigns.map((c) => (
            <View key={c.id} style={styles.campaignCard} wrap={false}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.campaignTitle}>{c.title}</Text>
                <Text style={styles.campaignStatus}>{c.status}</Text>
              </View>
              {c.description && <Text style={styles.campaignDesc}>{c.description}</Text>}
            </View>
          ))
        ) : (
          <Text style={styles.sectionNote}>No campaigns active in this period.</Text>
        )}

        <View style={styles.footer} fixed>
          <Text>Prepared by {generatedByLabel} on {formatDateLabel(new Date().toISOString().slice(0, 10))}. Figures are drawn directly from the Serangan English School dashboard.</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
