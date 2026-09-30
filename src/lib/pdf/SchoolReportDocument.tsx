import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { registerBrandFonts, BRAND_COLORS } from './fonts';
import type { SchoolReportData } from '../school-report';

registerBrandFonts();

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

// Same fixed header/footer pagination pattern as BudgetReportDocument.tsx / LearningProfileDocument.tsx.
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
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 4, flexWrap: 'wrap' },
  statBox: { flexGrow: 1, flexBasis: '18%', borderWidth: 1, borderColor: BRAND_COLORS.sand, borderRadius: 6, paddingVertical: 10, paddingHorizontal: 12 },
  statLabel: { fontSize: 7.5, color: BRAND_COLORS.inkSoft, textTransform: 'uppercase', letterSpacing: 0.4 },
  statValue: { fontSize: 15, fontWeight: 700, color: BRAND_COLORS.ink, marginTop: 3, fontVariantNumeric: 'tabular-nums' },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: BRAND_COLORS.tealDeep, marginTop: 20, marginBottom: 8 },
  sectionNote: { fontSize: 8, color: BRAND_COLORS.inkSoft, marginTop: -5, marginBottom: 8 },
  columns: { flexDirection: 'row', gap: 16 },
  column: { flex: 1 },
  table: { borderWidth: 1, borderColor: BRAND_COLORS.sand, borderRadius: 6, overflow: 'hidden' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: BRAND_COLORS.teal },
  tableHeaderCell: { color: '#ffffff', fontWeight: 700, fontSize: 8.5, padding: 7 },
  tableRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#e5ded0' },
  tableRowAlt: { backgroundColor: BRAND_COLORS.cream },
  tableCell: { fontSize: 9, padding: 7, color: BRAND_COLORS.ink },
  tableCellNum: { fontSize: 9, padding: 7, color: BRAND_COLORS.ink, fontVariantNumeric: 'tabular-nums', textAlign: 'right' },
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

function BreakdownTable({ title, rows, total }: { title: string; rows: { label: string; count: number }[]; total: number }) {
  return (
    <View style={styles.column}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.table}>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Type</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Count</Text>
        </View>
        {rows.map((r, i) => (
          <View key={r.label} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
            <Text style={[styles.tableCell, { flex: 2 }]}>{r.label}</Text>
            <Text style={[styles.tableCellNum, { flex: 1 }]}>{r.count}</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={[styles.totalCell, { flex: 2 }]}>Total</Text>
          <Text style={[styles.totalCellNum, { flex: 1 }]}>{total}</Text>
        </View>
      </View>
    </View>
  );
}

export function SchoolReportDocument({ report, generatedByLabel }: { report: SchoolReportData; generatedByLabel: string }) {
  return (
    <Document title={`School Operations Report - ${report.periodLabel}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.schoolName}>Selong Bay School</Text>
            <Text style={styles.docSubtitle}>School operations report prepared for the Yayasan board</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>Operations Report</Text>
            <Text style={styles.meta}>{report.periodLabel}</Text>
            <Text style={styles.meta}>
              {formatDateLabel(report.periodStart)} – {formatDateLabel(report.periodEnd)}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatBox label="New enquiries" value={report.enquiriesTotal} />
          <StatBox label="New admissions leads" value={report.admissionsLeadsTotal} />
          <StatBox label="New bookings" value={report.newBookingsCount} />
          <StatBox label="New students enrolled" value={report.newEnrolmentsCount} />
          <StatBox label="Active students (now)" value={report.activeStudentsTotal} />
        </View>

        <View style={[styles.columns, { marginTop: 4 }]}>
          <BreakdownTable title="Website enquiries by type" rows={report.enquiriesByType} total={report.enquiriesTotal} />
          <BreakdownTable title="Admissions leads by source" rows={report.admissionsLeadsBySource} total={report.admissionsLeadsTotal} />
        </View>
        <Text style={styles.sectionNote}>
          Of the {report.admissionsLeadsTotal} admissions lead{report.admissionsLeadsTotal === 1 ? '' : 's'} logged this period,{' '}
          {report.admissionsLeadsConvertedTotal} ha{report.admissionsLeadsConvertedTotal === 1 ? 's' : 've'} converted to an enrolled student so far.
        </Text>

        <Text style={styles.sectionTitle}>New students enrolled this period</Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Student</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Class</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Enrolment date</Text>
          </View>
          {report.newEnrolments.map((e, i) => (
            <View key={`${e.childFullName}-${e.enrolmentDate}`} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.tableCell, { flex: 2 }]}>{e.childFullName}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>{e.className ?? '—'}</Text>
              <Text style={[styles.tableCellNum, { flex: 1 }]}>{formatDateLabel(e.enrolmentDate)}</Text>
            </View>
          ))}
          {report.newEnrolments.length === 0 && (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1 }]}>No new enrolments this period.</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Active students by year group (today)</Text>
        <Text style={styles.sectionNote}>
          A live snapshot as of the date this report was generated, not specific to the period above -- enrolment status has no
          historical record to reconstruct a past date from.
        </Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Year group</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Students</Text>
          </View>
          {report.activeStudentsByClassBand.map((r, i) => (
            <View key={r.label} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.tableCell, { flex: 2 }]}>{r.label}</Text>
              <Text style={[styles.tableCellNum, { flex: 1 }]}>{r.count}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={[styles.totalCell, { flex: 2 }]}>Total</Text>
            <Text style={[styles.totalCellNum, { flex: 1 }]}>{report.activeStudentsTotal}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Staff</Text>
        <Text style={styles.tableCell}>{report.newStaffCount} new staff member{report.newStaffCount === 1 ? '' : 's'} started this period.</Text>

        <View style={styles.footer} fixed>
          <Text>Prepared by {generatedByLabel} on {formatDateLabel(report.generatedAt.slice(0, 10))}. Figures are drawn directly from the school platform.</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
