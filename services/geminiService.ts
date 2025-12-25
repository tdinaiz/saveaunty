
const WIN_QUOTES = [
  "Not bad. Now go pay your rent, or get out!",
  "Aunty is safe. Bone! Stop looking at other women!",
  "Hmph. My curlers didn't even move. Good.",
  "You think saving me earns a discount? DOUBLE RENT!",
  "Bees? I've dealt with the Axe Gang. These are nothing.",
  "Quiet! I'm trying to enjoy my cigarette!",
  "Landlady power! Move it to the next alley!",
  "You're lucky I didn't have to use my Lion's Roar!",
  "Bone! Bring me my slippers! The floor is dirty!",
  "Is that all? I can run faster than those bees!",
  "Pigsty Alley is safe... for now. Pay up!",
  "My husband Bone could have done that... if he wasn't so lazy!",
  "I'm the master of Pigsty Alley! Don't forget it!",
  "Hmph. At least my hair didn't get messy.",
  "Saving me is your duty as a tenant!",
  "Don't expect a 'thank you'. Just expect a rent hike!",
  "Those bees move like snails compared to my kicks!",
  "I was just about to scream them to death myself.",
  "You're slightly more useful than my husband. Slightly!",
  "Go tell the others: the Landlady is untouchable!",
  "Saving me won't fix your leaking ceiling! PAY UP!",
  "Hmph! That drawing looks like Bone's cooking - MESSY!",
  "You save the Landlady, but you still owe for last month!",
  "Is that all? I've seen better lines on a cheap suit!",
  "Clean my slippers next time, then we'll talk about rent!",
  "My Lion's Roar would have been faster, but thanks anyway.",
  "Rent is due on the 1st! Today is the 1st! GO!",
  "I'm safe, now go get me a new pack of cigarettes!",
  "Don't touch the curlers! They're expensive!",
  "Pigsty Alley is for winners. You passed... barely.",
  "If only Bone was this fast at doing dishes!",
  "I could have used the Lion's Roar, but I didn't want to wake the neighbors.",
  "Good. Now go scrub the stairs. Rent is still double!",
  "You're lucky I'm in a good mood. Normally I'd evict you for the dust.",
  "The Axe Gang? The Bees? They're all the same - annoying!",
  "I've got a cigarette and my life. What else do I need? RENT!",
  "Don't get cocky. You're still three months behind!",
  "My curlers are still perfectly aligned. Impressive.",
  "That shield was almost as solid as my grip on your security deposit!",
  "Next time, save me with a little more style, will you?",
  "Aunty is fine. Now get back to work or I'll double your utilities!",
  "Hmph. Those bees were easier than getting rent out of the Coolie!",
  "You think you're a hero? You're still just a tenant. PAY!",
  "Bone! Look! This one actually did something useful for once!",
  "My slippers didn't even touch the ground. Perfect.",
  "Don't flatter yourself. I would have used the Lion's Roar in 2 seconds."
];

const FAIL_QUOTES = [
  "Useless! You're evicted from Pigsty Alley today!",
  "My husband Bone draws better than you, and he's a fool!",
  "If I get stung, I'm burning your lease!",
  "I dropped my cigarette because of you! YOU PAY!",
  "Stop playing and protect my property, you brat!",
  "Too slow! I'll kick you out with one foot!",
  "Stung again? What a disgrace to Kung Fu!",
  "Even a member of the Axe Gang is more helpful than you!",
  "ARE YOU BLIND?! Look at my hair! It's ruined!",
  "I should have used the Lion's Roar on YOU instead!",
  "NO RENT, NO SAFETY! GET OUT!",
  "Wait until I tell Bone how much you failed!",
  "My slippers are worth more than your drawing skills!",
  "One more mistake and you're sleeping on the street!",
  "You call that a defense? My cat has better reflexes!",
  "The Axe Gang would be ashamed of such poor protection!",
  "I'm charging you extra for every sting I get!",
  "Your kung fu is weak, and your rent is late!",
  "Disgraceful! I'm calling the moving company right now!",
  "I'd rather let Bone protect me, and he's asleep!",
  "MY BEAUTIFUL FACE! YOU'RE EVICTED FOREVER!",
  "THAT LINE IS AS WEAK AS YOUR BANK ACCOUNT!",
  "I'M SCREAMING! CAN YOU HEAR ME? LOUDER! LOUDER!",
  "BONE! GET THE BROOM! WE HAVE A STUPID TENANT TO SWEEP!",
  "EVEN THE AXE GANG HAS BETTER AIM THAN YOU!",
  "MY CURLERS ARE TANGLED! YOU PAY FOR THE SALON!",
  "GO LIVE IN THE SEWER! PIGSTY ALLEY IS FOR EXPERTS!",
  "I TOLD YOU NO PETS! THESE BEES ARE YOUR FAULT!",
  "YOU DRAW LIKE A DRUNKEN TAILOR! GET OUT!",
  "LATE RENT AND NO TALENT? THE WORST COMBINATION!",
  "I've seen better defense from a wet paper bag!",
  "You call that Kung Fu? I call that a mess! GET OUT!",
  "My grandmother could protect me better, and she's a ghost!",
  "If I find a single sting, I'm taking your furniture!",
  "BONE! THE TENANT IS BROKEN! THROW THEM IN THE TRASH!",
  "I'M CHARGING YOU BY THE BEE NOW! THAT'S TEN BEES! PAY UP!",
  "You're about as useful as a screen door on a submarine!",
  "My hair! My cigarette! My dignity! ALL GONE!",
  "Don't look at me! Look at the eviction notice on your door!",
  "You failed the Landlady. There is no greater sin in Pigsty Alley!",
  "I TOLD YOU TO PROTECT ME, NOT FEED ME TO THE BEES!",
  "My cigarette went out because of your incompetence! YOU OWE ME!",
  "Bone! Get the lease agreement! We need to add a 'Failure' fee!",
  "Even the Donut Maker has better reflexes than you!",
  "Your drawing is a disaster, just like your credit score!",
  "STUNG! I WAS STUNG! THE ENTIRE ALLEY WILL HEAR ABOUT THIS!"
];

/**
 * Returns a character-accurate quote from the Landlady.
 * Uses the levelTitle (or could use ID) to help vary the selection.
 */
export async function getGameFeedback(outcome: 'win' | 'fail', levelTitle: string) {
  const quotes = outcome === 'win' ? WIN_QUOTES : FAIL_QUOTES;
  
  // Use a simple hash of the level title to pick a base index, 
  // then add a random offset to ensure it's not ALWAYS the same for that level,
  // but heavily varied.
  const hash = levelTitle.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const randomIndex = (hash + Math.floor(Math.random() * 5)) % quotes.length;
  const selectedQuote = quotes[randomIndex];
  
  return Promise.resolve(selectedQuote);
}
