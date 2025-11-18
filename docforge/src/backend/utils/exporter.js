const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');
const PptxGenJS = require('pptxgenjs');
const MarkdownIt = require('markdown-it');

const md = new MarkdownIt({ html: false, linkify: true, typographer: true });

function sanitizeText(txt) {
  if (!txt && txt !== 0) return '';
  return String(txt);
}

function isHeading(line) {
  const m = line.match(/^(#{1,6})\s+(.*)$/);
  if (!m) return null;
  return { level: m[1].length, text: m[2].trim() };
}

function isBullet(line) {
  // unordered: -, *, • ; ordered: 1. 2.
  if (/^\s*[-*•]\s+/.test(line)) return true;
  if (/^\s*\d+[.)]\s+/.test(line)) return true;
  return false;
}

function paragraphToDocx(paragraph) {
  // paragraph may contain multiple lines; detect bullets/heading
  const lines = paragraph.split(/\n+/).map(l => l.trim()).filter(Boolean);
  const paras = [];
  if (lines.length === 0) return paras;

  // If first line is a heading, emit as heading then rest as normal
  const firstHeading = isHeading(lines[0]);
  let start = 0;
  if (firstHeading) {
    const level = Math.min(6, firstHeading.level);
    const headingMap = [null, HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4, HeadingLevel.HEADING_5, HeadingLevel.HEADING_6];
    paras.push(new Paragraph({ text: sanitizeText(firstHeading.text), heading: headingMap[level] }));
    start = 1;
  }

  // If remaining lines look like bullets, emit them as bullet paragraphs
  const rem = lines.slice(start);
  const looksLikeBulletList = rem.length > 0 && rem.every(isBullet);
  if (looksLikeBulletList) {
    for (const l of rem) {
      const text = l.replace(/^\s*[-*•]\s+/, '').replace(/^\s*\d+[.)]\s+/, '');
      paras.push(new Paragraph({ text: sanitizeText(text), bullet: { level: 0 } }));
    }
    return paras;
  }

  // Otherwise emit each remaining line as a paragraph
  for (const l of rem) {
    paras.push(new Paragraph({ children: [new TextRun(sanitizeText(l))] }));
  }

  return paras;
}

async function exportProjectAsDocx(project) {
  const doc = new Document();
  const children = [];

  // Title
  children.push(new Paragraph({ text: sanitizeText(project.title || 'Untitled'), heading: HeadingLevel.TITLE }));

  const sections = project.sections || [];
  for (const sec of sections) {
    // Section title (use as heading 1)
    children.push(new Paragraph({ text: sanitizeText(sec.title || 'Section'), heading: HeadingLevel.HEADING_1 }));

    const body = sanitizeText(sec.currentContent || '');
    // Split into blocks separated by two or more newlines
    const blocks = body.split(/\n{2,}/).map(b => b.trim()).filter(Boolean);
    if (blocks.length === 0) {
      children.push(new Paragraph(''));
    }
    for (const block of blocks) {
      const paras = paragraphToDocx(block);
      for (const p of paras) children.push(p);
    }
  }

  doc.addSection({ children });
  const buffer = await Packer.toBuffer(doc);
  return { buffer, filename: `${(project.title || 'document').replace(/[^a-z0-9_-]/gi, '_')}.docx`, contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
}

async function exportProjectAsPptx(project) {
  const pptx = new PptxGenJS();
  pptx.author = 'DocForge';
  pptx.title = project.title || 'Presentation';

  const sections = project.sections || [];
  if (sections.length === 0) {
    const slide = pptx.addSlide();
    slide.addText(project.title || 'Presentation', { x: 0.5, y: 1.0, fontSize: 36, bold: true });
  }

  for (const sec of sections) {
    const slide = pptx.addSlide();
    // If section title contains markdown heading, strip it
    const titleLine = (sec.title || '').toString().replace(/^#{1,6}\s+/, '').trim();
    slide.addText(sanitizeText(titleLine || 'Section'), { x: 0.5, y: 0.3, fontSize: 28, bold: true });

    const body = sanitizeText(sec.currentContent || '');
    // Split into blocks; choose first block as summary bullets
    const blocks = body.split(/\n{2,}/).map(b => b.trim()).filter(Boolean);
    const bullets = [];
    for (const block of blocks) {
      const lines = block.split(/\n+/).map(l => l.trim()).filter(Boolean);
      // If block starts with heading marker, skip it
      if (isHeading(lines[0])) {
        lines.shift();
      }
      // If lines look like bullet list, clean markers
      if (lines.every(isBullet)) {
        for (const l of lines) bullets.push(l.replace(/^\s*[-*•]\s+/, '').replace(/^\s*\d+[.)]\s+/, ''));
      } else {
        // otherwise add first 3 lines as bullets
        for (let i = 0; i < Math.min(3, lines.length); i++) bullets.push(lines[i]);
      }
      if (bullets.length >= 12) break; // limit overall bullets
    }

    if (bullets.length > 0) {
      // pptxgenjs accepts array of text objects; use bullet option
      slide.addText(bullets.map(t => ({ text: sanitizeText(t) })), { x: 0.5, y: 1.0, w: '90%', h: '70%', fontSize: 18, bullet: true });
    }
  }

  // write node buffer
  const buffer = await pptx.write('nodebuffer');
  return { buffer, filename: `${(project.title || 'presentation').replace(/[^a-z0-9_-]/gi, '_')}.pptx`, contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' };
}

async function exportProject(project, format = 'docx') {
  if (format === 'pptx') return exportProjectAsPptx(project);
  return exportProjectAsDocx(project);
}

module.exports = { exportProject };
