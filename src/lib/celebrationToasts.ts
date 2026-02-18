import { toast } from "sonner";

const CELEBRATION_MESSAGES = [
  "You absolutely crushed it! 👍",
  "You're unstoppable! 💪",
  "You're on fire right now! 🔥",
  "Nailed it right on the head! 🎉",
  "Way to go, superstar! ⭐",
  "Keep that momentum going! 🚀",
  "Look at you showing up! 🌟",
  "That's the spirit! ✨",
  "One step closer to your best self! 🏆",
  "Small wins, big changes! 🎯",
  "You're building something amazing! 💎",
  "Consistency is your superpower! ⚡",
  "Another one in the bag! 🎊",
  "You make it look easy! 😎",
  "Progress looks good on you! 💫",
];

let lastIndex = -1;

export function showCompletionCelebration() {
  // Pick a random message, avoiding the last one used
  let index: number;
  do {
    index = Math.floor(Math.random() * CELEBRATION_MESSAGES.length);
  } while (index === lastIndex && CELEBRATION_MESSAGES.length > 1);
  lastIndex = index;

  toast(CELEBRATION_MESSAGES[index], {
    duration: 2500,
    className: "celebration-toast",
  });
}
