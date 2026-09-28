import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { registerBrandFonts, BRAND_COLORS } from './fonts';

registerBrandFonts();

export interface PayslipData {
  staffName: string;
  positionTitle: string | null;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  workingDays: number;
  daysPresent: number;
  basicSalary: number;
  housingAllowance: number;
  grossSalary: number;
  jhtEmployeeDeduction: number;
  jpEmployeeDeduction: number;
  pph21Deduction: number;
  loanDeduction: number;
  takeHomePay: number;
  jhtEmployerContribution: number;
  jpEmployerContribution: number;
  jkmEmployerContribution: number;
  jkkEmployerContribution: number;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
}

function formatMoney(amount: number): string {
  return `Rp ${new Intl.NumberFormat('id-ID').format(Math.round(amount))}`;
}

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Nunito Sans', fontSize: 10, color: BRAND_COLORS.ink, backgroundColor: BRAND_COLORS.paper },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  schoolName: { fontFamily: 'Shadows Into Light', fontSize: 32, color: BRAND_COLORS.teal },
  docTitle: { fontSize: 12, fontWeight: 700, letterSpacing: 0.5, color: BRAND_COLORS.tealDeep, textTransform: 'uppercase' },
  meta: { textAlign: 'right', marginTop: 6, fontSize: 10 },
  staffBlock: { marginTop: 24 },
  staffName: { fontSize: 14, fontWeight: 700, color: BRAND_COLORS.ink },
  staffSub: { fontSize: 9.5, color: BRAND_COLORS.inkSoft, marginTop: 2 },
  attendanceRow: { flexDirection: 'row', gap: 24, marginTop: 14 },
  attendanceBox: { borderWidth: 1, borderColor: BRAND_COLORS.sand, borderRadius: 6, paddingVertical: 8, paddingHorizontal: 14 },
  attendanceLabel: { fontSize: 8, color: BRAND_COLORS.inkSoft, textTransform: 'uppercase', letterSpacing: 0.5 },
  attendanceValue: { fontSize: 14, fontWeight: 700, color: BRAND_COLORS.ink, marginTop: 2 },
  columns: { flexDirection: 'row', marginTop: 20, gap: 16 },
  column: { flex: 1, borderWidth: 1, borderColor: BRAND_COLORS.sand, borderRadius: 6, overflow: 'hidden' },
  columnHeader: { backgroundColor: BRAND_COLORS.teal, color: '#ffffff', fontWeight: 700, fontSize: 9, padding: 8 },
  line: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#e5ded0' },
  lineLabel: { fontSize: 9.5 },
  lineValue: { fontSize: 9.5, fontVariantNumeric: 'tabular-nums' },
  totalLine: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 8, backgroundColor: BRAND_COLORS.cream },
  totalLabel: { fontSize: 9.5, fontWeight: 700 },
  totalValue: { fontSize: 9.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums' },
  takeHomeBox: { marginTop: 20, borderWidth: 1, borderColor: BRAND_COLORS.teal, borderRadius: 6, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: BRAND_COLORS.cream },
  takeHomeLabel: { fontSize: 11, fontWeight: 700, color: BRAND_COLORS.tealDeep },
  takeHomeValue: { fontSize: 18, fontWeight: 800, color: BRAND_COLORS.tealDeep },
  bottomRow: { flexDirection: 'row', marginTop: 20, gap: 16 },
  bankBox: { flex: 1 },
  sectionLabel: { fontSize: 9, fontWeight: 700, letterSpacing: 0.5, color: BRAND_COLORS.ink, marginBottom: 4 },
  bankLine: { fontSize: 9.5, color: BRAND_COLORS.ink },
  keyBox: { flex: 1, borderWidth: 1, borderColor: BRAND_COLORS.sand, borderRadius: 6, backgroundColor: BRAND_COLORS.cream, padding: 10 },
  keyLine: { flexDirection: 'row', fontSize: 8.5, color: BRAND_COLORS.inkSoft, marginTop: 2 },
  keyAbbr: { width: 46, fontWeight: 700, color: BRAND_COLORS.ink },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    fontSize: 7.5,
    color: BRAND_COLORS.inkSoft,
    lineHeight: 1.4,
  },
});

export function PayslipDocument({ payslip }: { payslip: PayslipData }) {
  const totalDeductions = payslip.jhtEmployeeDeduction + payslip.jpEmployeeDeduction + payslip.pph21Deduction + payslip.loanDeduction;
  const totalEmployerContributions =
    payslip.jhtEmployerContribution + payslip.jpEmployerContribution + payslip.jkmEmployerContribution + payslip.jkkEmployerContribution;

  return (
    <Document title={`Payslip - ${payslip.staffName} - ${payslip.periodLabel}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.topRow}>
          <Text style={styles.schoolName}>Selong Bay School</Text>
          <View>
            <Text style={styles.docTitle}>Payslip</Text>
            <Text style={styles.meta}>Period: {payslip.periodLabel}</Text>
            <Text style={styles.meta}>
              {formatDateLabel(payslip.periodStart)} – {formatDateLabel(payslip.periodEnd)}
            </Text>
          </View>
        </View>

        <View style={styles.staffBlock}>
          <Text style={styles.staffName}>{payslip.staffName}</Text>
          {payslip.positionTitle && <Text style={styles.staffSub}>{payslip.positionTitle}</Text>}
        </View>

        <View style={styles.attendanceRow}>
          <View style={styles.attendanceBox}>
            <Text style={styles.attendanceLabel}>Working Days</Text>
            <Text style={styles.attendanceValue}>{payslip.workingDays}</Text>
          </View>
          <View style={styles.attendanceBox}>
            <Text style={styles.attendanceLabel}>Days Present</Text>
            <Text style={styles.attendanceValue}>{payslip.daysPresent}</Text>
          </View>
        </View>

        <View style={styles.columns}>
          <View style={styles.column}>
            <Text style={styles.columnHeader}>EARNINGS</Text>
            <View style={[styles.line, { borderTopWidth: 0 }]}>
              <Text style={styles.lineLabel}>Basic Salary</Text>
              <Text style={styles.lineValue}>{formatMoney(payslip.basicSalary)}</Text>
            </View>
            <View style={styles.line}>
              <Text style={styles.lineLabel}>Housing Allowance</Text>
              <Text style={styles.lineValue}>{formatMoney(payslip.housingAllowance)}</Text>
            </View>
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Gross Salary</Text>
              <Text style={styles.totalValue}>{formatMoney(payslip.grossSalary)}</Text>
            </View>
          </View>

          <View style={styles.column}>
            <Text style={styles.columnHeader}>DEDUCTIONS</Text>
            <View style={[styles.line, { borderTopWidth: 0 }]}>
              <Text style={styles.lineLabel}>BPJS JHT (2%)</Text>
              <Text style={styles.lineValue}>-{formatMoney(payslip.jhtEmployeeDeduction)}</Text>
            </View>
            <View style={styles.line}>
              <Text style={styles.lineLabel}>BPJS JP (1%)</Text>
              <Text style={styles.lineValue}>-{formatMoney(payslip.jpEmployeeDeduction)}</Text>
            </View>
            <View style={styles.line}>
              <Text style={styles.lineLabel}>PPh 21 Deduction</Text>
              <Text style={styles.lineValue}>-{formatMoney(payslip.pph21Deduction)}</Text>
            </View>
            <View style={styles.line}>
              <Text style={styles.lineLabel}>Loan / Cashbon</Text>
              <Text style={styles.lineValue}>-{formatMoney(payslip.loanDeduction)}</Text>
            </View>
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Total Deductions</Text>
              <Text style={styles.totalValue}>-{formatMoney(totalDeductions)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.takeHomeBox}>
          <Text style={styles.takeHomeLabel}>TAKE HOME PAY</Text>
          <Text style={styles.takeHomeValue}>{formatMoney(payslip.takeHomePay)}</Text>
        </View>

        <View style={styles.columns}>
          <View style={[styles.column, { flex: 1 }]}>
            <Text style={styles.columnHeader}>COMPANY CONTRIBUTIONS (not deducted from pay)</Text>
            <View style={[styles.line, { borderTopWidth: 0 }]}>
              <Text style={styles.lineLabel}>BPJS JHT (Employer)</Text>
              <Text style={styles.lineValue}>{formatMoney(payslip.jhtEmployerContribution)}</Text>
            </View>
            <View style={styles.line}>
              <Text style={styles.lineLabel}>BPJS JP (Employer)</Text>
              <Text style={styles.lineValue}>{formatMoney(payslip.jpEmployerContribution)}</Text>
            </View>
            <View style={styles.line}>
              <Text style={styles.lineLabel}>BPJS JKM</Text>
              <Text style={styles.lineValue}>{formatMoney(payslip.jkmEmployerContribution)}</Text>
            </View>
            <View style={styles.line}>
              <Text style={styles.lineLabel}>BPJS JKK</Text>
              <Text style={styles.lineValue}>{formatMoney(payslip.jkkEmployerContribution)}</Text>
            </View>
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Total Company Contributions</Text>
              <Text style={styles.totalValue}>{formatMoney(totalEmployerContributions)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.bankBox}>
            <Text style={styles.sectionLabel}>PAID TO</Text>
            {payslip.bankName || payslip.bankAccountNumber || payslip.bankAccountName ? (
              <>
                <Text style={styles.bankLine}>Bank Name : {payslip.bankName ?? '—'}</Text>
                <Text style={styles.bankLine}>Account Number : {payslip.bankAccountNumber ?? '—'}</Text>
                <Text style={styles.bankLine}>Account Name : {payslip.bankAccountName ?? '—'}</Text>
              </>
            ) : (
              <Text style={styles.bankLine}>No bank account on file.</Text>
            )}
          </View>

          <View style={styles.keyBox}>
            <Text style={styles.sectionLabel}>KEY</Text>
            <View style={styles.keyLine}>
              <Text style={styles.keyAbbr}>JHT</Text>
              <Text>Jaminan Hari Tua (old-age security)</Text>
            </View>
            <View style={styles.keyLine}>
              <Text style={styles.keyAbbr}>JP</Text>
              <Text>Jaminan Pensiun (pension)</Text>
            </View>
            <View style={styles.keyLine}>
              <Text style={styles.keyAbbr}>JKM</Text>
              <Text>Jaminan Kematian (death insurance)</Text>
            </View>
            <View style={styles.keyLine}>
              <Text style={styles.keyAbbr}>JKK</Text>
              <Text>Jaminan Kecelakaan Kerja (work accident insurance)</Text>
            </View>
            <View style={styles.keyLine}>
              <Text style={styles.keyAbbr}>PPh 21</Text>
              <Text>Pajak Penghasilan Pasal 21 (income tax withholding)</Text>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>
          This payslip is confidential and intended solely for the named staff member. Figures are calculated by the Selong Bay School
          administration; please raise any query with the school office.
        </Text>
      </Page>
    </Document>
  );
}
