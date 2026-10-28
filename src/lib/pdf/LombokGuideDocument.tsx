import { Document, Page, View, Text, Image, Link, StyleSheet } from '@react-pdf/renderer';
import { registerBrandFonts, BRAND_COLORS } from './fonts';
import { LOGO_PNG_BUFFER } from './assets';
import { groupByCategory, type LombokGuideEntry } from '@/lib/lombok-guide';

registerBrandFonts();

const HEADER_HEIGHT = 119 + 10;
const FOOTER_HEIGHT = 40 + 14;

const styles = StyleSheet.create({
  page: { paddingTop: HEADER_HEIGHT, paddingBottom: FOOTER_HEIGHT, fontFamily: 'Nunito Sans', fontSize: 10, color: BRAND_COLORS.ink },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: BRAND_COLORS.tealDeep,
    paddingVertical: 24,
    paddingHorizontal: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: { width: 90, height: 71 },
  headerRight: { alignItems: 'flex-end', maxWidth: 320 },
  scriptTitle: { fontFamily: 'Shadows Into Light', fontSize: 26, color: '#aafdfa' },
  subTitle: { fontFamily: 'Telex', fontSize: 11, color: '#ffffff', marginTop: 2, textAlign: 'right' },
  body: { paddingHorizontal: 36, paddingVertical: 12 },
  intro: { fontSize: 10, lineHeight: 1.6, color: BRAND_COLORS.ink },
  categoryTitle: { fontFamily: 'Telex', fontSize: 14, color: BRAND_COLORS.tealDeep, marginTop: 20, marginBottom: 8 },
  entry: { borderWidth: 1, borderColor: BRAND_COLORS.sand, borderRadius: 6, padding: 10, marginBottom: 8 },
  entryTitle: { fontSize: 11, fontWeight: 700, color: BRAND_COLORS.ink },
  entryDescription: { fontSize: 9.5, lineHeight: 1.5, color: BRAND_COLORS.ink, marginTop: 3 },
  entryMeta: { fontSize: 8.5, color: BRAND_COLORS.inkSoft, marginTop: 4 },
  entryLink: { fontSize: 8.5, color: BRAND_COLORS.tealDeep, textDecoration: 'underline', marginTop: 4 },
  footer: {
    backgroundColor: BRAND_COLORS.tealDeep,
    color: '#ffffff',
    fontSize: 8,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});

function Header() {
  return (
    <View style={styles.header} fixed>
      <Image src={LOGO_PNG_BUFFER} style={styles.logo} />
      <View style={styles.headerRight}>
        <Text style={styles.scriptTitle}>Lombok Guide</Text>
        <Text style={styles.subTitle}>Settling into Selong Belanak</Text>
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

function EntryCard({ entry }: { entry: LombokGuideEntry }) {
  const websiteUrl = entry.website ? (entry.website.startsWith('http') ? entry.website : `https://${entry.website}`) : null;
  return (
    <View style={styles.entry} wrap={false}>
      <Text style={styles.entryTitle}>{entry.title}</Text>
      <Text style={styles.entryDescription}>{entry.description}</Text>
      {(entry.address || entry.phone) && (
        <Text style={styles.entryMeta}>
          {entry.address}
          {entry.address && entry.phone ? ' · ' : ''}
          {entry.phone}
        </Text>
      )}
      {websiteUrl && (
        <Link src={websiteUrl} style={styles.entryLink}>
          {entry.website}
        </Link>
      )}
    </View>
  );
}

export function LombokGuideDocument({ entries }: { entries: LombokGuideEntry[] }) {
  const sections = groupByCategory(entries);

  return (
    <Document title="Lombok Guide - Selong Bay School">
      <Page size="A4" style={styles.page} wrap>
        <Header />
        <View style={styles.body}>
          <Text style={styles.intro}>
            Welcome to Selong Belanak! This guide is put together by the Selong Bay School team to help your family settle
            in -- from practical essentials like real estate and medical care, to getting around, buying food, and making
            the most of what this part of Lombok has to offer. If you need anything not covered here, just ask us.
          </Text>

          {sections.map((section) => (
            <View key={section.category}>
              {/* The heading plus its first card are one wrap={false} unit so the heading can
                  never be stranded alone at the bottom of a page -- later cards in the same
                  section are free to flow onto the next page individually. */}
              <View wrap={false}>
                <Text style={styles.categoryTitle}>{section.label}</Text>
                <EntryCard entry={section.entries[0]} />
              </View>
              {section.entries.slice(1).map((entry) => (
                <EntryCard key={entry.id} entry={entry} />
              ))}
            </View>
          ))}

          {sections.length === 0 && <Text style={[styles.intro, { marginTop: 16 }]}>This guide is still being put together -- check back soon.</Text>}
        </View>
        <Footer />
      </Page>
    </Document>
  );
}
