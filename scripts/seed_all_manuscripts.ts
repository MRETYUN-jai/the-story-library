import fs from 'fs';
import path from 'path';
import { db } from '../src/lib/db';
import { generateBookPdf } from './pdfHelper';
import { book1Header, book1Pages } from './manuscript_book1_part1';
import { book1PagesPart2 } from './manuscript_book1_part2';
import { book2Header, book2Pages } from './manuscript_book2_part1';

async function main() {
  console.log('⚡ Starting Complete Manuscript Seeding into Database & PDF Engine...');

  // Ensure private_manuscripts folder exists
  const manuscriptsDir = path.join(process.cwd(), 'private_manuscripts');
  if (!fs.existsSync(manuscriptsDir)) {
    fs.mkdirSync(manuscriptsDir, { recursive: true });
  }

  // 1. Ensure Series exists
  const series = await db.series.upsert({
    where: { slug: 'can-love-survive-trilogy' },
    update: {},
    create: {
      name: 'The Can Love Survive? Trilogy',
      slug: 'can-love-survive-trilogy',
      description: 'A trilogy exploring love, choices, distance, and everything left unsaid.',
    },
  });

  // Combine pages for Book 1
  const allBook1Pages: { [pageNum: number]: string } = {
    ...book1Pages,
    ...book1PagesPart2,
  };

  // Generate Book 1 PDF
  console.log('Generating PDF for CAN LOVE SURVIVE?...');
  const book1Buffer = await generateBookPdf('CAN LOVE SURVIVE?', allBook1Pages);
  const book1PdfPath = path.join(manuscriptsDir, 'can-love-survive.pdf');
  fs.writeFileSync(book1PdfPath, book1Buffer);
  const book1Base64 = `data:application/pdf;base64,${book1Buffer.toString('base64')}`;

  // Upsert Book 1
  const book1 = await db.book.upsert({
    where: { slug: 'can-love-survive' },
    update: {
      title: 'CAN LOVE SURVIVE?',
      pdfUrl: book1Base64,
      status: 'PUBLISHED',
      digitalPrice: 199.0,
      currency: 'INR',
    },
    create: {
      title: 'CAN LOVE SURVIVE?',
      slug: 'can-love-survive',
      bookNumber: 1,
      seriesId: series.id,
      description: 'The complete first volume of the Can Love Survive? trilogy. A story about ordinary people, ordinary conversations, ordinary mistakes, and one decision that quietly changed two lives forever.',
      genre: 'Romantic Drama / Fiction',
      coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
      digitalPrice: 199.0,
      digitalEnabled: true,
      currency: 'INR',
      paperbackEnabled: true,
      paperbackPublisher: 'Pothi.com',
      paperbackLink: 'https://pothi.com',
      hardcoverEnabled: true,
      hardcoverPublisher: 'Pothi.com',
      hardcoverLink: 'https://pothi.com',
      pdfUrl: book1Base64,
      status: 'PUBLISHED',
    },
  });

  // Seed Chapters for Book 1
  const book1Chapters = [
    { num: 1, title: 'The Boy Named Mithran', content: 'Everything I know about that day comes from the stories my family has told me over the years...' },
    { num: 2, title: 'The Wedding', content: 'The year was 20XX. My uncle was getting married. Like every Indian family wedding...' },
    { num: 3, title: 'A New Beginning', content: 'After my grandfather passed away, nothing felt the same...' },
    { num: 4, title: 'A Little Sister', content: 'Trichy slowly became home. Unlike the other places we had lived before...' },
    { num: 5, title: 'Kerala Days', content: 'Every year, our family looked forward to one thing. The holidays...' },
    { num: 6, title: 'Growing Together', content: 'As the years passed, meeting once a year became a tradition...' },
    { num: 7, title: 'Growing Up', content: 'Years passed. Without realizing it, both of us were growing up...' },
    { num: 8, title: 'The First Calls', content: 'As children, Aashika and I never had a reason to think about phones...' },
    { num: 9, title: 'Lockdown', content: 'Just when life was beginning to settle into its usual routine, the entire world came to a sudden stop...' },
    { num: 10, title: 'Midnight Conversations', content: 'As the lockdown continued, our conversations slowly found their own time...' },
    { num: 11, title: 'My First Phone', content: 'After completing my eleventh standard, I finally got my own mobile phone...' },
    { num: 12, title: 'Favourite Person', content: 'By the time the lockdown had become part of everyday life, I had also changed...' },
    { num: 13, title: 'Back to Normal', content: 'The lockdown that had changed everyone\'s lives was finally coming to an end...' },
    { num: 14, title: 'Between Messages', content: 'By the middle of my eleventh standard, school had become one of my favourite places...' },
    { num: 15, title: 'The Things I Never Counted', content: 'Life slowly settled into another routine. Whenever I knew we would eventually visit Kerala...' },
    { num: 16, title: 'Something Was Different', content: 'Time has a strange way of moving. Before I realised it, my twelfth standard had come to an end...' },
    { num: 17, title: 'The Story She Never Told', content: 'The conversation we never had stayed in my mind for the next few days...' },
    { num: 18, title: 'The Love That Once Made Her Smile', content: 'The room remained silent for a few seconds. I didn\'t interrupt her...' },
    { num: 19, title: 'When Love Started Changing', content: 'After answering her question, neither of us spoke for a while...' },
    { num: 20, title: 'When Everything Fell Apart', content: 'For a few moments, I couldn\'t find the right words...' },
    { num: 21, title: 'The Promise Never Spoken', content: 'After she said those words: "I don\'t think I believe in love anymore."...' },
    { num: 22, title: 'A New Beginning for Her', content: 'A few days had passed since that long phone call...' },
    { num: 23, title: 'Becoming Best Friends', content: 'Days quietly turned into weeks. Weeks slowly turned into months...' },
    { num: 24, title: 'The Love That Stayed Hidden', content: 'By then, I had already accepted one truth: I loved her...' },
    { num: 25, title: 'Before July 22', content: 'January arrived quietly. Aashika\'s elder sister was getting married...' },
  ];

  await db.chapter.deleteMany({ where: { bookId: book1.id } });
  for (const ch of book1Chapters) {
    await db.chapter.create({
      data: {
        bookId: book1.id,
        chapterNumber: ch.num,
        title: ch.title,
        content: ch.content,
        published: true,
      },
    });
  }

  // Generate Book 2: NOT LIKE THIS PDF
  console.log('Generating PDF for NOT LIKE THIS...');
  const book2Buffer = await generateBookPdf('CAN LOVE SURVIVE? BOOK ONE • NOT LIKE THIS', book2Pages);
  const book2PdfPath = path.join(manuscriptsDir, 'not-like-this.pdf');
  fs.writeFileSync(book2PdfPath, book2Buffer);
  const book2Base64 = `data:application/pdf;base64,${book2Buffer.toString('base64')}`;

  const book2 = await db.book.upsert({
    where: { slug: 'not-like-this' },
    update: {
      title: 'CAN LOVE SURVIVE? Book One - NOT LIKE THIS',
      pdfUrl: book2Base64,
      status: 'PUBLISHED',
      digitalPrice: 249.0,
      currency: 'INR',
    },
    create: {
      title: 'CAN LOVE SURVIVE? Book One - NOT LIKE THIS',
      slug: 'not-like-this',
      bookNumber: 2,
      seriesId: series.id,
      description: 'Book One – Branch A. When Mithran chose to send the message. An emotional journey exploring the painful aftermath of silence, regret, distance, moving abroad, and learning to let go with grace.',
      genre: 'Emotional Drama / Fiction',
      coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800',
      digitalPrice: 249.0,
      digitalEnabled: true,
      currency: 'INR',
      paperbackEnabled: true,
      paperbackPublisher: 'Pothi.com',
      paperbackLink: 'https://pothi.com',
      hardcoverEnabled: true,
      hardcoverPublisher: 'Pothi.com',
      hardcoverLink: 'https://pothi.com',
      pdfUrl: book2Base64,
      status: 'PUBLISHED',
    },
  });

  const book2Chapters = [
    { num: 26, title: 'The Message I Sent', content: 'The bus reached my hometown early in the morning. The journey had ended, but the thoughts hadn\'t...' },
    { num: 27, title: 'Living Like Strangers', content: 'Life didn\'t stop after that day, even though I wanted it to...' },
    { num: 28, title: 'A Different Sky', content: 'By the end of my second year in Kerala, work had become routine...' },
    { num: 29, title: 'Her Wedding', content: 'Life in Australia continued. One evening, my mother called...' },
    { num: 30, title: 'Never Like This', content: 'A year passed after Aashika\'s wedding. Life quietly continued...' },
    { num: 31, title: 'Building a New Life', content: 'Marriage didn\'t change my life overnight. There was no magical feeling the next morning...' },
    { num: 32, title: 'Time Doesn\'t Ask Permission', content: 'The second year of our marriage arrived quietly...' },
    { num: 33, title: 'A Different Kind of Happiness', content: 'There are moments in life that divide time into two parts: before and after...' },
    { num: 34, title: 'The Years We Never Noticed', content: 'The first year of becoming parents felt longer than every year before it...' },
    { num: 35, title: 'Not Like This', content: 'Thirty-five. I smiled at the number for a moment...' },
  ];

  await db.chapter.deleteMany({ where: { bookId: book2.id } });
  for (const ch of book2Chapters) {
    await db.chapter.create({
      data: {
        bookId: book2.id,
        chapterNumber: ch.num,
        title: ch.title,
        content: ch.content,
        published: true,
      },
    });
  }

  // Generate Book 3: ONLY IF IT WAITS PDF
  console.log('Generating PDF for ONLY IF IT WAITS...');
  // Book 3 pages from manuscript
  const book3Pages: { [p: number]: string } = {
    1: `CAN LOVE SURVIVE?\nBook Two\nONLY IF IT WAITS\n\nby\n\nMRETYUN JAI B`,
    3: `CAN LOVE SURVIVE?\nBOOK TWO\nONLY IF IT WAITS\n\nWritten by\nMRETYUN JAI B\n\n"Every decision creates a future.\nSome decisions create two."\n\n© 2026 MRETYUN JAI B\nAll Rights Reserved.`,
    5: `Dedication\n\nFor those who chose patience...\nFor those who stayed.\nFor those who listened.\nFor those who believed that one honest conversation can change an entire future.`,
    6: `Before You Begin...\n\nThis is not another love story.\nIt is another possibility.\nThe same people. The same memories. The same beginning.\nOnly... one different choice.\nIf Book I was about regret... Book II is about patience.`,
    9: `PROLOGUE\n\nThere is something beautiful... and terrifying... about a single decision.\nMost people never notice it.\nOne reply. One conversation. One moment of patience. Or one moment of pride.\nCan quietly rewrite decades.`,
    13: `CAN LOVE SURVIVE?\nBOOK TWO • ONLY IF IT WAITS\n\nPart VI - Choice That Changed Everything\nChapter Twenty-Six\nThe Message I Never Sent\n\nThe bus slowly left Bangalore. The city lights disappeared behind me...\nJune 17. The card game. Her smile. The silence. The goodbye. Everything.`,
    14: `Without thinking, my fingers started typing:\n"Why didn't you talk to me properly? Why did you ignore me?"\nI read every word. Twice. Then a third time.\nMy thumb slowly moved towards the send button. It stopped.\n"What happens after I send this?"\nDelete. The screen became empty.`,
    15: `"Sorry... I think I behaved differently these last few days. Maybe I overthought everything. If I made you uncomfortable, I'm really sorry."\nSend.\nAlmost five minutes passed. My phone vibrated: Aashika Calling...\n"...Hello?"\n"I'm sorry."`,
    36: `Chapter Twenty-Seven\nGrowing Together\n\nAlmost a year had passed since that night on the bus. Without realizing it, life had quietly moved forward...`,
    57: `Chapter Twenty-Eight\nDifferent Dreams\n\nAlmost six months had passed since both of us started working. Life had settled into a comfortable routine...`,
    76: `Chapter Twenty-Nine\nA New Beginning for Him\n\nThe flight felt endless. For almost twelve hours, I kept switching between sleeping and staring outside...`,
    94: `Chapter Thirty\nIf It Waits\n\nLife became surprisingly peaceful after graduation. Australia slowly became more than just the country where I studied...`,
    122: `Chapter Thirty-One\nThe Reunion\n\nFour years had passed. Four years. It didn't sound like much when someone said it aloud...`,
    143: `Chapter Thirty-Two\nSome Promises Never Needed Words\n\nThe next morning, Mithran woke up before everyone else...`,
    161: `Chapter Thirty-Three\nThe Roads That Remember\n\nThe next morning arrived much earlier than anyone expected...`,
    180: `Chapter Thirty-Four\nThe Truth I Never Needed You To Know\n\nThe drive back from the park was much quieter than the journey there...`,
    209: `Chapter Thirty-Five\nThank You For Existing\n\nThe next morning, the house woke up exactly the way it always did...`,
    231: `Can Love Survive?\nYes.\nSometimes...\nIt survives because two people choose patience over pride.\nSometimes...\nIt survives because one conversation changes everything.\nAnd sometimes...\nIt survives because... someone waited.`,
    233: `Some stories begin with "I love you."\nOurs ended with "Thank you."\nAnd somehow...\nthat became\nthe happier ending.\n\n– MRETYUN JAI B`,
    234: `Dear Reader,\nIf you've reached this page... thank you.\nFor believing in these characters. For waiting with them. For hurting with them. For smiling with them.\nIf Mithran taught you anything, I hope it is this:\nNever let overthinking speak louder than honesty.\nNever let ego become stronger than love.\nAnd never assume someone understands your silence.\nSometimes... one conversation can save an entire lifetime.\n\nWith gratitude,\nMRETYUN JAI B`,
  };

  const book3Buffer = await generateBookPdf('CAN LOVE SURVIVE? BOOK TWO • ONLY IF IT WAITS', book3Pages);
  const book3PdfPath = path.join(manuscriptsDir, 'only-if-it-waits.pdf');
  fs.writeFileSync(book3PdfPath, book3Buffer);
  const book3Base64 = `data:application/pdf;base64,${book3Buffer.toString('base64')}`;

  const book3 = await db.book.upsert({
    where: { slug: 'only-if-it-waits' },
    update: {
      title: 'CAN LOVE SURVIVE? Book Two - ONLY IF IT WAITS',
      pdfUrl: book3Base64,
      status: 'PUBLISHED',
      digitalPrice: 249.0,
      currency: 'INR',
    },
    create: {
      title: 'CAN LOVE SURVIVE? Book Two - ONLY IF IT WAITS',
      slug: 'only-if-it-waits',
      bookNumber: 3,
      seriesId: series.id,
      description: 'Book Two – Branch B. What happens when patience speaks before pride? An uplifting and deeply moving alternative ending where honest communication, quiet understanding, and healing turn love into a lifelong sanctuary.',
      genre: 'Romantic Drama / Fiction',
      coverImage: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&q=80&w=800',
      digitalPrice: 249.0,
      digitalEnabled: true,
      currency: 'INR',
      paperbackEnabled: true,
      paperbackPublisher: 'Pothi.com',
      paperbackLink: 'https://pothi.com',
      hardcoverEnabled: true,
      hardcoverPublisher: 'Pothi.com',
      hardcoverLink: 'https://pothi.com',
      pdfUrl: book3Base64,
      status: 'PUBLISHED',
    },
  });

  const book3Chapters = [
    { num: 26, title: 'The Message I Never Sent', content: 'The bus slowly left Bangalore. The city lights disappeared behind me... I selected every word. Delete.' },
    { num: 27, title: 'Growing Together', content: 'Almost a year had passed since that night on the bus. Without realizing it, life had quietly moved forward...' },
    { num: 28, title: 'Different Dreams', content: 'Almost six months had passed since both of us started working...' },
    { num: 29, title: 'A New Beginning for Him', content: 'The flight felt endless. For almost twelve hours, I kept switching between sleeping and staring outside...' },
    { num: 30, title: 'If It Waits', content: 'Life became surprisingly peaceful after graduation. Australia slowly became more than just the country where I studied...' },
    { num: 31, title: 'The Reunion', content: 'Four years had passed. Four years. It didn\'t sound like much when someone said it aloud...' },
    { num: 32, title: 'Some Promises Never Needed Words', content: 'The next morning, Mithran woke up before everyone else...' },
    { num: 33, title: 'The Roads That Remember', content: 'The next morning arrived much earlier than anyone expected...' },
    { num: 34, title: 'The Truth I Never Needed You To Know', content: 'The drive back from the park was much quieter than the journey there...' },
    { num: 35, title: 'Thank You For Existing', content: 'The next morning, the house woke up exactly the way it always did...' },
  ];

  await db.chapter.deleteMany({ where: { bookId: book3.id } });
  for (const ch of book3Chapters) {
    await db.chapter.create({
      data: {
        bookId: book3.id,
        chapterNumber: ch.num,
        title: ch.title,
        content: ch.content,
        published: true,
      },
    });
  }

  console.log('✅ ALL 3 MANUSCRIPTS SUCCESSFULLY SEEDED INTO DATABASE & PDF READER ENGINE!');
  process.exit(0);
}

main().catch((e) => {
  console.error('Error seeding manuscripts:', e);
  process.exit(1);
});
