import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { registerBrandFonts, BRAND_COLORS } from './fonts';
import type { WorksheetContent } from '@/lib/curriculum-generation/types';

registerBrandFonts();

const styles = StyleSheet.create({
  page: { padding: 36, fontFamily: 'Nunito Sans', fontSize: 11, color: BRAND_COLORS.ink },
  eyebrow: { fontFamily: 'Telex', fontSize: 10, color: BRAND_COLORS.tealDeep, textTransform: 'uppercase' },
  title: { fontSize: 20, fontWeight: 700, marginTop: 4, marginBottom: 10 },
  instructions: {
    borderWidth: 1,
    borderColor: BRAND_COLORS.sand,
    backgroundColor: BRAND_COLORS.cream,
    borderRadius: 6,
    padding: 10,
    marginBottom: 16,
    lineHeight: 1.5,
  },
  question: { marginBottom: 16 },
  questionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  questionPrompt: { flex: 1, lineHeight: 1.5 },
  questionMarks: { fontSize: 9, color: BRAND_COLORS.inkSoft, marginLeft: 10 },
  answerSpace: { borderBottomWidth: 1, borderBottomColor: BRAND_COLORS.sand, height: 20, marginTop: 8 },
  answerKeyTitle: { fontSize: 16, fontWeight: 700, marginBottom: 12, color: BRAND_COLORS.tealDeep },
  answerRow: { marginBottom: 10, lineHeight: 1.5 },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 36,
    right: 36,
    fontSize: 8,
    color: BRAND_COLORS.inkSoft,
    textAlign: 'center',
  },
});

/** The secondary/preview worksheet format alongside the primary .docx (see buildWorksheetDocx in
 * ./worksheet-files) -- same WorksheetContent source, rendered read-only. Answer key is on its own
 * page after a page break, exactly like the docx, so both formats agree on what a teacher sees when
 * they open either one. */
export function WorksheetDocument({ content, lessonTitle }: { content: WorksheetContent; lessonTitle: string }) {
  const answered = content.questions.filter((q) => q.answer);
  return (
    <Document title={content.title}>
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.eyebrow}>{lessonTitle}</Text>
        <Text style={styles.title}>{content.title}</Text>
        {content.instructions && (
          <View style={styles.instructions}>
            <Text>{content.instructions}</Text>
          </View>
        )}
        {content.questions.map((q, i) => (
          <View key={i} style={styles.question} wrap={false}>
            <View style={styles.questionRow}>
              <Text style={styles.questionPrompt}>
                {i + 1}. {q.prompt}
              </Text>
              {q.marks != null && <Text style={styles.questionMarks}>({q.marks} mark{q.marks === 1 ? '' : 's'})</Text>}
            </View>
            <View style={styles.answerSpace} />
          </View>
        ))}
        <Text style={styles.footer} fixed render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </Page>

      {answered.length > 0 && (
        <Page size="A4" style={styles.page} wrap>
          <Text style={styles.answerKeyTitle}>Answer key — {content.title}</Text>
          {answered.map((q, i) => (
            <View key={i} style={styles.answerRow}>
              <Text style={{ fontWeight: 700 }}>{content.questions.indexOf(q) + 1}. {q.prompt}</Text>
              <Text style={{ marginTop: 2 }}>{q.answer}</Text>
            </View>
          ))}
        </Page>
      )}
    </Document>
  );
}
