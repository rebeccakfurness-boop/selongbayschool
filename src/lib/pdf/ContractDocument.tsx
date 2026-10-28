import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { registerBrandFonts, BRAND_COLORS } from './fonts';
import { LOGO_PNG_BUFFER } from './assets';

registerBrandFonts();

export interface ContractSignatureData {
  signedByName: string;
  signatureDataUrl: string;
  signedAt: string;
}

export interface ContractData {
  employeeName: string;
  positionTitle: string;
  roleSummary: string | null;
  targetGroup: string | null;
  workDays: string | null;
  workingHoursPerDay: string | null;
  salaryIdr: number;
  termEndDate: string;
  ktpNumber: string | null;
  employeeAddress: string | null;
  signedPlace: string | null;
  additionalTerms: string | null;
}

const styles = StyleSheet.create({
  page: { padding: 0, fontFamily: 'Nunito Sans', fontSize: 9.5, color: BRAND_COLORS.ink, backgroundColor: BRAND_COLORS.paper },
  body: { paddingHorizontal: 44, paddingTop: 36, paddingBottom: 28 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  logo: { width: 90, height: 71 },
  docTitleBlock: { alignItems: 'flex-end' },
  scriptTitle: { fontFamily: 'Shadows Into Light', fontSize: 24, color: BRAND_COLORS.teal },
  docSubtitle: { fontFamily: 'Telex', fontSize: 11, color: BRAND_COLORS.tealDeep, marginTop: 2, textAlign: 'right' },
  centerTitle: { fontFamily: 'Telex', fontSize: 15, color: BRAND_COLORS.tealDeep, textAlign: 'center', marginTop: 24 },
  intro: { fontSize: 9.5, lineHeight: 1.55, marginTop: 14 },
  partyBlock: { fontSize: 9.5, lineHeight: 1.55, marginTop: 10 },
  articleHeading: { fontFamily: 'Telex', fontSize: 11, color: BRAND_COLORS.tealDeep, marginTop: 16, marginBottom: 4 },
  paragraph: { fontSize: 9.5, lineHeight: 1.55, marginTop: 4 },
  bullet: { fontSize: 9.5, lineHeight: 1.5, marginTop: 2, marginLeft: 12 },
  signatureSection: { marginTop: 28 },
  signatureMeta: { fontSize: 9.5, lineHeight: 1.6, marginTop: 4 },
  signatureRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  signatureCol: { width: '45%' },
  signatureColLabel: { fontSize: 9, fontWeight: 700, color: BRAND_COLORS.inkSoft, textTransform: 'uppercase', letterSpacing: 0.4 },
  signatureImage: { width: 170, height: 64, objectFit: 'contain', marginTop: 28 },
  signatureLine: { width: 170, height: 1, backgroundColor: BRAND_COLORS.sand, marginTop: 58 },
  signatureName: { fontSize: 10.5, fontWeight: 700, marginTop: 6 },
  signatureSub: { fontSize: 8.5, color: BRAND_COLORS.inkSoft, marginTop: 1 },
  watermark: {
    position: 'absolute',
    top: 10,
    right: 44,
    fontSize: 8,
    fontWeight: 700,
    color: BRAND_COLORS.orangeDeep,
    letterSpacing: 1,
    textTransform: 'uppercase',
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
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${Number(d)} ${months[Number(m) - 1]} ${y}`;
}

function formatIDR(n: number): string {
  return `IDR ${new Intl.NumberFormat('id-ID').format(Math.round(n))}`;
}

function Article({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <View wrap={false}>
      <Text style={styles.articleHeading}>Article {n}: {title}</Text>
      {children}
    </View>
  );
}

export function ContractDocument({ data, signature }: { data: ContractData; signature: ContractSignatureData | null }) {
  const place = data.signedPlace || 'Serangan – Central Lombok, NTB';

  return (
    <Document title={`${data.employeeName} - Employment Agreement`}>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.body}>
          {signature && <Text style={styles.watermark}>Signed {formatDateLabel(signature.signedAt.slice(0, 10))}</Text>}

          <View style={styles.topRow}>
            <Image src={LOGO_PNG_BUFFER} style={styles.logo} />
            <View style={styles.docTitleBlock}>
              <Text style={styles.scriptTitle}>Selong Bay School</Text>
              <Text style={styles.docSubtitle}>Employment Agreement</Text>
            </View>
          </View>

          <Text style={styles.centerTitle}>FIXED-TERM EMPLOYMENT AGREEMENT</Text>
          <Text style={[styles.centerTitle, { fontSize: 10, marginTop: 2, fontFamily: 'Nunito Sans', color: BRAND_COLORS.inkSoft }]}>
            Perjanjian Kerja Waktu Tertentu (PKWT)
          </Text>

          <Text style={styles.intro}>
            This Fixed-Term Employment Agreement / Perjanjian Kerja Waktu Tertentu (PKWT) is made and entered into between the following
            parties:
          </Text>

          <Text style={styles.partyBlock}>
            1. SELONG BAY SEKOLAH, NPWP: 10.000.000.0-827.7446, a developing international school offering Early Years, Elementary and
            High School education, established under the laws of the Republic of Indonesia, located at Selong Bay, Serangan, Selong
            Belanak, Central Lombok, West Nusa Tenggara, Indonesia. Acting for and on behalf of the Yayasan Selong Bay Sekolah,
            hereinafter referred to as the FIRST PARTY (YAYASAN).
          </Text>
          <Text style={styles.partyBlock}>
            2. {data.employeeName}{data.ktpNumber ? `, holder of Identity Card / KTP No. ${data.ktpNumber}` : ''}
            {data.employeeAddress ? `, currently residing at ${data.employeeAddress}` : ''} (Employee), hereinafter referred to as the
            SECOND PARTY (EMPLOYEE).
          </Text>
          <Text style={styles.paragraph}>
            Both parties have agreed to enter into this Fixed-Term Employment Agreement (PKWT) under the following terms and conditions:
          </Text>

          <Article n={1} title="Term of Agreement">
            <Text style={styles.paragraph}>
              This agreement shall be valid until {formatDateLabel(data.termEndDate)}. The Employee agrees to provide valid supporting
              documents required by the School, including but not limited to:
            </Text>
            {['Passport / Identification Card', 'Educational Certificates', 'Teaching Qualifications', 'Police Clearance Certificate / SKCK', 'Health Certificate', 'Other documents required by Indonesian regulations'].map((item) => (
              <Text key={item} style={styles.bullet}>• {item}</Text>
            ))}
            <Text style={styles.paragraph}>Failure to provide valid documentation may affect the continuation of employment.</Text>
          </Article>

          <Article n={2} title="Position and Duties">
            <Text style={styles.paragraph}>
              The SECOND PARTY is employed by the FIRST PARTY as {data.positionTitle} at Selong Bay School. The duties and
              responsibilities of the SECOND PARTY include but are not limited to:
            </Text>
            {data.targetGroup && <Text style={styles.paragraph}>Target Group: {data.targetGroup}</Text>}
            {data.workDays && <Text style={styles.paragraph}>Days: {data.workDays}</Text>}
            {data.roleSummary && <Text style={styles.paragraph}>{data.roleSummary}</Text>}
          </Article>

          <Article n={3} title="Salary and Allowances">
            <Text style={styles.paragraph}>The SECOND PARTY&apos;s salary shall be {formatIDR(data.salaryIdr)} per month, paid at the end of the month.</Text>
            <Text style={styles.paragraph}>
              The Employee acknowledges and agrees that all matters relating to salary, compensation, benefits, and remuneration are
              strictly confidential. The Employee shall not disclose, discuss, or share any information regarding their salary or
              compensation package with any third party, including but not limited to other employees, staff members, external
              parties, or the public.
            </Text>
          </Article>

          <Article n={4} title="Working Hours and Leave">
            {data.workDays && <Text style={styles.paragraph}>The SECOND PARTY shall work {data.workDays}.</Text>}
            {data.workingHoursPerDay && <Text style={styles.paragraph}>The daily working hours are {data.workingHoursPerDay}.</Text>}
            <Text style={styles.paragraph}>All teachers will be expected to participate in school events, even when these take place outside their normal working hours.</Text>
          </Article>

          <Article n={5} title="Sick Leave and Absence">
            <Text style={styles.paragraph}>Absence due to illness must be supported by an official medical certificate issued by a licensed doctor, clinic, or hospital.</Text>
            <Text style={styles.paragraph}>Any absence without an official medical certificate shall be considered unauthorized leave.</Text>
          </Article>

          <Article n={6} title="Rights and Obligations">
            <Text style={styles.paragraph}>The SECOND PARTY shall comply with all school regulations, maintain confidentiality, and perform duties responsibly.</Text>
            <Text style={styles.paragraph}>The FIRST PARTY shall provide all rights of the SECOND PARTY in accordance with Indonesian labour laws.</Text>
          </Article>

          <Article n={7} title="Termination">
            <Text style={styles.paragraph}>
              The FIRST PARTY reserves the right to terminate this agreement at any time based on performance evaluation,
              disciplinary actions, operational requirements, or other valid reasons in accordance with the applicable laws of the
              Republic of Indonesia.
            </Text>
            <Text style={styles.paragraph}>The FIRST PARTY may terminate immediately during probation for underperformance or disciplinary issues.</Text>
            <Text style={styles.paragraph}>The SECOND PARTY who intends to resign must submit a written notice at least 3 (three) months in advance.</Text>
            <Text style={styles.paragraph}>
              Termination of employment (PHK) shall be governed under Law No. 13 of 2003 concerning Manpower, as amended by Law No. 11
              of 2020 concerning Job Creation, and Government Regulation No. 35 of 2021 concerning Fixed-Term Employment,
              Outsourcing, Working Hours, Rest Periods, and Termination of Employment.
            </Text>
          </Article>

          <Article n={8} title="Code of Conduct and Confidentiality">
            <Text style={styles.paragraph}>The SECOND PARTY must maintain professionalism, confidentiality, hygiene, and proper behaviour in all work-related activities.</Text>
            <Text style={styles.paragraph}>Disclosure or misuse of confidential school or guest information is strictly prohibited during and after employment.</Text>
            <Text style={styles.paragraph}>Violation of confidentiality may result in immediate termination and potential legal action.</Text>
          </Article>

          <Article n={9} title="Non-Solicitation">
            <Text style={styles.paragraph}>
              The SECOND PARTY agrees not to solicit or attempt to solicit any clients, guests, vendors, or other employees of the
              school for personal or competitive purposes during employment or within 12 months after termination of this Agreement.
            </Text>
          </Article>

          <Article n={10} title="Performance Evaluation">
            <Text style={styles.paragraph}>Performance shall be reviewed periodically. Continued employment is subject to satisfactory evaluation results.</Text>
          </Article>

          <Article n={11} title="Force Majeure">
            <Text style={styles.paragraph}>
              Neither party shall be liable for failure to perform obligations due to events beyond their reasonable control, such
              as natural disasters, government restrictions, war, or pandemics.
            </Text>
          </Article>

          <Article n={12} title="Dispute Resolution">
            <Text style={styles.paragraph}>Any disputes arising from this Agreement shall first be resolved amicably through discussion or mediation.</Text>
            <Text style={styles.paragraph}>If unresolved, the matter shall be referred to the Manpower Office (Dinas Tenaga Kerja) or the competent court in Central Lombok.</Text>
          </Article>

          <Article n={13} title="Extension and Renewal">
            <Text style={styles.paragraph}>This Agreement may be extended or renewed upon mutual written consent prior to its expiration.</Text>
          </Article>

          <Article n={14} title="Exit Procedure and Property Return">
            <Text style={styles.paragraph}>
              Upon termination or resignation, the SECOND PARTY must return all school property (keys, uniforms, equipment, and
              documents) before the final payment is released.
            </Text>
          </Article>

          {data.additionalTerms && (
            <Article n={15} title="Additional Terms">
              <Text style={styles.paragraph}>{data.additionalTerms}</Text>
            </Article>
          )}

          <Article n={data.additionalTerms ? 16 : 15} title="Closing and Signatures">
            <Text style={styles.paragraph}>This Agreement is made in two (2) original copies, each having equal legal force, and becomes effective upon signature.</Text>
            <Text style={styles.signatureMeta}>Signed in: {place}</Text>
            <Text style={styles.signatureMeta}>Date: {signature ? formatDateLabel(signature.signedAt.slice(0, 10)) : '…………………'}</Text>
          </Article>

          <View style={styles.signatureSection}>
            <View style={styles.signatureRow}>
              <View style={styles.signatureCol}>
                <Text style={styles.signatureColLabel}>First Party</Text>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureName}>Indhira Dewi, M.Pd</Text>
                <Text style={styles.signatureSub}>Principal, Selong Bay School</Text>
              </View>
              <View style={styles.signatureCol}>
                <Text style={styles.signatureColLabel}>Second Party</Text>
                {signature ? (
                  <Image src={signature.signatureDataUrl} style={styles.signatureImage} />
                ) : (
                  <View style={styles.signatureLine} />
                )}
                <Text style={styles.signatureName}>{signature ? signature.signedByName : data.employeeName}</Text>
                <Text style={styles.signatureSub}>{data.positionTitle}</Text>
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
