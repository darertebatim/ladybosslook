
-- Insert Honda founder story content
INSERT INTO reading_content (id, title, subtitle, description, author, category, type, reading_time_minutes, theme_color, emoji, cover_url, cover_aspect, is_published, is_premium, sort_order)
VALUES (
  'f5a6b7c8-d9e0-1234-fabe-456789012345',
  'Soichiro Honda: The Honda Story',
  'From a village mechanic to a global empire',
  'The incredible journey of Soichiro Honda — a school dropout from a tiny Japanese village who turned his obsession with engines into one of the world''s most iconic brands. Through war, earthquakes, bankruptcy, and relentless rejection, Honda proved that willpower and passion can overcome any obstacle.',
  'Ali Lotfi (adapted)',
  'business',
  'story',
  30,
  '#E2F9F0',
  '🏍️',
  NULL,
  'square',
  true,
  false,
  6
);

-- Insert sections
INSERT INTO reading_sections (content_id, sort_order, heading, body, quote, image_url) VALUES

('f5a6b7c8-d9e0-1234-fabe-456789012345', 1,
 'The Boy Who Loved Engines',
 'Soichiro Honda was born in 1906 in a small Japanese village. From the age of two or three, he was mesmerized by the sound of a rice-threshing engine on a neighboring farm. He would stand on the porch of his family''s wooden cottage, watching blue smoke rise from the machine, calling it "the first music of my life." He''d beg his grandfather to take him closer, then sit for hours in a corner, eyes fixed on the working machine, until his grandfather grew bored and signaled it was time to go home.

This early fascination wasn''t random — Honda inherited his love of machines from his father, who ran a bicycle repair shop in an era when most villagers only thought about farming. The other villagers thought his father was reckless and predicted the family would go bankrupt. But young Soichiro heard a different call.',
 '"That engine was the first music of my life."',
 NULL),

('f5a6b7c8-d9e0-1234-fabe-456789012345', 2,
 'The Worst Student in School',
 'Honda was a terrible student. He deliberately sat far from the teacher to avoid being called on, then drifted into daydreams about engines and machines. He got awful grades and didn''t care at all — "I was in a completely different world," he later wrote. His weak grades created a deep sense of inferiority that paradoxically became his greatest fuel.

He saw himself failing at everything the other children excelled at — school, sports, competitions. He was always last. He''d fake illness to avoid punishment. But slowly, a realization took shape: if he couldn''t win in their arena, he''d build his own. The humiliation of childhood became the rocket fuel for his ambition.',
 '"I was in a completely different world. Engines and machines were building my universe."',
 NULL),

('f5a6b7c8-d9e0-1234-fabe-456789012345', 3,
 'The Napoleon of Mechanics',
 'Honda''s father always told him: "When you grow up, you must be strong and famous like Napoleon." When young Soichiro later discovered that Napoleon was actually short, poor, and born on a small island — just like him — it was a revelation. "If a short, poor man from a tiny island could conquer a continent, then my short stature should be no barrier to my progress."

At fifteen, Honda saw an ad in a technical magazine called "Wheels" for an apprentice at an auto repair shop called Art Shokai in Tokyo. His father reluctantly agreed — if the boy was hopeless at school, perhaps he could learn a trade. Honda packed his bags and left for the big city, burning with the dream of becoming "the Napoleon of mechanics."',
 '"My short stature should be no barrier to my progress."',
 NULL),

('f5a6b7c8-d9e0-1234-fabe-456789012345', 4,
 'The Babysitter Who Became a Master',
 'When Honda arrived at Art Shokai, the mechanics thought he was too small and weak for real work. Instead of fixing cars, they assigned him to babysit the boss''s child. It was humiliating, but Honda refused to quit. "Going home as a failure would have been the most foolish thing I could do."

He strapped the baby to his back and wandered freely through the workshop, studying every detail of how the mechanics worked. He called himself "a general inspecting his troops." After proving his dedication, the boss finally gave him a chance. The day Honda put on his mechanic''s uniform was one of the greatest days of his life. He spent six years mastering his craft — not a single drop of oil or suspicious sound escaped his attention.',
 '"Going home as a failure would have been the most foolish thing I could do."',
 NULL),

('f5a6b7c8-d9e0-1234-fabe-456789012345', 5,
 'The Metal Spoke Revolution',
 'At twenty, Honda''s boss sent him back to his hometown to open a branch of Art Shokai. But when he arrived, he found three competing garages had already opened. Honda''s strategy was simple: take the difficult repairs others refused, and work through the night to deliver cars faster than anyone else.

The pressure sparked his genius. In those days, car wheels used wooden spokes that couldn''t handle much stress. Honda invented metal spokes to replace them — his first real invention, at age thirty. The innovation spread worldwide and made his name known far beyond his village. "This invention showed me how much enduring hardship is truly worth," he said.',
 '"Every person who wants to build an industry must endure hardship — and it is always worth it."',
 NULL),

('f5a6b7c8-d9e0-1234-fabe-456789012345', 6,
 'Failure, Illness, and Back to School',
 'Honda left Art Shokai to start his own piston ring factory — Tokai Seiki. The early results were disastrous. His piston rings crumbled like stones. The first customer returned the entire order. Friends urged him to go back to his safe repair shop life. The stress made him physically ill; he was bedridden for two months.

When he recovered, he made a shocking decision for a man who hated school: he enrolled in university to study engineering. He attended only the classes about mechanics and engine parts, completely ignoring the curriculum. After two years, he was expelled. When the dean confronted him, Honda replied: "I didn''t come here for a diploma. I came for technical knowledge." The dean was insulted, but Honda had gotten exactly what he needed.',
 '"I didn''t come here for a diploma. I came for technical knowledge."',
 NULL),

('f5a6b7c8-d9e0-1234-fabe-456789012345', 7,
 'War, Bombs, and Earthquakes',
 'Armed with his new knowledge, Honda returned to his piston ring factory and finally cracked the quality problem. Tokai Seiki began thriving. Then World War II arrived. American bombs destroyed his factory. Whatever survived the bombing was leveled by an earthquake shortly after.

Most people would have given up. Honda took a year off from production to focus on research and invention. In 1946, while Japan lay in ruins and its people struggled under crushing poverty, Honda founded the Honda Technical Research Institute. While other entrepreneurs saw only crisis, Honda saw opportunity — and one very simple, brilliant idea was taking shape in his mind.',
 NULL,
 NULL),

('f5a6b7c8-d9e0-1234-fabe-456789012345', 8,
 'The Motorized Bicycle',
 'Post-war Japan had almost no public transportation. Cars were scarce and gasoline was astronomically expensive. But Honda noticed something: everyone was riding bicycles. His brilliant idea? Attach surplus military generator engines to bicycles to create cheap motorized bikes.

He bought damaged military generators for almost nothing and mounted them on bicycle frames. The demand was explosive. When the surplus engines ran out, Honda designed his own — the Model A. He even invented a cheaper fuel by mixing gasoline with pine resin and built carburetors that dramatically cut fuel consumption. By 1948, he had established Honda Motor Company. His first real motorcycle, the "Dream," had three horsepower and wasn''t pretty — but it worked.',
 '"The miracle is nothing but willpower and persistence."',
 NULL),

('f5a6b7c8-d9e0-1234-fabe-456789012345', 9,
 'Knowing Your Weakness',
 'Despite growing sales, Honda''s company was heading toward bankruptcy. He couldn''t understand why — they were selling motorcycles, so why were they losing money? Finally, he admitted a truth that many entrepreneurs never face: "I am an inventor, not a manager."

His old friend Takeo Fujisawa — a brilliant business manager — joined the company and saved it from financial ruin. Their partnership became legendary: Honda the creative genius, Fujisawa the strategic mind. Honda later said: "When I review my life, the most important thing I''ve learned is that relationships with people matter more than any invention. The art of building connections is the greatest invention of all."',
 '"Relationships with people matter more than any invention."',
 NULL),

('f5a6b7c8-d9e0-1234-fabe-456789012345', 10,
 'Conquering the World',
 'With Fujisawa handling business, Honda unleashed his engineering genius. He created a vastly improved motorcycle that was so advanced, competitors needed ten years to copy it. Monthly production hit 25,000 units distributed through 13,000 dealers worldwide.

Then came his biggest dream: Formula One racing. In their debut season, Honda cars defeated Ferrari and Lotus. In 1962, Honda entered automobile manufacturing with a radical strategy — small, fuel-efficient cars. When the 1970s oil crisis devastated gas-guzzling American and European automakers, Honda was ready with the Civic. When environmental regulations tightened, Honda was already compliant. When robotics revolutionized manufacturing, Honda was first to adopt.

From a village boy who couldn''t swim, couldn''t study, and couldn''t even get a real job at his first workshop — Soichiro Honda proved that poverty, weakness, and harsh circumstances have absolutely nothing to do with future success.',
 '"From the heart of challenges, I built opportunities."',
 NULL);
