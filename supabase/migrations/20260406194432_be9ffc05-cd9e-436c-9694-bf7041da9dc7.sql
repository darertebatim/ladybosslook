
-- Story 1: Madam C.J. Walker
INSERT INTO reading_content (title, subtitle, description, emoji, type, category, theme_color, cover_aspect, is_published, sort_order)
VALUES ('Madam C.J. Walker: The Empire of Self-Respect', 'From Washerwoman to America''s First Self-Made Female Millionaire', 'Born on a plantation in 1867, Sarah Breedlove lost both parents by age seven and spent twenty years scrubbing clothes for a dollar a day. When stress and poverty took her hair, she didn''t accept defeat—she invented a hair care formula that restored her confidence and built a beauty empire. Discover how she trained 20,000 women entrepreneurs and became the wealthiest self-made woman in America.', '👑', 'story', 'ladyboss-stories', '#FFE0F5', 'square', true, 26);

-- Story 2: Estée Lauder
INSERT INTO reading_content (title, subtitle, description, emoji, type, category, theme_color, cover_aspect, is_published, sort_order)
VALUES ('Estée Lauder: The Architect of Elegance', 'From a Queens Hardware Store to a Global Beauty Empire', 'Josephine Esther Mentzer grew up above a hardware store in Queens, watching her uncle mix creams on a kitchen stove. Rejected by every elite department store in New York, she refused to take "No" for an answer. From a legendary perfume spill in Paris to inventing the "Gift with Purchase," discover how an immigrant''s daughter built one of the most iconic beauty empires in history.', '💄', 'story', 'ladyboss-stories', '#D7E9FF', 'square', true, 27);

-- Story 3: Tory Burch
INSERT INTO reading_content (title, subtitle, description, emoji, type, category, theme_color, cover_aspect, is_published, sort_order)
VALUES ('Tory Burch: The Kitchen Table Empire', 'How a Mother of Three Built a Billion-Dollar Fashion Brand', 'In 2004, Tory Burch was a forty-year-old mother of three boys under four, designing clothes on her kitchen table with zero fashion training. When the world told her "ambitious" was a dirty word, she turned her dining room into a war room. From a risky flagship store on Elizabeth Street to crashing Oprah''s website, discover how she built a global fashion empire while making it home for bedtime.', '👠', 'story', 'ladyboss-stories', '#FFF3D6', 'square', true, 28);

-- Story 4: Glossier
INSERT INTO reading_content (title, subtitle, description, emoji, type, category, theme_color, cover_aspect, is_published, sort_order)
VALUES ('Glossier: The Power of Listening', 'From a 4 AM Blog to a $1.2 Billion Beauty Revolution', 'Emily Weiss was a fashion assistant at Vogue, invisible in a world of high-stakes perfection. Every morning at 4 AM, she wrote a beauty blog that would change an industry. When venture capitalists dismissed her as "just a blogger," she proved that empathy beats advertising. Discover how she turned a niche blog into a billion-dollar brand by making every customer the hero.', '🌸', 'story', 'ladyboss-stories', '#E2F9F0', 'square', true, 29);

-- Now insert sections for each story using subqueries to get content_id

-- === MADAM C.J. WALKER SECTIONS ===
INSERT INTO reading_sections (content_id, sort_order, heading, body, quote) VALUES
((SELECT id FROM reading_content WHERE title = 'Madam C.J. Walker: The Empire of Self-Respect' LIMIT 1), 0, 'The Daughter of the Fields',
'Sarah Breedlove was born in 1867 on a delta plantation in Louisiana. She was the first child in her family to be born into "freedom," but in the post-Civil War South, freedom looked a lot like a different kind of prison. By the age of seven, both of her parents were dead. By the age of fourteen, she was married—mostly to escape the abuse of her brother-in-law. By twenty, she was a widow with a two-year-old daughter.

She moved to St. Louis to be near her brothers, who were barbers. Her life was a blur of steam, lye, and back-breaking labor. For twenty years, she worked as a washerwoman, scrubbing the clothes of wealthy white families until her knuckles bled and her back was permanently bent. She earned barely a dollar a day. To the world, she was "just a washerwoman." To herself, she was a woman whose light was being extinguished by the very water she used to clean other people''s lives.',
'I was at the lowest point a human can reach without breaking.'),

((SELECT id FROM reading_content WHERE title = 'Madam C.J. Walker: The Empire of Self-Respect' LIMIT 1), 1, 'The Nightmare in the Mirror',
'The stress of poverty, the harsh chemicals of the laundry water, and a scalp disease began to take their toll. Sarah began to lose her hair. It didn''t fall out in strands; it fell out in patches, leaving her scalp raw and her confidence shattered. In a culture where a woman''s hair was her "crowning glory," Sarah felt like a ghost. She was losing her identity.

She tried every product on the market, but nothing worked. The shame was paralyzing. She would wrap her head in heavy scarves even in the humid St. Louis heat. This was her "Lead Suicide" moment—the point where most people accept that their best days are behind them. But Sarah didn''t look for a miracle in a bottle; she looked for a solution in her spirit. She began to experiment in her own kitchen, mixing fats and chemicals.',
NULL),

((SELECT id FROM reading_content WHERE title = 'Madam C.J. Walker: The Empire of Self-Respect' LIMIT 1), 2, 'The Dream and the $1.25',
'Legend says the formula came to her in a dream. A "tall black man" appeared and told her what to mix from Africa. Whether it was a dream or pure mechanical intuition, she created "Madam Walker''s Wonderful Hair Grower." It worked. Her hair grew back thick and healthy. But she didn''t just see a cure for her scalp; she saw a "Reset Button" for millions of women who felt as invisible as she once did.

In 1905, she moved to Denver with only $1.25 in her pocket. She worked as a cook by day and sold her products door-to-door by night. She married Charles Joseph Walker—a newspaper salesman—and took the name that would become an empire: Madam C.J. Walker. Her husband told her to keep the business small and local. He feared the "recklessness" of her ambition. But Sarah had already been a washerwoman for twenty years; she wasn''t afraid of the work—she was afraid of staying small.',
'I got my start by giving myself a start.'),

((SELECT id FROM reading_content WHERE title = 'Madam C.J. Walker: The Empire of Self-Respect' LIMIT 1), 3, 'Crashing the Convention',
'By 1910, the business was growing, but the "Big Industry" ignored her. At a major convention for Black businessmen, the leaders refused to let her speak. They told her she was "just a beautician" and that her business wasn''t serious. They ignored her for two days. On the third day, as the chairman tried to close the session, Sarah stood up in the middle of the aisle.

She didn''t ask for permission. She commanded the room. "Surely you are not going to shut the door in my face!" she shouted. "I am a woman who came from the cotton fields of the South. From there, I was promoted to the washtub. From there, I was promoted to the cook kitchen. And from there, I promoted myself into the business of manufacturing hair goods and preparations." By the time she sat down, she had the entire room''s attention—and their investment.',
'I didn''t wait for a seat at the table. I built my own table.'),

((SELECT id FROM reading_content WHERE title = 'Madam C.J. Walker: The Empire of Self-Respect' LIMIT 1), 4, 'The Army of Ladybosses',
'Madam Walker realized the same truth: A personal brand is fragile; a system is an empire. She didn''t want to be the only one selling her products. She created the "Walker System" and trained thousands of women to be "Walker Agents." She gave them uniforms, a strict code of conduct, and a path to financial independence.

She was training 20,000 women—former washerwomen and maids—to become entrepreneurs. She taught them how to sell, how to save, and how to carry themselves with self-command. She wasn''t just selling hair growth; she was selling a "State Interruption." When a woman used the Walker System, she wasn''t just fixing her hair; she was "Resetting" her status in society.',
'I am not merely satisfied in making money for myself. I want to provide jobs for hundreds of women of my race.'),

((SELECT id FROM reading_content WHERE title = 'Madam C.J. Walker: The Empire of Self-Respect' LIMIT 1), 5, 'The Golden Estate',
'By the time she died in 1919 at the age of 51, she was the wealthiest self-made female millionaire in America. She built a mansion, Villa Lewaro, on the Hudson River—just down the street from John D. Rockefeller. She didn''t build it to show off; she built it so that every Black person who walked by could see what was possible through "willpower and persistence."

She spent her final years as a philanthropist, fighting for anti-lynching laws and women''s rights. She proved that your "starting point"—whether it''s a cotton field in Louisiana or an immigrant''s apartment in North America—has no power over your "finishing point." Like Honda, she took the "refusal of others" and turned it into the foundation of a global legacy.',
'Don''t sit down and wait for the opportunities to come. Get up and make them.');

-- === ESTÉE LAUDER SECTIONS ===
INSERT INTO reading_sections (content_id, sort_order, heading, body, quote) VALUES
((SELECT id FROM reading_content WHERE title = 'Estée Lauder: The Architect of Elegance' LIMIT 1), 0, 'The Girl from the Hardware Store',
'In the hot, cramped rooms above a hardware store in Corona, Queens, a young girl named Josephine Esther Mentzer lived in two different worlds. In one world, she was the daughter of Hungarian and Czech immigrants, surrounded by the smell of sawdust, nails, and the harsh reality of the working class. In the other world, she was a dreamer, mesmerized by her Uncle John—a chemist who spent his nights hunched over a kitchen stove, stirring thick, velvety creams in blue jars.

To the neighbors, Uncle John was a tinkerer. To Estée, he was a magician. She spent her childhood watching him turn raw oils and fats into "Super-Rich All-Purpose Cream." She didn''t just see a product; she saw a feeling. She saw the way a woman''s face changed when she felt beautiful. She saw a way to rewrite her own story, moving from the dusty hardware store to the gilded halls of Manhattan.',
'I didn''t get there by wishing for it or hoping for it, but by working for it.'),

((SELECT id FROM reading_content WHERE title = 'Estée Lauder: The Architect of Elegance' LIMIT 1), 1, 'The "No" That Lasted Years',
'Estée didn''t start with a boardroom or a factory. She started with a bag full of samples and a refusal to be ignored. For years, she was a "nuisance" to the elite department stores of New York. She would haunt the offices of buyers at Saks Fifth Avenue and Bonwit Teller, clutching her blue jars. The answer was always the same: "No." The established beauty brands had the money, the counters, and the prestige. Estée was just a woman from Queens with no "pedigree."

In those moments of rejection, the "shame-spiral" was a constant threat. Most people would have taken the "No" as a sign to go back to the hardware store. But Estée had a different internal "Code." She realized that if they wouldn''t give her a counter, she would go directly to the customers.',
NULL),

((SELECT id FROM reading_content WHERE title = 'Estée Lauder: The Architect of Elegance' LIMIT 1), 2, 'The Spill in Paris',
'By 1953, Estée was ready to conquer the world, but the French market—the heart of global beauty—was a fortress. The managers at Galeries Lafayette in Paris wouldn''t even grant her an interview. They viewed American beauty products as "crude."

This was Estée''s "Napoleon" moment. She walked into the crowded, prestigious store, dressed in her finest suit, and "accidentally" dropped a large bottle of her new bath oil, Youth-Dew, right in the center of the floor. As the glass shattered, a heavy, intoxicating scent of jasmine, patchouli, and lavender filled the air. It was an olfactory ambush. Every woman in the store stopped. They didn''t just smell a perfume; they felt a sudden, irresistible pull. They began asking, "What is that? Where can I buy it?" The manager, forced to react to the sudden demand of his own customers, was trapped. He gave her the counter she wanted. Estée didn''t break the rules; she broke the "State" of the room to create her own opportunity.',
'Business is there if you go after it.'),

((SELECT id FROM reading_content WHERE title = 'Estée Lauder: The Architect of Elegance' LIMIT 1), 3, 'The Invention of the "Free Gift"',
'Estée understood a psychological truth that her competitors missed: Generosity is the ultimate sales tool. At a time when luxury brands were cold and distant, Estée invented the "Gift with Purchase." Her contemporaries thought she was crazy for giving away products for free. They called it "reckless."

But Estée knew her audience. She knew that once a woman felt the cream on her skin, the "Self-Command" of feeling beautiful would become a necessity, not a luxury. She turned her customers into an army. She didn''t just sell a jar; she sold a transformation. She would stand at the counters herself, touching the faces of strangers, telling them, "You are beautiful, let me show you." She was a "Ladyboss" who wasn''t afraid to get her hands greasy—just like her father in the hardware store and her uncle at the stove.',
'I have never worked a day in my life without selling. If I believe in something, I sell it, and I sell it hard.'),

((SELECT id FROM reading_content WHERE title = 'Estée Lauder: The Architect of Elegance' LIMIT 1), 4, 'The Blue Jar Legacy',
'When Estée Lauder died in 2004, she was the only woman on Time magazine''s list of the 20 most influential business geniuses of the 20th century. She had built a multi-billion dollar empire from a kitchen stove in Queens.

She proved that being an "outsider" is a superpower. She showed that a "bad moment"—a rejection from a buyer or a door shut in your face—is just a setup for a "Reset." Her blue jars became a global symbol of the immigrant dream realized through persistence and the refusal to accept "No" as a final answer.

She didn''t just build a brand; she built a system of self-respect that whispered to every woman: You are worth the effort.',
'Your face is your fortune. But your willpower is your empire.');

-- === TORY BURCH SECTIONS ===
INSERT INTO reading_sections (content_id, sort_order, heading, body, quote) VALUES
((SELECT id FROM reading_content WHERE title = 'Tory Burch: The Kitchen Table Empire' LIMIT 1), 0, 'The Office Between Nap Times',
'In 2004, the "headquarters" of what would become a multi-billion dollar global empire wasn''t a glass tower in Manhattan. It was a kitchen table covered in fabric swatches, sketches, and half-eaten sandwiches. Tory Burch was forty years old, a mother of three boys—all under the age of four—and she was attempting the impossible: launching a fashion brand with zero design training while navigating the relentless "beautiful chaos" of motherhood.

Tory didn''t start because she wanted to be "famous." She started because she was a woman with heavy responsibilities who couldn''t find a "uniform" that worked for her life. She needed clothes that could handle a board meeting and a playground visit in the same hour. To the outside world, she was a well-connected socialite living a comfortable life. But inside, Tory was battling a "State of Overwhelm" that every mother knows—the feeling that your own identity is being swallowed by the needs of everyone else.',
'I wanted to create a brand that was a lifestyle concept... but mostly, I just wanted to find myself again.'),

((SELECT id FROM reading_content WHERE title = 'Tory Burch: The Kitchen Table Empire' LIMIT 1), 1, 'The "Ambition" Reset',
'When Tory first told her friends and mentors she wanted to start a global retail business, the reaction wasn''t supportive. It was skeptical. People used the word "ambitious" as if it were a dirty word, a coded way of telling her she should stay in her lane. She felt the "shame-spiral" of being judged for wanting more.

This was Tory''s first major "Reset." She realized that she had to change her relationship with the word Ambition. She decided that if the world was going to judge her for having a vision, she would own that vision so completely that the judgment couldn''t touch her. She stopped asking for permission to be a businesswoman. She put on her own "Self-Command" and turned her kitchen table into a war room. She hired a small team and, instead of following the "fashion calendar," she followed her own rhythm, designing pieces that were "Timeless" because a busy mother doesn''t have time for "Trends."',
'Buckle up and don''t take it personally. Ambition is not a dirty word.'),

((SELECT id FROM reading_content WHERE title = 'Tory Burch: The Kitchen Table Empire' LIMIT 1), 2, 'The Elizabeth Street Gamble',
'Most fashion brands start by selling to other stores (wholesale). Tory did the opposite. She decided to open her own flagship store on Elizabeth Street in New York City on the very first day she launched. It was a massive financial and emotional risk. If the doors opened and no one came, the "Kitchen Table Empire" would collapse before it began.

She designed the store to feel like a room in her own home—orange lacquered doors, cozy sofas, a "Sanctuary" for women. She wasn''t just selling a tunic or a pair of flats; she was selling a "State of Mind." On opening day, she was so nervous she could barely breathe. But then, something happened. The women came. Not just a few, but crowds. They bought almost everything in the shop on the first day. They weren''t just buying clothes; they were buying into Tory''s "Routine"—the idea that a woman could be chic, powerful, and a present mother all at once.',
'I had to believe in my own gut instinct when the experts told me I was wrong.'),

((SELECT id FROM reading_content WHERE title = 'Tory Burch: The Kitchen Table Empire' LIMIT 1), 3, 'The Oprah Effect (The 24-Hour Reset)',
'In 2005, a year after launching, Tory received a call that would change everything: Oprah Winfrey wanted her on the show. Oprah called her "The Next Big Thing."

Within 24 hours of the episode airing, Tory''s website crashed. The demand was so explosive it would have destroyed a weaker system. This was a moment of extreme "Lead Suicide"—the business was growing faster than the infrastructure. Tory had to move from "Founder" to "CEO" overnight. She had to build systems, supply chains, and teams while still making it home for her sons'' bedtime. She proved that success isn''t about having a perfect plan; it''s about the "Willpower" to manage the chaos when your dreams actually come true.',
'You have to be prepared for the moment the door opens.'),

((SELECT id FROM reading_content WHERE title = 'Tory Burch: The Kitchen Table Empire' LIMIT 1), 4, 'The Reva and the Foundation',
'Tory''s most famous product, the "Reva" ballet flat, was named after her mother. It became the global uniform for the "Ladyboss"—a shoe you could walk a city in, but still feel like a queen. But for Tory, the "System" wasn''t complete until she could give that "Reset" to other women.

She created the Tory Burch Foundation to provide capital and education to women entrepreneurs. She knew that most women don''t lack "Ambition"—they lack "Access." She turned her brand into a bridge, helping thousands of other women move their own businesses from the kitchen table to the boardroom. She proved that the ultimate "Self-Command" is not just reaching the top, but building a ladder for everyone else behind you.',
'Your life is your own design. If the chair you''re sitting in doesn''t fit, get up and build a new one.');

-- === GLOSSIER SECTIONS ===
INSERT INTO reading_sections (content_id, sort_order, heading, body, quote) VALUES
((SELECT id FROM reading_content WHERE title = 'Glossier: The Power of Listening' LIMIT 1), 0, 'The 4:00 AM Ghost',
'In 2010, the hallways of Vogue magazine were a cathedral of silence and high-stakes perfection. Emily Weiss was a fashion assistant—the "Super Intern"—living in a world of $10,000 dresses and editors who didn''t speak unless spoken to. Her life was a blur of steaming silk, organizing closets, and staying invisible. To anyone watching, she was just another girl trying to climb the impossible ladder of the fashion elite.

But every morning, while the rest of New York was still asleep, Emily lived a second life. At 4:00 AM, in the blue light of her tiny apartment, she was a writer. She started a blog called Into The Gloss. She didn''t have a business plan; she just had a "Notice" reflex. She noticed that the beauty industry was a monologue—brands telling women what to look like—when it should have been a dialogue. She spent those early hours interviewing the coolest women in the world about their bathroom cabinets, capturing the "music" of their real routines.',
'I didn''t want to be a gatekeeper. I wanted to be a bridge.'),

((SELECT id FROM reading_content WHERE title = 'Glossier: The Power of Listening' LIMIT 1), 1, 'The "Intern" Who Saw Too Much',
'As the blog grew, Emily realized something profound. The "Ladybosses" of the world didn''t want to be painted over; they wanted to be seen. She saw women using heavy foundations to hide their skin and bright colors to mask their insecurities. It was a "State of Disconnection." The beauty industry was selling a mask, but Emily''s community was asking for a mirror.

She decided to do the "reckless" thing. She decided to stop just talking about beauty and start making it. She envisioned a brand that put "Skin First, Makeup Second." But when she took her idea to the venture capitalists of Silicon Valley, the response was cold. She was "just a blogger." She was "too young." She didn''t have a chemistry degree. She faced the "shame-spiral" of being treated like a hobbyist in a room full of "serious" men. But like Honda in the back of the classroom, Emily knew she was building a different universe.',
'If you''re waiting for someone to give you the title, you''ll be waiting forever. You have to take the command.'),

((SELECT id FROM reading_content WHERE title = 'Glossier: The Power of Listening' LIMIT 1), 2, 'The Pink Pouch Revolution',
'In 2014, Glossier launched with just four products. They weren''t complicated. They weren''t aggressive. They came in a simple, pink bubble-wrap pouch that felt like a gift from a friend. Emily didn''t use celebrities for her marketing; she used the women who had been reading her blog at 4:00 AM.

This was her "ProLink" moment—she automated the connection between the user and the brand. She made the customer the hero. Every woman who posted a "shelfie" of her Glossier Milky Jelly Cleanser wasn''t just a customer; she was an owner of the movement. Emily proved that you don''t need a massive advertising budget if you have a massive amount of empathy. She turned a "niche blog" into a $1.2 billion empire by proving that "Self-Command" begins with the courage to look like yourself.',
'Beauty should be an accessory, not a necessity.'),

((SELECT id FROM reading_content WHERE title = 'Glossier: The Power of Listening' LIMIT 1), 3, 'The Pivot of the Icon',
'Success brought a new kind of pressure. Glossier became a "Unicorn," and Emily was no longer the girl in the Vogue closet—she was the CEO of a global phenomenon. But with growth comes the risk of losing the "Reset Button." The brand faced internal struggles, the pressure of retail expansion, and the challenge of staying "cool" while becoming "big."

In 2022, Emily did something that shocked the industry. She stepped down as CEO. She didn''t see it as a failure; she saw it as a "Clarify" step. She realized that her greatest strength was as a founder and a visionary, not a corporate operator. By stepping back, she reclaimed her own "Self-Command." She proved that being a Ladyboss isn''t about holding onto power until you burn out; it''s about knowing when to "Reset" your role so the vision can live forever.',
'My job is to ensure the soul of the brand stays intact. Sometimes that means getting out of the way.'),

((SELECT id FROM reading_content WHERE title = 'Glossier: The Power of Listening' LIMIT 1), 4, 'The Legacy of the Dialogue',
'Today, Glossier is more than a brand; it''s a case study in the "Human Advantage." Emily Weiss took the "Notice, Release, Clarify" cycle and applied it to an entire industry. She noticed the gap, released the old standards of "perfection," and clarified a new way for women to relate to their own faces.

She remains the girl who woke up at 4:00 AM to write about what mattered. She proved that whether you are an immigrant rebuilding in a new country or an intern in a fashion closet, your "inferiority" is actually your greatest insight. Your ability to listen to the "quiet music" of your own passion is the only engine you ever need to build a world.',
'The world doesn''t need more products. It needs more people who have the courage to be exactly who they are.');
