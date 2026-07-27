import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { registerBrandFonts, BRAND_COLORS } from './fonts';
import { LOGO_PNG_BUFFER } from './assets';
import {
  ACHIEVEMENT_SCALE,
  EFFORT_SCALE,
  SOCIAL_RATING_LABELS,
  SOCIAL_CRITERIA,
  type Achievement,
  type Effort,
  type SocialRating,
} from '@/lib/family-data';

registerBrandFonts();

export interface LearningProfileSubjectData {
  subject_area: string;
  sub_subject: string | null;
  achievement: Achievement | null;
  effort: Effort | null;
  teacher_comment: string | null;
}

export interface LearningProfileData {
  term_label: string;
  grade_label: string | null;
  general_comment: string | null;
  whole_days_absent: string | null;
  partial_days_absent: string | null;
  extra_activities: string | null;
  positive_attitude: SocialRating | null;
  respects_rights_of_others: SocialRating | null;
  respects_class_school_rules: SocialRating | null;
  works_well_independently: SocialRating | null;
  shows_initiative_enthusiasm: SocialRating | null;
  helps_encourages_others: SocialRating | null;
}

const styles = StyleSheet.create({
  page: { padding: 0, fontFamily: 'Nunito Sans', fontSize: 10, color: BRAND_COLORS.ink },
  header: {
    backgroundColor: BRAND_COLORS.tealDeep,
    paddingVertical: 24,
    paddingHorizontal: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: { width: 90, height: 71 },
  headerRight: { alignItems: 'flex-end' },
  scriptTitle: { fontFamily: 'Shadows Into Light', fontSize: 26, color: '#aafdfa' },
  subTitle: { fontFamily: 'Telex', fontSize: 11, color: '#ffffff', marginTop: 2 },
  body: { paddingHorizontal: 36, paddingVertical: 20 },
  infoBox: {
    borderWidth: 1,
    borderColor: BRAND_COLORS.sand,
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  infoLabel: { fontSize: 8, fontWeight: 700, color: BRAND_COLORS.inkSoft, textTransform: 'uppercase' },
  infoValue: { fontSize: 12, marginTop: 2 },
  sectionTitle: { fontFamily: 'Telex', fontSize: 13, color: BRAND_COLORS.tealDeep, marginBottom: 6, marginTop: 14 },
  commentBox: {
    borderWidth: 1,
    borderColor: BRAND_COLORS.orange,
    backgroundColor: '#fff8ef',
    borderRadius: 6,
    padding: 10,
    lineHeight: 1.5,
  },
  row: { flexDirection: 'row' },
  tableHeader: { backgroundColor: BRAND_COLORS.teal, color: '#ffffff', fontWeight: 700, padding: 6, fontSize: 9 },
  tableCell: { padding: 6, fontSize: 9, borderBottomWidth: 1, borderBottomColor: BRAND_COLORS.sand },
  subjectHeader: {
    backgroundColor: BRAND_COLORS.orange,
    color: '#46280a',
    fontWeight: 700,
    padding: 6,
    fontSize: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: BRAND_COLORS.tealDeep,
    color: '#ffffff',
    fontSize: 8,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});

function SocialTable({ profile }: { profile: LearningProfileData }) {
  const values: Record<string, SocialRating | null> = {
    positive_attitude: profile.positive_attitude,
    works_well_independently: profile.works_well_independently,
    respects_rights_of_others: profile.respects_rights_of_others,
    shows_initiative_enthusiasm: profile.shows_initiative_enthusiasm,
    respects_class_school_rules: profile.respects_class_school_rules,
    helps_encourages_others: profile.helps_encourages_others,
  };
  return (
    <View style={{ borderWidth: 1, borderColor: BRAND_COLORS.sand, borderRadius: 6, overflow: 'hidden' }}>
      <View style={[styles.row]}>
        <Text style={[styles.tableHeader, { flex: 1 }]}>Social Development & Commitment to Learning</Text>
        <Text style={[styles.tableHeader, { width: 90, textAlign: 'center' }]}>Rating</Text>
      </View>
      {SOCIAL_CRITERIA.map((item, i) => (
        <View key={item.key} style={[styles.row, { backgroundColor: i % 2 === 0 ? '#ffffff' : '#faf7f0' }]}>
          <Text style={[styles.tableCell, { flex: 1 }]}>{item.label}</Text>
          <Text style={[styles.tableCell, { width: 90, textAlign: 'center', fontWeight: 700 }]}>
            {values[item.key] ? SOCIAL_RATING_LABELS[values[item.key]!] : '—'}
          </Text>
        </View>
      ))}
    </View>
  );
}

function ScaleLegend() {
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={styles.sectionTitle}>Achievement Scale</Text>
      <View style={{ borderWidth: 1, borderColor: BRAND_COLORS.sand, borderRadius: 6, overflow: 'hidden' }}>
        {ACHIEVEMENT_SCALE.map((item, i) => (
          <View key={item.value} style={[styles.row, { backgroundColor: i % 2 === 0 ? '#ffffff' : '#faf7f0' }]}>
            <Text style={[styles.tableCell, { width: 90, fontWeight: 700 }]}>{item.label} ({item.letter})</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{item.description}</Text>
          </View>
        ))}
      </View>
      <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Effort Scale</Text>
      <View style={{ borderWidth: 1, borderColor: BRAND_COLORS.sand, borderRadius: 6, overflow: 'hidden' }}>
        {EFFORT_SCALE.map((item, i) => (
          <View key={item.value} style={[styles.row, { backgroundColor: i % 2 === 0 ? '#ffffff' : '#faf7f0' }]}>
            <Text style={[styles.tableCell, { width: 90, fontWeight: 700 }]}>{item.label}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{item.description}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Header({ subtitle }: { subtitle: string }) {
  return (
    <View style={styles.header} fixed>
      <Image src={LOGO_PNG_BUFFER} style={styles.logo} />
      <View style={styles.headerRight}>
        <Text style={styles.scriptTitle}>Term Report</Text>
        <Text style={styles.subTitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function Footer() {
  return (
    <View style={styles.footer} fixed>
      <Text>www.selongbayschool.com</Text>
      <Text>+62 813-5974-095</Text>
      <Text>hello@selongbayschool.com</Text>
    </View>
  );
}

export function LearningProfileDocument({
  childFullName,
  profile,
  subjects,
}: {
  childFullName: string;
  profile: LearningProfileData;
  subjects: LearningProfileSubjectData[];
}) {
  const bySubjectArea = new Map<string, LearningProfileSubjectData[]>();
  for (const s of subjects) {
    const list = bySubjectArea.get(s.subject_area) ?? [];
    list.push(s);
    bySubjectArea.set(s.subject_area, list);
  }

  return (
    <Document title={`${childFullName} - ${profile.term_label} Report`}>
      <Page size="A4" style={styles.page}>
        <Header subtitle={`${profile.grade_label || ''} · ${profile.term_label}`} />
        <View style={styles.body}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Student Name</Text>
            <Text style={styles.infoValue}>{childFullName}</Text>
          </View>

          {profile.general_comment && (
            <>
              <Text style={styles.sectionTitle}>General Comment</Text>
              <View style={styles.commentBox}>
                <Text>{profile.general_comment}</Text>
              </View>
            </>
          )}

          <Text style={styles.sectionTitle}>Attendance</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={[styles.infoBox, { flex: 1 }]}>
              <Text style={styles.infoLabel}>Whole days absent</Text>
              <Text style={styles.infoValue}>{profile.whole_days_absent || '—'}</Text>
            </View>
            <View style={[styles.infoBox, { flex: 1 }]}>
              <Text style={styles.infoLabel}>Partial days absent</Text>
              <Text style={styles.infoValue}>{profile.partial_days_absent || '—'}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Social Development</Text>
          <SocialTable profile={profile} />

          {profile.extra_activities && (
            <>
              <Text style={styles.sectionTitle}>Extra Activities</Text>
              <View style={styles.infoBox}>
                <Text>{profile.extra_activities}</Text>
              </View>
            </>
          )}
        </View>
        <Footer />
      </Page>

      {subjects.length > 0 && (
        <Page size="A4" style={styles.page} wrap>
          <Header subtitle={`${profile.grade_label || ''} · ${profile.term_label}`} />
          <View style={styles.body}>
            {Array.from(bySubjectArea.entries()).map(([area, rows]) => (
              <View key={area} wrap={false} style={{ marginBottom: 14 }}>
                {rows.map((row, i) => (
                  <View key={i} style={{ marginBottom: 6 }}>
                    <View style={styles.subjectHeader}>
                      <Text>{row.sub_subject ? `${area} — ${row.sub_subject}` : area}</Text>
                      <Text>
                        {row.achievement ? ACHIEVEMENT_SCALE.find((a) => a.value === row.achievement)?.label : '—'}
                        {row.effort ? ` · Effort: ${EFFORT_SCALE.find((e) => e.value === row.effort)?.label}` : ''}
                      </Text>
                    </View>
                    {row.teacher_comment && (
                      <View style={[styles.commentBox, { marginTop: 6 }]}>
                        <Text>{row.teacher_comment}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ))}
          </View>
          <Footer />
        </Page>
      )}

      <Page size="A4" style={styles.page}>
        <Header subtitle={`${profile.grade_label || ''} · ${profile.term_label}`} />
        <View style={styles.body}>
          <Text style={styles.sectionTitle}>Understanding This Report</Text>
          <Text style={{ lineHeight: 1.5 }}>
            Selong Bay School combines the Cambridge International Curriculum and the Australian Curriculum,
            guided by Inquiry-Based Learning. Standards-referenced assessment compares your child&apos;s
            performance to a set of standards, not to other students.
          </Text>
          <ScaleLegend />
        </View>
        <Footer />
      </Page>
    </Document>
  );
}
