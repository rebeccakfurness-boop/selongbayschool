import { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak, AlignmentType } from 'docx';
import { renderToBuffer } from '@react-pdf/renderer';
import { put } from '@vercel/blob';
import { sql } from '@/lib/db';
import { WorksheetDocument } from '@/lib/pdf/WorksheetDocument';
import type { WorksheetContent } from './types';

/** Builds the primary, mandatory worksheet format -- a real .docx a teacher can open in Word,
 * print, and edit or annotate before class (the whole reason docx is required at all: a locked
 * PDF doesn't support that). Answer key sits on its own page after a page break, exactly matching
 * buildWorksheetPdf's layout so both formats show a teacher the same thing. */
export async function buildWorksheetDocx(content: WorksheetContent, lessonTitle: string): Promise<Buffer> {
  const answered = content.questions.filter((q) => q.answer);

  const children: Paragraph[] = [
    new Paragraph({ text: lessonTitle.toUpperCase(), spacing: { after: 80 } }),
    new Paragraph({ text: content.title, heading: HeadingLevel.TITLE, spacing: { after: 200 } }),
  ];

  if (content.instructions) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: content.instructions, italics: true })],
        spacing: { after: 300 },
      })
    );
  }

  content.questions.forEach((q, i) => {
    const marksLabel = q.marks != null ? `  (${q.marks} mark${q.marks === 1 ? '' : 's'})` : '';
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `${i + 1}. ${q.prompt}`, bold: false }), new TextRun({ text: marksLabel, italics: true })],
        spacing: { before: 200, after: 400 },
      })
    );
    // Blank answer space -- a plain empty line a teacher can print onto, not a form field, to
    // keep the file simple and reliably openable across Word versions.
    children.push(new Paragraph({ text: '', spacing: { after: 400 } }));
  });

  if (answered.length > 0) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(new Paragraph({ text: `Answer key — ${content.title}`, heading: HeadingLevel.HEADING_1, spacing: { after: 200 } }));
    answered.forEach((q) => {
      const questionNumber = content.questions.indexOf(q) + 1;
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `${questionNumber}. ${q.prompt}`, bold: true })],
          spacing: { before: 160, after: 40 },
        })
      );
      children.push(new Paragraph({ text: q.answer!, spacing: { after: 120 } }));
    });
  }

  const doc = new Document({
    creator: 'Selong Bay School',
    title: content.title,
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({ text: 'Selong Bay School', alignment: AlignmentType.RIGHT, spacing: { after: 200 } }),
          ...children,
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

/** The secondary/preview format, generated alongside the docx (never instead of it) via the
 * existing @react-pdf/renderer pattern already used for every other document this app produces. */
export async function buildWorksheetPdf(content: WorksheetContent, lessonTitle: string): Promise<Buffer> {
  return renderToBuffer(WorksheetDocument({ content, lessonTitle }));
}

/** Renders both worksheet files for one lesson, uploads them to Vercel Blob, and persists the
 * structured source plus both URLs on the lesson row in one place -- used by generate.ts's
 * per-lesson insert (both the static-content path and, once wired, a live LLM-backed provider),
 * by the Course Builder's job runner, and by the one-off backfill script for lessons that already
 * exist in the database. Always produces both files together: this app's hard requirement is that
 * docx is never swapped for a PDF-only or view-only worksheet, so there is no code path here that
 * writes one URL without the other. */
export async function generateAndAttachWorksheetFiles(lessonId: number, content: WorksheetContent, lessonTitle: string): Promise<void> {
  const [docxBuffer, pdfBuffer] = await Promise.all([buildWorksheetDocx(content, lessonTitle), buildWorksheetPdf(content, lessonTitle)]);

  const safeSlug = lessonTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'worksheet';

  const [docxBlob, pdfBlob] = await Promise.all([
    put(`curriculum-worksheets/${lessonId}-${safeSlug}.docx`, docxBuffer, {
      access: 'public',
      addRandomSuffix: true,
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }),
    put(`curriculum-worksheets/${lessonId}-${safeSlug}.pdf`, pdfBuffer, {
      access: 'public',
      addRandomSuffix: true,
      contentType: 'application/pdf',
    }),
  ]);

  await sql`
    UPDATE curriculum_unit_lessons SET
      worksheet_content = ${JSON.stringify(content)}::jsonb,
      worksheet_docx_url = ${docxBlob.url},
      worksheet_pdf_url = ${pdfBlob.url}
    WHERE id = ${lessonId}
  `;
}
