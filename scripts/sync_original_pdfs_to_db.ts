import fs from 'fs';
import path from 'path';
import { db } from '../src/lib/db';

async function main() {
  console.log('Syncing exact original PDFs to PostgreSQL database...');

  const manuscriptsDir = path.join(process.cwd(), 'private_manuscripts');

  const files = [
    { slug: 'can-love-survive', filename: 'can-love-survive.pdf' },
    { slug: 'not-like-this', filename: 'not-like-this.pdf' },
    { slug: 'only-if-it-waits', filename: 'only-if-it-waits.pdf' },
  ];

  for (const item of files) {
    const filePath = path.join(manuscriptsDir, item.filename);
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      continue;
    }

    const buffer = fs.readFileSync(filePath);
    const base64 = `data:application/pdf;base64,${buffer.toString('base64')}`;

    const updated = await db.book.update({
      where: { slug: item.slug },
      data: {
        pdfUrl: base64,
      },
      select: {
        id: true,
        title: true,
        slug: true,
      },
    });

    console.log(`✅ Stored exact original PDF for "${updated.title}" (${(buffer.length / 1024).toFixed(1)} KB)`);
  }

  console.log('All exact original manuscripts synced to DB successfully!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error syncing PDFs:', err);
  process.exit(1);
});
