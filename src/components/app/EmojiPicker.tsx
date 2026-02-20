import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { FluentEmoji } from '@/components/ui/FluentEmoji';

// Curated emoji categories for task planner (~600 emojis)
const EMOJI_CATEGORIES = {
  common: [
    '☀️', '🎯', '💪', '❤️', '⭐', '✨', '📖', '✏️', '☕', '💧',
    '🕐', '📅', '🔔', '✅', '⭕', '🔥', '⚡', '🌟', '💡', '🎉',
    '🏅', '🎖️', '🏆', '🥇', '📌', '🔗', '🔒', '🔓', '💎', '🪄',
    // NEW
    '🌈', '🦋', '🕊️', '🌙', '💫', '🪐', '🌞', '🌝', '🌻', '🌸',
    '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '❤️‍🔥', '💗',
    '🎊', '🥳', '🤩', '🎀', '🪩', '🏁', '🎗️', '🔮', '🧿', '⚜️',
  ],
  wellness: [
    '🧘', '🍎', '👶', '🛁', '🛏️', '🧠', '🌸', '🤲', '🌿', '🌙',
    '🥗', '😊', '🍲', '🌅', '🌇', '🌳', '💨', '🧘‍♀️', '💆', '🏃',
    '🧖', '🩺', '💊', '🫁', '🫀', '🦷', '👁️', '💤', '🥱', '🧴',
    '🪥', '🧹', '🧼', '🩹', '🌡️', '🥛', '🍵', '🍯', '🥑', '🥦',
    '🥕', '🍇', '🍓', '🫐', '🥝', '🍌', '🥜', '🌰', '🍳', '🥚',
    // NEW — mental health, anxiety, ADHD, self-care, morning/night
    '🫶', '💆‍♀️', '🧖‍♀️', '🛀', '🌬️', '🫧', '🪷', '🪸', '🌤️', '🌃',
    '🌌', '😌', '🥹', '😴', '🤧', '🩻', '💉', '🧬', '🫂', '🌙',
    '🫖', '🥐', '🧇', '🥞', '🍒', '🍑', '🥭', '🫒', '🥬', '🌽',
    '🧃', '🫗', '🍶', '🫙', '🥣', '🍱', '🥙', '🫔', '🌮', '🥗',
    '🧘‍♂️', '🏋️‍♀️', '🤾', '🧎', '🧎‍♀️', '🧍', '🧍‍♀️', '🚴‍♀️', '🏇', '🤼',
  ],
  work: [
    '💼', '🏢', '🧮', '📊', '📋', '💳', '💵', '📄', '📂', '💻',
    '✉️', '💬', '📱', '📈', '👥', '👛', '🖊️', '📝', '🗂️',
    '🖥️', '⌨️', '🖨️', '📎', '📐', '📏', '🗄️', '📮', '🏷️', '📑',
    '🗓️', '🗒️', '✒️', '🔍', '🧾', '💰', '🏦', '📠', '🗃️', '📧',
    // NEW — productivity, ADHD focus, planning, finance
    '🎙️', '🎚️', '🎛️', '🖱️', '💾', '💿', '📀', '🗜️', '🖇️', '📓',
    '📔', '📒', '📕', '📗', '📘', '📙', '🗺️', '🗿', '🧑‍💻', '👩‍💻',
    '🧑‍🏫', '👩‍🏫', '🧑‍🔬', '👩‍🔬', '🧑‍⚕️', '👩‍⚕️', '🪙', '💹', '📉', '🏧',
    '💲', '🤑', '🧑‍💼', '👩‍💼', '🤝', '🫱', '🫲', '🫳', '🫴', '🏗️',
  ],
  lifestyle: [
    '🚴', '📚', '📷', '🚗', '🐕', '🎮', '🎁', '🥤', '🎧', '🏠',
    '🔑', '🧳', '🗺️', '🎵', '🎨', '✈️', '🛍️', '🛒', '👕', '🎟️',
    '🏆', '📺', '🍽️', '🍷', '🎸', '🎹', '🎤', '🎬', '🎭', '🎪',
    '🏋️', '🤸', '⛹️', '🏊', '🚶', '🧗', '🏄', '🎣', '🛶', '⛷️',
    '🎿', '🏕️', '⛺', '🏖️', '🌊', '🚲', '🛵', '🏍️', '🚌', '🚂',
    '🛳️', '🎠', '🎡', '🎢', '🏰', '🗼', '🗽', '⛩️', '🕌', '🕍',
    // NEW — hobbies, cleaning, hygiene, home routines
    '🧶', '🪡', '🧵', '🪢', '🧷', '🪆', '🎲', '♟️', '🎭', '🎠',
    '🛁', '🧹', '🧺', '🧻', '🪣', '🪤', '🧴', '🧷', '🧲', '🪜',
    '🛗', '🏡', '🏘️', '🏚️', '🛖', '🪞', '🛋️', '🪑', '🚪', '🪟',
    '🛠️', '🔨', '🪚', '🔩', '🪛', '🧰', '🪝', '🧲', '💡', '🔦',
  ],
  social: [
    '👋', '🤝', '💑', '👨‍👩‍👧', '🎂', '🎊', '💝', '📞', '👭', '🗣️',
    '💌', '🙏', '🤗', '😍', '🥳', '👏', '🫂', '💐', '🌹', '🎀',
    '🍰', '🧁', '🎈', '🪅', '🎇', '🎆', '💒', '👰', '🤵', '👪',
    // NEW — connection, relationships, self-kindness, gratitude
    '👩‍❤️‍👨', '👩‍❤️‍👩', '👨‍❤️‍👨', '💏', '👩‍👩‍👦', '👨‍👨‍👦', '👩‍👦', '👨‍👧', '👴', '👵',
    '🧓', '🧑', '👧', '👦', '👼', '🧒', '👩‍👧‍👦', '🤱', '🫄', '🫃',
    '🫅', '🤴', '👸', '🦸', '🦸‍♀️', '🦹', '🧚', '🧚‍♀️', '🧜', '🧝',
    '🥂', '🍻', '🫖', '🍡', '🧋', '🎑', '🧧', '🪄', '🎻', '🪗',
  ],
  animals: [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
    '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦅', '🦉',
    '🦋', '🐛', '🐝', '🐞', '🦀', '🐙', '🐬', '🐳', '🦈', '🐊',
    '🦕', '🦖', '🐢', '🐍', '🦎', '🦩', '🦚', '🐿️', '🦔', '🐾',
    // NEW
    '🦌', '🦬', '🐂', '🐃', '🐄', '🐖', '🐏', '🐑', '🦙', '🐐',
    '🦘', '🦛', '🦏', '🐘', '🦒', '🦓', '🐎', '🐈', '🐈‍⬛', '🐓',
    '🦃', '🕊️', '🦆', '🦢', '🦜', '🦤', '🦭', '🐟', '🐠', '🐡',
    '🐚', '🪸', '🦞', '🦐', '🦑', '🪼', '🐌', '🦗', '🪲', '🦟',
  ],
  nature: [
    '🌍', '🌎', '🌏', '🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓',
    '☁️', '🌧️', '⛈️', '🌈', '❄️', '🌊', '🌺', '🌻', '🌼', '🌷',
    '🌱', '🪴', '🌵', '🍀', '🍁', '🍂', '🍃', '🌾', '💐', '🪻',
    // NEW — sky, seasons, elements, plants for wellness rituals
    '🌤️', '⛅', '🌦️', '🌩️', '🌨️', '🌫️', '🌬️', '🌀', '🌪️', '🌉',
    '🌃', '🌆', '🏙️', '🌄', '🏔️', '🗻', '⛰️', '🌋', '🏝️', '🏜️',
    '🪨', '🌲', '🌴', '🪵', '🍄', '🌰', '🦠', '🪺', '🪹', '🐚',
    '🌠', '🌌', '🌙', '☀️', '🌝', '🌛', '🌜', '🌚', '🌞', '⭐',
  ],
  objects: [
    '⏰', '🔧', '🔨', '🪛', '🧲', '🪜', '🧯', '🛡️', '🗡️', '⚙️',
    '🧪', '🔬', '🔭', '📡', '🛸', '🚀', '🎯', '🧩', '🎲', '♟️',
    '🪁', '🧸', '🪆', '🖼️', '🪞', '🪟', '🛋️', '🪑', '🚪', '🪣',
    // NEW — mindfulness tools, focus/ADHD, self-care objects
    '⏱️', '⏲️', '🕰️', '⌚', '📻', '🎙️', '🔑', '🗝️', '🔐', '📿',
    '🪬', '🧿', '📿', '🎐', '🪔', '🕯️', '🪑', '🧺', '🛁', '🚿',
    '🪠', '🧴', '🪥', '🧻', '🪣', '🧽', '🫧', '🧹', '🧺', '🪤',
    '🎋', '🎍', '🪅', '🎑', '🎎', '🎏', '🧧', '🎐', '🎠', '🔮',
  ],
};

// All emojis flattened with duplicates removed
const ALL_EMOJIS = [...new Set(Object.values(EMOJI_CATEGORIES).flat())];

// Emoji name map for search
const EMOJI_NAMES: Record<string, string[]> = {
  '☀️': ['sun','sunny','weather'], '🎯': ['target','goal','dart'], '💪': ['muscle','strong','flex','gym'],
  '❤️': ['heart','love','red'], '⭐': ['star','favorite'], '✨': ['sparkles','magic','shine'],
  '📖': ['book','read','study'], '✏️': ['pencil','write','edit'], '☕': ['coffee','drink','morning'],
  '💧': ['water','drop','hydrate'], '🕐': ['clock','time','hour'], '📅': ['calendar','date','schedule'],
  '🔔': ['bell','notification','alert'], '✅': ['check','done','complete','tick'], '⭕': ['circle','ring'],
  '🔥': ['fire','hot','flame'], '⚡': ['lightning','electric','fast'], '🌟': ['star','glow','shine'],
  '💡': ['idea','light','bulb'], '🎉': ['party','celebrate','confetti'], '🏅': ['medal','award'],
  '🎖️': ['medal','decoration','award'], '🏆': ['trophy','win','champion'], '🥇': ['gold','first','medal'],
  '📌': ['pin','location','mark'], '🔗': ['link','chain'], '🔒': ['lock','secure','private'],
  '🔓': ['unlock','open'], '💎': ['diamond','gem','precious'], '🪄': ['magic','wand','spell'],
  '🧘': ['yoga','meditate','calm'], '🍎': ['apple','fruit','healthy'], '👶': ['baby','child','infant'],
  '🛁': ['bath','tub','relax'], '🛏️': ['bed','sleep','rest'], '🧠': ['brain','mind','think'],
  '🌸': ['flower','pink','cherry','blossom'], '🤲': ['hands','pray','open'], '🌿': ['plant','herb','green'],
  '🌙': ['moon','night','sleep'], '🥗': ['salad','healthy','food'], '😊': ['smile','happy','face'],
  '🍲': ['soup','stew','food'], '🌅': ['sunrise','morning','dawn'], '🌇': ['sunset','city','evening'],
  '🌳': ['tree','nature','park'], '💨': ['wind','air','breath'], '🧘‍♀️': ['yoga','woman','meditate'],
  '💆': ['massage','relax','spa'], '🏃': ['run','jog','exercise'], '🧖': ['spa','face','relax'],
  '🩺': ['doctor','medical','health'], '💊': ['pill','medicine','drug'], '🫁': ['lungs','breath'],
  '🫀': ['heart','cardiac'], '🦷': ['tooth','dental'], '👁️': ['eye','see','vision'],
  '💤': ['sleep','zzz','tired'], '🥱': ['yawn','tired','sleepy'], '🧴': ['lotion','cream','skin'],
  '🪥': ['toothbrush','clean','dental'], '🧹': ['broom','clean','sweep'], '🧼': ['soap','wash','clean'],
  '🩹': ['bandaid','heal','wound'], '🌡️': ['thermometer','temperature','fever'],
  '🥛': ['milk','drink','dairy'], '🍵': ['tea','drink','warm'], '🍯': ['honey','jar','sweet'],
  '🥑': ['avocado','healthy','green'], '🥦': ['broccoli','vegetable','healthy'],
  '🥕': ['carrot','vegetable','orange'], '🍇': ['grapes','fruit','purple'],
  '🍓': ['strawberry','fruit','red'], '🫐': ['blueberry','fruit'], '🥝': ['kiwi','fruit','green'],
  '🍌': ['banana','fruit','yellow'], '🥜': ['peanut','nut'], '🌰': ['chestnut','nut'],
  '🍳': ['egg','cook','fry'], '🥚': ['egg','food'],
  '💼': ['briefcase','work','business'], '🏢': ['office','building','work'],
  '🧮': ['calculator','math','numbers'], '📊': ['chart','graph','data'],
  '📋': ['clipboard','list','notes'], '💳': ['card','credit','pay'], '💵': ['money','cash','dollar'],
  '📄': ['document','paper','file'], '📂': ['folder','files','organize'], '💻': ['laptop','computer','tech'],
  '✉️': ['email','mail','letter'], '💬': ['chat','message','comment'], '📱': ['phone','mobile','app'],
  '📈': ['chart','growth','trend'], '👥': ['people','group','team'], '👛': ['purse','wallet','money'],
  '🖊️': ['pen','write'], '📝': ['notes','memo','write'], '🗂️': ['files','organize','folder'],
  '🖥️': ['desktop','computer','monitor'], '⌨️': ['keyboard','type'], '🖨️': ['printer','print'],
  '📎': ['paperclip','attach'], '📐': ['ruler','angle','measure'], '📏': ['ruler','measure'],
  '🗄️': ['filing','cabinet','organize'], '📮': ['mailbox','post'], '🏷️': ['label','tag','price'],
  '📑': ['documents','pages'], '🗓️': ['calendar','date','planner'], '🗒️': ['notebook','notes'],
  '✒️': ['pen','nib','write'], '🔍': ['search','magnify','find'], '🧾': ['receipt','bill'],
  '💰': ['money','bag','rich'], '🏦': ['bank','money','finance'], '📠': ['fax','machine'],
  '🗃️': ['box','files','archive'], '📧': ['email','mail'],
  '🚴': ['bike','cycle','exercise'], '📚': ['books','study','library'], '📷': ['camera','photo'],
  '🚗': ['car','drive','vehicle'], '🐕': ['dog','pet','animal'], '🎮': ['game','controller','play'],
  '🎁': ['gift','present','box'], '🥤': ['drink','cup','soda'], '🎧': ['headphones','music','audio'],
  '🏠': ['home','house','building'], '🔑': ['key','lock','access'], '🧳': ['luggage','travel','bag'],
  '🗺️': ['map','travel','navigate'], '🎵': ['music','note','song'], '🎨': ['art','paint','creative'],
  '✈️': ['plane','travel','fly'], '🛍️': ['shopping','bag','buy'], '🛒': ['cart','shopping'],
  '👕': ['shirt','clothing','wear'], '🎟️': ['ticket','event'], '📺': ['tv','television','watch'],
  '🍽️': ['plate','food','eat'], '🍷': ['wine','drink','glass'], '🎸': ['guitar','music','rock'],
  '🎹': ['piano','music','keys'], '🎤': ['microphone','sing','music'], '🎬': ['movie','film','camera'],
  '🎭': ['theater','drama','arts'], '🎪': ['circus','tent','show'], '🏋️': ['weightlift','gym','strong'],
  '🤸': ['gymnastics','flexible','exercise'], '⛹️': ['basketball','sport'], '🏊': ['swim','pool','water'],
  '🚶': ['walk','person','stroll'], '🧗': ['climb','rock','sport'], '🏄': ['surf','wave','ocean'],
  '🎣': ['fish','fishing','hobby'], '🛶': ['canoe','boat','paddle'], '⛷️': ['ski','snow','winter'],
  '🎿': ['ski','slope','winter'], '🏕️': ['camp','tent','outdoor'], '⛺': ['tent','camp','outdoor'],
  '🏖️': ['beach','sand','summer'], '🌊': ['wave','ocean','water'], '🚲': ['bicycle','bike','cycle'],
  '🛵': ['scooter','motor','ride'], '🏍️': ['motorcycle','bike','ride'], '🚌': ['bus','transport'],
  '🚂': ['train','rail','transport'], '🛳️': ['ship','cruise','travel'], '🎠': ['carousel','fun'],
  '🎡': ['ferris','wheel','fun'], '🎢': ['rollercoaster','fun','ride'], '🏰': ['castle','palace'],
  '🗼': ['tower','paris','eiffel'], '🗽': ['liberty','statue','new york'], '⛩️': ['shrine','japan','gate'],
  '🕌': ['mosque','islam','prayer'], '🕍': ['synagogue','jewish'],
  '👋': ['wave','hello','hi','bye'], '🤝': ['handshake','deal','meet'], '💑': ['couple','love','romance'],
  '👨‍👩‍👧': ['family','parents','child'], '🎂': ['cake','birthday','celebrate'],
  '🎊': ['confetti','party','celebrate'], '💝': ['heart','love','gift'], '📞': ['phone','call'],
  '👭': ['friends','girls','together'], '🗣️': ['speak','talk','voice'],
  '💌': ['love letter','mail','romance'], '🙏': ['pray','thanks','please'],
  '🤗': ['hug','warm','friendly'], '😍': ['love','eyes','adore'], '🥳': ['party','celebrate','birthday'],
  '👏': ['clap','applaud','bravo'], '🫂': ['hug','embrace','comfort'], '💐': ['flowers','bouquet'],
  '🌹': ['rose','flower','love'], '🎀': ['bow','ribbon','gift'], '🍰': ['cake','slice','sweet'],
  '🧁': ['cupcake','sweet','bake'], '🎈': ['balloon','party','celebrate'], '🪅': ['pinata','fiesta'],
  '🎇': ['fireworks','sparkler','celebrate'], '🎆': ['fireworks','celebrate'], '💒': ['wedding','church'],
  '👰': ['bride','wedding'], '🤵': ['groom','suit','wedding'], '👪': ['family','home'],
  '🐶': ['dog','puppy','pet'], '🐱': ['cat','kitten','pet'], '🐭': ['mouse','rodent'],
  '🐹': ['hamster','pet'], '🐰': ['rabbit','bunny','pet'], '🦊': ['fox','animal'],
  '🐻': ['bear','animal'], '🐼': ['panda','bear','china'], '🐨': ['koala','australia'],
  '🐯': ['tiger','cat','stripe'], '🦁': ['lion','king','animal'], '🐮': ['cow','milk','animal'],
  '🐷': ['pig','oink','animal'], '🐸': ['frog','green','jump'], '🐵': ['monkey','ape','animal'],
  '🐔': ['chicken','bird','farm'], '🐧': ['penguin','bird','cold'], '🐦': ['bird','tweet','fly'],
  '🦅': ['eagle','bird','fly'], '🦉': ['owl','wise','night'], '🦋': ['butterfly','insect','beautiful'],
  '🐛': ['caterpillar','worm','insect'], '🐝': ['bee','honey','insect'], '🐞': ['ladybug','insect','red'],
  '🦀': ['crab','seafood','red'], '🐙': ['octopus','sea','tentacle'], '🐬': ['dolphin','sea','smart'],
  '🐳': ['whale','ocean','big'], '🦈': ['shark','ocean','danger'], '🐊': ['crocodile','reptile'],
  '🦕': ['dinosaur','dino','ancient'], '🦖': ['trex','dinosaur','ancient'], '🐢': ['turtle','slow','shell'],
  '🐍': ['snake','reptile'], '🦎': ['lizard','reptile'], '🦩': ['flamingo','pink','bird'],
  '🦚': ['peacock','colorful','bird'], '🐿️': ['squirrel','nut','animal'], '🦔': ['hedgehog','spiky'],
  '🐾': ['paw','tracks','animal'],
  '🌍': ['earth','world','globe'], '🌎': ['earth','americas','globe'], '🌏': ['earth','asia','globe'],
  '🌕': ['moon','full','night'], '☁️': ['cloud','weather','sky'], '🌧️': ['rain','weather','cloud'],
  '⛈️': ['storm','thunder','rain'], '🌈': ['rainbow','colorful','sky'], '❄️': ['snow','cold','winter'],
  '🌺': ['flower','tropical','pink'], '🌻': ['sunflower','yellow','flower'], '🌼': ['daisy','flower','yellow'],
  '🌷': ['tulip','flower','spring'], '🌱': ['sprout','grow','plant'], '🪴': ['plant','pot','indoor'],
  '🌵': ['cactus','desert','plant'], '🍀': ['clover','lucky','green'], '🍁': ['maple','autumn','leaf'],
  '🍂': ['autumn','leaf','fall'], '🍃': ['leaf','green','nature'], '🌾': ['wheat','grain','farm'],
  '🪻': ['hyacinth','flower','purple'],
  '⏰': ['alarm','clock','wake','time'], '🔧': ['wrench','tool','fix'], '🔨': ['hammer','build','tool'],
  '🪛': ['screwdriver','tool','fix'], '🧲': ['magnet','attract'], '🪜': ['ladder','climb'],
  '🧯': ['extinguisher','fire','safety'], '🛡️': ['shield','protect','defense'],
  '🗡️': ['sword','weapon','blade'], '⚙️': ['gear','settings','mechanic'],
  '🧪': ['test tube','science','lab'], '🔬': ['microscope','science','research'],
  '🔭': ['telescope','star','space'], '📡': ['satellite','signal','antenna'],
  '🛸': ['ufo','alien','space'], '🚀': ['rocket','space','launch'],
  '🧩': ['puzzle','piece','solve'], '🎲': ['dice','game','random'], '♟️': ['chess','strategy','game'],
  '🪁': ['slingshot','bow','toy'], '🧸': ['teddy','bear','toy'], '🪆': ['doll','matryoshka','russian'],
  '🖼️': ['picture','frame','art'], '🪞': ['mirror','reflect'], '🪟': ['window','glass','view'],
  '🛋️': ['sofa','couch','relax'], '🪑': ['chair','seat','sit'], '🚪': ['door','entrance','exit'],
  '🪣': ['bucket','pail','water'],
};

interface EmojiPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEmoji: string;
  onSelect: (emoji: string) => void;
}

export function EmojiPicker({
  open,
  onOpenChange,
  selectedEmoji,
  onSelect,
}: EmojiPickerProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<keyof typeof EMOJI_CATEGORIES | 'all'>('common');

  const filteredEmojis = useMemo(() => {
    const emojiList = activeCategory === 'all' 
      ? ALL_EMOJIS 
      : EMOJI_CATEGORIES[activeCategory];
    
    if (!search.trim()) return emojiList;
    
    const q = search.toLowerCase().trim();
    return emojiList.filter(emoji => {
      const names = EMOJI_NAMES[emoji] || [];
      return names.some(name => name.includes(q));
    });
  }, [search, activeCategory]);

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    onOpenChange(false);
    setSearch('');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
        <SheetHeader className="pb-2">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-bold">Choose Emoji</SheetTitle>
          </div>
        </SheetHeader>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="pl-9 rounded-xl bg-muted/50 border-0"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-2 scrollbar-hide">
          {(['common', 'wellness', 'work', 'lifestyle', 'social', 'animals', 'nature', 'objects', 'all'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                activeCategory === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* Emoji grid */}
        <div className="overflow-y-auto h-[calc(100%-140px)] overscroll-contain">
          <div className="grid grid-cols-6 gap-2">
            {filteredEmojis.map((emoji, index) => (
              <button
                key={`${emoji}-${index}`}
                onClick={() => handleSelect(emoji)}
                className={cn(
                  'aspect-square rounded-2xl flex items-center justify-center transition-all active:scale-95',
                  'bg-muted/60 hover:bg-muted',
                  selectedEmoji === emoji && 'bg-primary/10 ring-2 ring-primary'
                )}
              >
                <FluentEmoji emoji={emoji} size={28} />
              </button>
            ))}
          </div>
          
          {filteredEmojis.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No emojis found
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default EmojiPicker;
