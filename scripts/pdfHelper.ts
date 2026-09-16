import fs from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { db } from '../src/lib/db';

export async function generateBookPdf(
  headerText: string,
  pages: { [pageNum: number]: string }
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const timesFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const marginX = 60;
  const marginTop = 65;
  const marginBottom = 55;

  const maxPageNum = Math.max(...Object.keys(pages).map(Number));

  for (let pNum = 1; pNum <= maxPageNum; pNum++) {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    const pageText = pages[pNum] || '';

    // Running Header (except first 5 pages and title pages)
    if (pNum > 5 && !pageText.includes('Chapter ') && !pageText.includes('PART ') && !pageText.includes('Part ')) {
      const headerWidth = timesFont.widthOfTextAtSize(headerText, 8.5);
      page.drawText(headerText, {
        x: (pageWidth - headerWidth) / 2,
        y: pageHeight - 38,
        size: 8.5,
        font: timesFont,
        color: rgb(0.3, 0.3, 0.3),
      });
    }

    // Page Number at bottom center
    const pageStr = String(pNum);
    const numWidth = timesFont.widthOfTextAtSize(pageStr, 9.5);
    page.drawText(pageStr, {
      x: (pageWidth - numWidth) / 2,
      y: 38,
      size: 9.5,
      font: timesFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    if (!pageText.trim()) continue;

    // Render body lines with intelligent wrapping & font styling
    const rawLines = pageText.split('\n');
    let currentY = pageHeight - marginTop;

    for (let rawLine of rawLines) {
      const line = rawLine.trim();
      if (!line) {
        currentY -= 10;
        continue;
      }

      // Determine styling based on content
      let font = timesFont;
      let size = 10.5;
      let isCenter = false;

      if (
        line.startsWith('CAN LOVE SURVIVE') ||
        line === 'CAN LOVE SURVIVE?' ||
        line === 'BOOK ONE • NOT LIKE THIS' ||
        line === 'BOOK TWO • ONLY IF IT WAITS' ||
        line === 'NOT LIKE THIS' ||
        line === 'ONLY IF IT WAITS' ||
        line.startsWith('CAN LOVE SURVIVE? Book')
      ) {
        font = timesBold;
        size = 13;
        isCenter = true;
      } else if (
        line.startsWith('Part ') ||
        line.startsWith('PART ') ||
        line.startsWith('Chapter ') ||
        line.startsWith('CHAPTER ') ||
        line === 'PROLOGUE' ||
        line === 'Prologue' ||
        line === 'TABLE OF CONTENTS' ||
        line === 'Author’s Note' ||
        line === "Author's Note" ||
        line === 'Before You Begin...' ||
        line === 'Dedication' ||
        line === 'About the Author & this Novel' ||
        line === 'THE END'
      ) {
        font = timesBold;
        size = 12;
        currentY -= 6;
      } else if (
        line.startsWith('The Boy Named') ||
        line.startsWith('The Wedding') ||
        line.startsWith('A New Beginning') ||
        line.startsWith('A Little Sister') ||
        line.startsWith('Kerala Days') ||
        line.startsWith('Growing Together') ||
        line.startsWith('Growing Up') ||
        line.startsWith('The First Calls') ||
        line.startsWith('Lockdown') ||
        line.startsWith('Midnight Conversations') ||
        line.startsWith('My First Phone') ||
        line.startsWith('Favourite Person') ||
        line.startsWith('Back to Normal') ||
        line.startsWith('Between Messages') ||
        line.startsWith('The Things I Never Counted') ||
        line.startsWith('Something Was Different') ||
        line.startsWith('The Story She Never Told') ||
        line.startsWith('The Love That Once Made Her Smile') ||
        line.startsWith('When Love Started Changing') ||
        line.startsWith('When Everything Fell Apart') ||
        line.startsWith('The Promise Never Spoken') ||
        line.startsWith('The Message I Sent') ||
        line.startsWith('Living Like Strangers') ||
        line.startsWith('A Different Sky') ||
        line.startsWith('Her Wedding') ||
        line.startsWith('Never Like This') ||
        line.startsWith('Building a New Life') ||
        line.startsWith('Time Doesn\'t Ask Permission') ||
        line.startsWith('A Different Kind of Happiness') ||
        line.startsWith('The Years We Never Noticed') ||
        line.startsWith('The Message I Never Sent') ||
        line.startsWith('Different Dreams') ||
        line.startsWith('A New Beginning for Him') ||
        line.startsWith('If It Waits') ||
        line.startsWith('The Reunion') ||
        line.startsWith('Some Promises Never Needed Words') ||
        line.startsWith('The Roads That Remember') ||
        line.startsWith('The Truth I Never Needed You To Know') ||
        line.startsWith('Thank You For Existing')
      ) {
        font = timesItalic;
        size = 11.5;
        currentY -= 3;
      } else if (
        line.startsWith('by') ||
        line.startsWith('Written by') ||
        line.startsWith('Author –') ||
        line.startsWith('MRETYUN JAI') ||
        line.startsWith('– MRETYUN') ||
        line.startsWith('— MRETYUN')
      ) {
        font = timesBold;
        size = 10.5;
      }

      if (currentY < marginBottom + 15) break;

      if (isCenter) {
        const textWidth = font.widthOfTextAtSize(line, size);
        page.drawText(line, {
          x: Math.max(marginX, (pageWidth - textWidth) / 2),
          y: currentY,
          size,
          font,
          color: rgb(0, 0, 0),
        });
      } else {
        page.drawText(line, {
          x: marginX,
          y: currentY,
          size,
          font,
          color: rgb(0, 0, 0),
        });
      }

      currentY -= size * 1.52;
    }
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
