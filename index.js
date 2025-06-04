import { Telegraf, Markup } from "telegraf";
import Fuse from "fuse.js";
import quotes from "./quotes.json" with { type: "json"}

const bot = new Telegraf("8033387091:AAEU5gYQert52LiQkxkp31fVuHWP3weLYxk")

const fuse = new Fuse(quotes, {
  keys: ['tags'],
  threshold: 0.3,
});

// In-memory store for likes (use a DB for persistence)
const userLikes = {};

bot.command('start', (ctx) => {
  ctx.reply('Welcome! Send /quote [tag] to get a quote.\nExample: /quote motivation');
});

bot.command('quote', (ctx) => {
  const input = ctx.message.text.split(' ').slice(1).join(' ').trim();
  if (!input) return ctx.reply('Please provide a topic. Example: /quote failure');

  const results = fuse.search(input);
  if (!results.length) return ctx.reply('No matching quotes found.');

  const randomQuote = results[Math.floor(Math.random() * results.length)].item;

  ctx.replyWithMarkdown(
    `*“${randomQuote.quote}”*\n— _${randomQuote.author}_`,
    Markup.inlineKeyboard([
      Markup.button.callback('❤️ Like', `like_${randomQuote.id}`)
    ])
  );
});

bot.action(/^like_(.+)/, (ctx) => {
  const quoteId = ctx.match[1];
  const userId = ctx.from.id;

  if (!userLikes[userId]) userLikes[userId] = new Set();
  userLikes[userId].add(quoteId);

  ctx.answerCbQuery('❤️ Liked!');
});

bot.command('liked', (ctx) => {
  const userId = ctx.from.id;
  const likedIds = Array.from(userLikes[userId] || []);
  if (!likedIds.length) return ctx.reply('You haven’t liked any quotes yet.');

  const likedQuotes = quotes.filter(q => likedIds.includes(q.id)).slice(0, 5); // show latest 5
  likedQuotes.forEach((q) => {
    ctx.replyWithMarkdown(`*“${q.quote}”*\n— _${q.author}_`);
  });
});

bot.launch();
console.log('🚀 Bot running...');
