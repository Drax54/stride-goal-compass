export const motivationalQuotes = [
  "Small steps lead to big changes. Keep going! 🌟",
  "Every habit you build is a brick in the foundation of your success. 🏗️",
  "You're not just completing tasks, you're building a better version of yourself. 💪",
  "Success is built one habit at a time. You're doing great! 🎯",
  "Your future self will thank you for the habits you're building today. 🙏",
  "Each checkmark is a step towards your goals. Keep climbing! 🏔️",
  "Consistency is the key to transformation. You're on the right path! 🗝️",
  "Small daily improvements are the key to staggering long-term results. 📈",
  "You're turning goals into reality, one habit at a time. Amazing! ✨",
  "Every day you complete your habits, you're writing your success story. 📖",
  "Your dedication to your habits is inspiring. Keep shining! ⭐",
  "Building good habits is the foundation of a life well-lived. 🌈",
  "Today's habits shape tomorrow's achievements. Well done! 🎉",
  "You're proving that discipline is the bridge between goals and accomplishment. 🌉",
  "Each habit completed is a promise kept to yourself. Proud of you! 💫",
  "Your commitment to growth is admirable. Keep going! 🌱",
  "Small wins lead to big victories. You're on fire! 🔥",
  "Excellence is not an act, but a habit. You're living it! 🏆",
  "Your consistency is your superpower. Use it wisely! ⚡",
  "Today's habits are tomorrow's successes. Keep building! 🚀"
];

export const getRandomQuote = () => {
  const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
  return motivationalQuotes[randomIndex];
}; 