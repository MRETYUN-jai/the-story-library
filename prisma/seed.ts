import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding The Story Library database...');

  // Delete old chapters to ensure clean state
  await prisma.chapter.deleteMany({});
  await prisma.readingProgress.deleteMany({});

  // 1. Create Admin & Test User
  const adminPassword = await bcrypt.hash('admin123', 10);
  const readerPassword = await bcrypt.hash('reader123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@mretyunjai.com' },
    update: {},
    create: {
      name: 'Mretyun Jai B (Author & Admin)',
      email: 'admin@mretyunjai.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      isVerified: true,
    },
  });

  const reader = await prisma.user.upsert({
    where: { email: 'reader@mretyunjai.com' },
    update: {},
    create: {
      name: 'Ananya Sharma',
      email: 'reader@mretyunjai.com',
      passwordHash: readerPassword,
      role: 'USER',
      isVerified: true,
    },
  });

  console.log('Users created:', { admin: admin.email, reader: reader.email });

  // 2. Create Series
  const series = await prisma.series.upsert({
    where: { slug: 'can-love-survive-trilogy' },
    update: {},
    create: {
      name: 'The Can Love Survive? Trilogy',
      slug: 'can-love-survive-trilogy',
      description: 'A trilogy exploring love, choices, distance, and everything left unsaid.',
    },
  });

  // 3. Create Books
  // Book 1: Can Love Survive?
  const book1 = await prisma.book.upsert({
    where: { slug: 'can-love-survive' },
    update: {},
    create: {
      title: 'CAN LOVE SURVIVE?',
      slug: 'can-love-survive',
      bookNumber: 1,
      seriesId: series.id,
      description: 'Book I of The Can Love Survive? Trilogy. A captivating story of two souls who meet when the world is quietest, only to face the overwhelming tests of distance, miscommunications, and unexpressed feelings. When choices must be made, can love truly survive?',
      genre: 'Romantic Drama / Fiction',
      coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
      digitalPrice: 199.0,
      digitalEnabled: true,
      currency: 'INR',
      paperbackEnabled: true,
      paperbackPublisher: 'Pothi Publishing (pothi.com)',
      paperbackLink: 'https://pothi.com/pothi/book/mretyun-jai-b-can-love-survive',
      hardcoverEnabled: true,
      hardcoverPublisher: 'Pothi Publishing (pothi.com)',
      hardcoverLink: 'https://pothi.com/pothi/book/mretyun-jai-b-can-love-survive-hardcover',
      kindleEnabled: false,
      kindlePublisher: 'Pothi Publishing',
      kindleLink: null,
    },
  });

  // Book 2: Not Like This
  const book2 = await prisma.book.upsert({
    where: { slug: 'not-like-this' },
    update: {},
    create: {
      title: 'NOT LIKE THIS',
      slug: 'not-like-this',
      bookNumber: 2,
      seriesId: series.id,
      description: 'Book II — Branch Path A. What happens when holding on hurts more than walking away? NOT LIKE THIS follows the bitter reality of pride, silence, and the painful courage required to say goodbye when staying destroys who you are.',
      genre: 'Emotional Drama',
      coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800',
      digitalPrice: 249.0,
      digitalEnabled: true,
      currency: 'INR',
      paperbackEnabled: true,
      paperbackPublisher: 'Pothi Publishing (pothi.com)',
      paperbackLink: 'https://pothi.com',
      hardcoverEnabled: true,
      hardcoverPublisher: 'Pothi Publishing (pothi.com)',
      hardcoverLink: 'https://pothi.com',
      kindleEnabled: false,
      kindlePublisher: 'Pothi Publishing',
      kindleLink: null,
    },
  });

  // Book 3: Only If It Waits
  const book3 = await prisma.book.upsert({
    where: { slug: 'only-if-it-waits' },
    update: {},
    create: {
      title: 'ONLY IF IT WAITS',
      slug: 'only-if-it-waits',
      bookNumber: 3,
      seriesId: series.id,
      description: 'Book III — Branch Path B. What if time was never the enemy, but the test? ONLY IF IT WAITS explores quiet endurance, mature forgiveness, and discovering whether two people can rebuild what was fractured years later.',
      genre: 'Romantic Drama',
      coverImage: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&q=80&w=800',
      digitalPrice: 249.0,
      digitalEnabled: true,
      currency: 'INR',
      paperbackEnabled: true,
      paperbackPublisher: 'Pothi Publishing',
      paperbackLink: 'https://pothi.com/pothi/book/mretyun-jai-b-only-if-it-waits',
      hardcoverEnabled: true,
      hardcoverPublisher: 'Amazon Hardcover',
      hardcoverLink: 'https://amazon.in/dp/B0ONLYIFITWAITS',
      kindleEnabled: true,
      kindlePublisher: 'Amazon Kindle',
      kindleLink: 'https://amazon.in/dp/B0KINDLEOIW',
    },
  });

  // Standalone Book 1: The Letters We Never Sent
  const book4 = await prisma.book.upsert({
    where: { slug: 'the-letters-we-never-sent' },
    update: {},
    create: {
      title: 'THE LETTERS WE NEVER SENT',
      slug: 'the-letters-we-never-sent',
      bookNumber: null,
      seriesId: null,
      description: 'A deeply personal collection of letters written in midnight quietude—letters to lost loves, missed opportunities, former selves, and memories that linger long after the rain stops.',
      genre: 'Poetry & Epistolary Prose',
      coverImage: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=800',
      digitalPrice: 149.0,
      digitalEnabled: true,
      currency: 'INR',
      paperbackEnabled: true,
      paperbackPublisher: 'Pothi Publishing',
      paperbackLink: 'https://pothi.com/pothi/book/mretyun-jai-b-letters-never-sent',
      hardcoverEnabled: false,
      kindleEnabled: true,
      kindleLink: 'https://amazon.in/dp/B0KINDLETLWNS',
    },
  });

  // Standalone Book 2: Where Rain Meets The River
  const book5 = await prisma.book.upsert({
    where: { slug: 'where-rain-meets-the-river' },
    update: {},
    create: {
      title: 'WHERE RAIN MEETS THE RIVER',
      slug: 'where-rain-meets-the-river',
      bookNumber: null,
      seriesId: null,
      description: 'Set in a foggy mountain town, a young architect retreating from urban burnout crosses paths with a mysterious writer restoring an old library. Together they learn to heal.',
      genre: 'Contemporary Fiction / Healing',
      coverImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=800',
      digitalPrice: 299.0,
      digitalEnabled: true,
      currency: 'INR',
      paperbackEnabled: true,
      paperbackPublisher: 'Pothi Publishing',
      paperbackLink: 'https://pothi.com/pothi/book/where-rain-meets-river',
      hardcoverEnabled: true,
      hardcoverPublisher: 'Amazon Hardcover',
      hardcoverLink: 'https://amazon.in/dp/B0WHERERAINMEETS',
      kindleEnabled: true,
      kindleLink: 'https://amazon.in/dp/B0KINDLEWRMTR',
    },
  });

  // 4. Seed Chapters for Book 1 (Can Love Survive?)
  const chaptersBook1 = [
    {
      chapterNumber: 1,
      title: 'Chapter 1: The Quiet Midnight',
      content: `The clock on the wooden wall struck 12:15 AM. Outside, the steady rhythm of midnight rain hit the glass pane of the small coffee room.

I sat with a lukewarm ceramic mug between both palms, staring at a blank notebook. The city was asleep, wrapped in damp silence, but inside my mind, every conversation we had ever shared was playing on repeat.

"Why do you always write when it rains?" she had asked me once, her eyes reflecting the golden light of the streetlamp outside the cafe.

I hadn't answered her then. I had only smiled and pulled my mug closer. But tonight, as the mist clung to the balcony rails, I finally knew the answer.

Rain makes you remember everything you tried to hide under the sun.

She had entered my life without an invitation, like a quiet melody playing from an open window down the lane. In a world obsessed with loud declarations, she moved with soft grace, carrying a silence that spoke louder than words.

I picked up my pen. The ink pooled on the parchment, waiting for a single word.

*Can love survive the distance we create inside our own minds?*`,
    },
    {
      chapterNumber: 2,
      title: 'Chapter 2: The Unspoken Promise',
      content: `We met at the old town library on a rainy Tuesday in October. 

The aisle between the philosophy and poetry sections was narrow, barely wide enough for two people to pass without brushing shoulders. She was reaching for an old cloth-bound copy of Neruda's verses.

"That edition has two missing pages in the middle," I said softly, stepping back to give her space.

She paused, her finger tracing the worn spine. She turned slowly, looking at me with curiosity. "How do you know?"

"Because I checked it out three months ago," I replied. "And I had to write the missing stanzas on a yellow bookmark and leave it inside."

She pulled the book down and opened it to the middle. There it was—my messy handwriting on a yellow slip of paper. A small, quiet laughter escaped her lips.

That was the moment the universe shifted. Not with lightning or thunder, but with the subtle turning of a page in a dimly lit library.`,
    },
    {
      chapterNumber: 3,
      title: 'Chapter 3: Coffee and Unmailed Notes',
      content: `For three months, every Thursday afternoon became a holy ritual. We met at the small corner table at *Cafe Nostalgia*, ordering black filter coffee and almond biscuits.

We spoke of books, forgotten railway stations, old black-and-white films, and the strange weight of unfulfilled dreams. Yet, beneath our conversations was a deep, unspoken current.

"Do you ever feel like people leave too soon?" she asked one evening, tracing the rim of her coffee cup.

"Or maybe," I whispered, looking into her eyes, "we just don't give them a reason to stay."

She looked out the window where dusk was falling over the avenue. "Sometimes reasons aren't enough when distance is already growing inside."

I felt a sudden chill in my chest. I wanted to reach out, to take her hand, to tell her that some bonds outlive space and time. But pride and fear held me frozen.

I wrote a note on a napkin that night: *Don't leave without letting me tell you what you mean to me.*

I folded it and placed it in my pocket. I never gave it to her.`,
    },
    {
      chapterNumber: 4,
      title: 'Chapter 4: Shadows Across the Table',
      content: `The summer heat began to fade into autumn mist, bringing with it the news I had secretly dreaded.

Her father had received a transfer to Bangalore. In less than three weeks, she would pack her life into cardboard boxes and leave the city.

We sat at our usual table, but the black coffee tasted bitter.

"Are you going to ask me to stay?" she asked quietly, her voice trembling slightly.

The room felt stiflingly small. My heart screamed a thousand reasons, but my mind remembered the reality—her career, her family, the uncertain path before us.

"Would you stay if I asked?" I asked back, putting the burden back on her shoulders.

She looked at me for a long time, her eyes filling with unshed tears. "You should have asked before asking if I would."

That night, silence became our third companion.`,
    },
    {
      chapterNumber: 5,
      title: 'Chapter 5: The Departure Station',
      content: `Platform Number 4 was crowded with passengers, luggage carts, and steam from tea vendors.

She stood near the coach door, holding her small hand bag tightly. The morning breeze blew stray strands of hair across her cheek.

"Take care of your coffee habit," she said, attempting a faint smile.

"Take care of your Neruda books," I answered.

The guard blew his whistle. The green flag waved in the damp morning light. The train gave a low, heavy groan as the wheels began to turn.

She stepped onto the footboard and looked back at me. I walked alongside the moving coach, my heart pounding against my ribs.

"Call me when you reach!" I called out.

She nodded, but as the train gathered speed, her silhouette shrunk into the gray distance, leaving me standing alone on the wooden platform as smoke curled into the sky.`,
    },
    {
      chapterNumber: 6,
      title: 'Chapter 6: Echoes in Empty Rooms',
      content: `The days that followed were long and hollow.

I frequented our usual library aisle, but the Neruda book remained on the shelf, untouched. I ordered black coffee at Cafe Nostalgia, but the chair across from me sat cold and empty.

We spoke on the phone in short, cautious fragments.

"How is Bangalore?"
"It rains here too. But it feels different."
"Different how?"
"It feels like it's raining on someone else's roof."

Misunderstandings began to grow in the spaces between our calls. Unanswered messages. Delayed replies. Words misinterpreted through text screens.

The distance wasn't just 600 kilometers of railway track. It was the growing silence of two people afraid to admit how vulnerable they felt.`,
    },
    {
      chapterNumber: 7,
      title: 'Chapter 7: A Letter Delivered Late',
      content: `Six months after her departure, I finally typed out the letter I had carried in my head for half a year.

I wrote about the napkin note. I wrote about the fear that made me mute on Platform Number 4. I wrote about how every rainy evening carried her memory into my room.

I posted it by registered mail to her Bangalore address.

Three days later, I received a short text message:

*I received your letter. But why did you wait until I learned how to live without your voice?*

The words burned on my phone screen like white heat. I stared at them until the backlight went dark.`,
    },
    {
      chapterNumber: 8,
      title: 'Chapter 8: The Crossroads of Choice',
      content: `It is midnight again as I complete these pages.

Her last message hangs in the air between us like a suspended question mark.

I am standing at the ultimate crossroads of our story. Two paths stretch before me into the dark:

Path One: Accept that some loves are meant to be beautiful chapters rather than full books. Walk away with dignity, allowing the pain to shape us into different people.

Path Two: Take the overnight train to Bangalore. Stand at her doorstep, throw away all pride, and ask for one more chance to rebuild what distance tore apart.

One question remains written across the rain-streaked sky:

**CAN LOVE SURVIVE?**`,
    },
  ];

  for (const ch of chaptersBook1) {
    await prisma.chapter.create({
      data: {
        bookId: book1.id,
        chapterNumber: ch.chapterNumber,
        title: ch.title,
        content: ch.content,
        published: true,
      },
    });
  }

  // Chapters for Book 2 (Not Like This)
  const chaptersBook2 = [
    {
      chapterNumber: 1,
      title: 'Chapter 1: The Weight of Letting Go',
      content: `I decided not to take the overnight train.

Pride is a quiet monster. It tells you that staying back protects your honor, while in reality, it only seals your loneliness.

I stayed in my quiet room, watching the rain wash down the avenue. The decision was made. Not with dramatic anger, but with a dull, heavy acceptance that some stories end before the final page is printed.`,
    },
    {
      chapterNumber: 2,
      title: 'Chapter 2: Erasing the Traces',
      content: `It takes weeks to unlearn a habit, but months to unlearn a person.

I deleted her contact number, but I had already memorized every digit. I packed her old bookmark into a wooden memory box and locked it inside my bottom desk drawer.

"You look tired," my mother observed at breakfast.

"Just reading late," I lied.`,
    },
    {
      chapterNumber: 3,
      title: 'Chapter 3: The Final Goodbye',
      content: `Two years later, I bumped into her at a mutual friend's wedding reception.

She looked breathtaking in a dark blue silk saree, her hair pinned with jasmine flowers. She was laughing with a group of old classmates when our eyes met across the lawn.

The music faded. The crowd vanished.

We walked to the quiet edge of the garden under the mango trees.

"You look happy," I said softly.

"I am," she replied, her eyes filled with gentle nostalgic warmth. "And you?"

"I am learning," I smiled.

We didn't talk about the past. We didn't mention the unmailed napkin or the late letter. We let the silence stay peaceful. As we said our final goodbye, I knew in my heart that we were both okay.

Love didn't survive as a relationship. But it survived as a memory that made us better humans.`,
    },
  ];

  for (const ch of chaptersBook2) {
    await prisma.chapter.create({
      data: {
        bookId: book2.id,
        chapterNumber: ch.chapterNumber,
        title: ch.title,
        content: ch.content,
        published: true,
      },
    });
  }

  // Chapters for Book 3 (Only If It Waits)
  const chaptersBook3 = [
    {
      chapterNumber: 1,
      title: 'Chapter 1: The Ticket to Bangalore',
      content: `I packed a small canvas bag, walked to the central railway station at 11:00 PM, and bought a one-way ticket to Bangalore.

Fear told me I was making a mistake. Pride told me I was humiliating myself. But love—pure, unadulterated love—told me that living with rejection was far better than living with a lifetime of 'what ifs'.

The train roared through the dark night, carrying me toward her.`,
    },
    {
      chapterNumber: 2,
      title: 'Chapter 2: Standing at the Doorstep',
      content: `The morning air in Bangalore was crisp and smelled of eucalyptus leaves.

I found her apartment building in Indiranagar. I stood outside the mahogany door on the second floor, my palms sweating, my heart pounding like a drum.

I knocked three times.

The door clicked open. She stood there in a gray cardigan, holding a mug of tea. When she saw me standing in the doorway with my canvas bag, her mug trembled in her hands.

"You came," she whispered.

"I was late for the letter," I said softly. "I didn't want to be late for the rest of our lives."`,
    },
    {
      chapterNumber: 3,
      title: 'Chapter 3: Rebuilding the House of Cards',
      content: `It wasn't magic overnight. We had to earn back trust, unlearn old defense mechanisms, and talk through every quiet scar distance had left on our hearts.

We spent afternoons walking around Ulsoor Lake, talking about our fears, our dreams, and what we needed from each other.

Forgiveness isn't forgetting the hurt. It's choosing to love despite knowing the hurt existed.

Three years later, as rain tapped against our balcony window in Bangalore, she rested her head on my shoulder.

"Did love survive?" she asked with a soft smile.

I kissed her forehead. "It only survived... because it waited."`,
    },
  ];

  for (const ch of chaptersBook3) {
    await prisma.chapter.create({
      data: {
        bookId: book3.id,
        chapterNumber: ch.chapterNumber,
        title: ch.title,
        content: ch.content,
        published: true,
      },
    });
  }

  // Give reader user sample purchase of Book 1 for instant demo testing
  await prisma.purchase.upsert({
    where: { orderId: 'ORDER_DEMO_READ123' },
    update: {},
    create: {
      userId: reader.id,
      bookId: book1.id,
      orderId: 'ORDER_DEMO_READ123',
      paymentId: 'pay_demo_success_123',
      paymentSignature: 'sig_demo_123',
      amount: 199.0,
      currency: 'INR',
      status: 'SUCCESS',
    },
  });

  // Seed reading progress for reader user
  const chapter1Book1 = await prisma.chapter.findFirst({
    where: { bookId: book1.id, chapterNumber: 1 },
  });

  if (chapter1Book1) {
    await prisma.readingProgress.upsert({
      where: {
        userId_bookId: {
          userId: reader.id,
          bookId: book1.id,
        },
      },
      update: {},
      create: {
        userId: reader.id,
        bookId: book1.id,
        chapterId: chapter1Book1.id,
        positionPercent: 42.0,
      },
    });
  }

  // Seed Default Coupons
  await prisma.coupon.upsert({
    where: { code: 'LOVE50' },
    update: {},
    create: {
      code: 'LOVE50',
      discountType: 'PERCENTAGE',
      discountValue: 50.0,
      maxUses: 500,
      active: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'READFREE100' },
    update: {},
    create: {
      code: 'READFREE100',
      discountType: 'PERCENTAGE',
      discountValue: 100.0,
      maxUses: 100,
      active: true,
    },
  });

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
