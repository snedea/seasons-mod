// Every month's words, in one plain module with no imports, so the sayings list
// in docs/SAYINGS.md can be written straight from it (scripts/sayings.ts).
//
// verbs: the spinner while Claude works ("Conjuring..."), one per turn.
// past: the line a turn closes with ("Brewed for 12s").
// taglines: after the title in the logo block, one at a time.

export const WORDS = [
  {
    verbs: [
      'Bundling up', 'Shoveling', 'Sledding', 'Thawing', 'Defrosting', 'Snowballing', 'Hibernating',
      'Ice skating', 'Sipping cocoa', 'Building a snowman', 'Making resolutions', 'Scraping the windshield',
      'Knitting', 'Warming up', 'Catching snowflakes', 'Drifting',
    ],
    past: [
      'Thawed', 'Shoveled', 'Sledded', 'Defrosted', 'Bundled', 'Hibernated', 'Skated', 'Knitted',
      'Resolved', 'Drifted', 'Warmed',
    ],
    taglines: ['fresh start', 'stay cozy', 'snow day', 'mind the ice', 'new year, new diffs', 'cocoa break'],
  },
  {
    verbs: [
      'Swooning', 'Courting', 'Serenading', 'Blushing', 'Writing love letters', 'Picking roses',
      'Sharing chocolates', 'Holding hands', 'Daydreaming', 'Twitterpating', 'Wooing', 'Cuddling',
      'Pining', 'Making a mixtape',
    ],
    past: ['Swooned', 'Courted', 'Serenaded', 'Wooed', 'Cuddled', 'Blushed', 'Charmed', 'Smitten'],
    taglines: ['be mine', 'you had me at hello world', 'xoxo', 'love at first commit', 'sweet nothings'],
  },
  {
    verbs: [
      'Sprouting', 'Chasing rainbows', 'Finding gold', 'Greening', 'Unfurling', 'Counting clovers',
      'Kite flying', 'Thawing out', 'Waking up', 'Stretching', 'Budding', 'Feeling lucky',
      'Following the rainbow', 'Puddle hopping',
    ],
    past: ['Sprouted', 'Unfurled', 'Budded', 'Greened', 'Woke', 'Stretched', 'Lucked out', 'Flew'],
    taglines: ['luck of the draw', 'gold at the end', 'four leaves', 'spring forward', 'kites up'],
  },
  {
    verbs: [
      'Hopping', 'Egg hunting', 'Blossoming', 'Puddle jumping', 'Nesting', 'Hatching', 'Painting eggs',
      'Fluttering', 'Dodging showers', 'Basketweaving', 'Peeping', 'Growing', 'Hiding eggs', 'Sprinkling',
    ],
    past: ['Hopped', 'Hatched', 'Blossomed', 'Nested', 'Fluttered', 'Peeped', 'Grew', 'Sprinkled'],
    taglines: ['showers bring flowers', 'some bunny loves you', 'egg-cellent', 'no fooling', 'fresh out of the shell'],
  },
  {
    verbs: [
      'Gardening', 'Pollinating', 'Buzzing', 'Blooming', 'Photosynthesizing', 'Mulching', 'Weeding',
      'Watering', 'Planting seeds', 'Pruning', 'Repotting', 'Smelling the roses', 'Making honey',
      'Crawling along',
    ],
    past: ['Gardened', 'Pollinated', 'Buzzed', 'Bloomed', 'Mulched', 'Watered', 'Pruned', 'Planted'],
    taglines: ['in full bloom', 'busy as a bee', 'slow and steady', 'grow your own', 'petal to the metal'],
  },
  {
    verbs: [
      'Sunbathing', 'Surfing', 'Building sandcastles', 'Snorkeling', 'Beachcombing', 'Applying sunscreen',
      'Catching waves', 'Collecting shells', 'Floating', 'Scuttling sideways', 'Splashing', 'Paddling',
      'Burying toes', 'Chasing seagulls',
    ],
    past: ['Surfed', 'Sunbathed', 'Snorkeled', 'Floated', 'Splashed', 'Paddled', 'Scuttled', 'Beached'],
    taglines: ['surf\'s up', 'sun\'s out', 'shore thing', 'sea you soon', 'vitamin sea'],
  },
  {
    verbs: [
      'Grilling', 'Picnicking', 'Sparkling', 'Stargazing', 'Celebrating', 'Lighting fuses', 'Flipping burgers',
      'Eating watermelon', 'Waving sparklers', 'Oohing and aahing', 'Catching fireflies', 'Parading',
      'Spitting seeds', 'Lounging',
    ],
    past: ['Grilled', 'Picnicked', 'Sparkled', 'Celebrated', 'Paraded', 'Lounged', 'Flipped', 'Dazzled'],
    taglines: ['light it up', 'oooh, aaah', 'pass the watermelon', 'long summer nights', 'sparklers out'],
  },
  {
    verbs: [
      'Camping', 'Pitching the tent', 'Toasting marshmallows', 'Telling campfire stories', 'Hiking',
      'Making s\'mores', 'Counting stars', 'Wishing on a star', 'Roughing it', 'Swatting mosquitoes',
      'Chirping', 'Kindling', 'Paddling the canoe', 'Reading the map',
    ],
    past: ['Camped', 'Toasted', 'Hiked', 'Wished', 'Kindled', 'Chirped', 'Roughed it', 'Trekked'],
    taglines: ['make a wish', 'under the stars', 'pass the s\'mores', 'leave no trace', 'campfire glow'],
  },
  {
    verbs: [
      'Studying', 'Taking notes', 'Raising a hand', 'Cramming', 'Doing homework', 'Sharpening pencils',
      'Packing a lunch', 'Showing work', 'Reading ahead', 'Solving for x', 'Passing notes',
      'Apple polishing', 'Catching the bus', 'Learning',
    ],
    past: ['Studied', 'Learned', 'Crammed', 'Graded', 'Sharpened', 'Solved', 'Aced', 'Annotated'],
    taglines: ['show your work', 'gold star', 'pop quiz', 'class is in session', 'extra credit'],
  },
  {
    verbs: [
      'Conjuring', 'Brewing', 'Haunting', 'Summoning', 'Bewitching', 'Hexing', 'Cackling',
      'Lurking', 'Scheming', 'Spellcasting', 'Moonlighting', 'Carving', 'Creeping', 'Skulking',
      'Divining', 'Enchanting', 'Stirring the cauldron', 'Rattling bones', 'Consulting the spirits',
      'Raising the dead', 'Reading the tea leaves', 'Trick-or-treating', 'Spinning webs',
    ],
    past: [
      'Conjured', 'Brewed', 'Haunted', 'Summoned', 'Bewitched', 'Hexed', 'Cackled', 'Lurked',
      'Schemed', 'Spellcast', 'Carved', 'Crept', 'Skulked', 'Divined', 'Enchanted', 'Spun',
    ],
    taglines: [
      'happy haunting', 'trick or treat', 'the build is haunted', 'boo.',
      'something wicked this way compiles', 'no bugs, only ghosts',
    ],
  },
  {
    verbs: [
      'Raking', 'Feasting', 'Gathering acorns', 'Giving thanks', 'Carving', 'Basting', 'Harvesting',
      'Baking pie', 'Leaf peeping', 'Stuffing', 'Passing the gravy', 'Napping it off', 'Stashing acorns',
      'Migrating south',
    ],
    past: ['Raked', 'Feasted', 'Basted', 'Harvested', 'Baked', 'Stuffed', 'Gathered', 'Thanked'],
    taglines: ['gravy train', 'leaf it to me', 'grateful', 'save room for pie', 'falling for you'],
  },
  {
    verbs: [
      'Wrapping', 'Jingling', 'Decking the halls', 'Baking cookies', 'Checking it twice', 'Caroling',
      'Trimming the tree', 'Stringing lights', 'Sledding', 'Making a list', 'Hanging stockings',
      'Roasting chestnuts', 'Unwrapping', 'Wishing',
    ],
    past: ['Wrapped', 'Jingled', 'Baked', 'Caroled', 'Trimmed', 'Unwrapped', 'Gifted', 'Decked'],
    taglines: ['tis the season', 'nice list', 'let it snow', 'cocoa and code', 'warm wishes'],
  },
] as const
