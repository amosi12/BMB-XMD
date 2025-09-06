const { bmbtz } = require('../devbmb/bmbtz');
const axios = require('axios');
const fs = require('fs-extra');
const { sendMessage, repondre } = require(__dirname + "/../devbmb/context");
const { igdl } = require('ruhend-scraper');
const conf = require(__dirname + "/../settings");
const getFBInfo = require("@xaviabot/fb-downloader");

// Context info function
function commonContextInfo() {
  try {
    return {
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: "120363382023564830@newsletter",
        newsletterName: "Bmb Tech Updates",
        serverMessageId: Math.floor(100000 + Math.random() * 900000),
      },
      externalAdReply: {
        showAdAttribution: true,
        title: conf.BOT || 'Bmb Tech Updates',
        mediaType: 1,
        renderLargerThumbnail: true,
      },
    };
  } catch (error) {
    console.error(`Error in commonContextInfo: ${error.message}`);
    return {};
  }
}

// Format views
function formatViews(views) {
  if (typeof views === 'number') {
    if (views >= 1000000) {
      return (views / 1000000).toFixed(1) + 'M';
    } else if (views >= 1000) {
      return (views / 1000).toFixed(1) + 'K';
    }
    return views.toString();
  }
  return views;
}

// ================= FACEBOOK =================
bmbtz({
  nomCom: "facebook1",
  aliases: ["fbdl", "facebookdl", "fb"],
  categorie: "Download",
  reaction: "📽️"
}, async (dest, zk, commandeOptions) => {
  const { ms, arg } = commandeOptions;
  if (!arg || !arg[0]) return repondre(zk, dest, ms, 'Please provide a Facebook video URL!');
  const fbUrl = arg[0].trim();
  if (!fbUrl.includes('https://') || !fbUrl.includes('facebook.com')) {
    return repondre(zk, dest, ms, "Please provide a valid Facebook video URL.");
  }
  try {
    const videoData = await getFBInfo(fbUrl);
    if (!videoData || !videoData.sd) {
      return repondre(zk, dest, ms, "Could not retrieve video information. The link may be invalid or private.");
    }
    const caption = `
     *${conf.BOT || 'Facebook Downloader'} Facebook Downloader*
    |__________________________|
    |       *ᴛɪᴛʟᴇ*  
           ${videoData.title || 'No title available'}
    |_________________________|
    | REPLY WITH BELOW NUMBERS
    |_________________________|
    |____  *ᴠɪᴅᴇᴏ ᴅᴏᴡɴʟᴏᴀᴅ*  ____
    |-᳆  1. SD Quality
    |-᳆  2. HD Quality
    |_________________________|
    |____  *ᴀᴜᴅɪᴏ ᴅᴏᴡɴʟᴏᴀᴅ*  ____
    |-᳆  3. Audio Only
    |-᳆  4. As Document
    |-᳆  5. As Voice Message
    |__________________________|
    `;
    const message = await zk.sendMessage(dest, {
      image: { url: videoData.thumbnail || '' },
      caption,
      contextInfo: commonContextInfo()
    }, { quoted: ms });
    const messageId = message.key.id;
    const replyHandler = async (update) => {
      try {
        const msg = update.messages[0];
        if (!msg.message) return;
        const isReply = msg.message.extendedTextMessage?.contextInfo?.stanzaId === messageId;
        if (!isReply) return;
        const responseText = msg.message.conversation || msg.message.extendedTextMessage?.text;
        if (!['1','2','3','4','5'].includes(responseText)) {
          return zk.sendMessage(dest, { text: "Invalid option. Reply with 1-5.", quoted: msg, contextInfo: commonContextInfo() });
        }
        await zk.sendMessage(dest, { react: { text: '⬇️', key: msg.key } });
        switch (responseText) {
          case '1': await zk.sendMessage(dest, { video: { url: videoData.sd }, caption: "SD Quality", contextInfo: commonContextInfo() }, { quoted: msg }); break;
          case '2': await zk.sendMessage(dest, { video: { url: videoData.hd || videoData.sd }, caption: "HD Quality", contextInfo: commonContextInfo() }, { quoted: msg }); break;
          case '3': await zk.sendMessage(dest, { audio: { url: videoData.sd }, mimetype: "audio/mpeg", caption: "Audio Only", contextInfo: commonContextInfo() }, { quoted: msg }); break;
          case '4': await zk.sendMessage(dest, { document: { url: videoData.sd }, mimetype: "video/mp4", fileName: `FB_${Date.now()}.mp4`, caption: "Video Doc", contextInfo: commonContextInfo() }, { quoted: msg }); break;
          case '5': await zk.sendMessage(dest, { audio: { url: videoData.sd }, mimetype: "audio/ogg; codecs=opus", ptt: true, caption: "Voice Msg", contextInfo: commonContextInfo() }, { quoted: msg }); break;
        }
        await zk.sendMessage(dest, { react: { text: '✅', key: msg.key } });
      } catch (err) { console.error("Error:", err); }
    };
    zk.ev.on("messages.upsert", replyHandler);
    setTimeout(() => { zk.ev.off("messages.upsert", replyHandler); }, 300000);
  } catch (error) {
    repondre(zk, dest, ms, `Error: ${error.message}`);
  }
});

// ================= INSTAGRAM =================
bmbtz({
  nomCom: "instagram",
  aliases: ["igdl", "ig"],
  categorie: "Download",
  reaction: "📸"
}, async (dest, zk, commandeOptions) => {
  const { ms, arg } = commandeOptions;
  if (!arg || !arg[0]) return repondre(zk, dest, ms, 'Provide an Instagram URL!');
  try {
    const data = await igdl(arg[0]);
    if (!data || data.length === 0) return repondre(zk, dest, ms, "No media found.");
    for (let item of data) {
      if (item.url.includes(".mp4")) {
        await zk.sendMessage(dest, { video: { url: item.url }, caption: "Instagram Video", contextInfo: commonContextInfo() }, { quoted: ms });
      } else {
        await zk.sendMessage(dest, { image: { url: item.url }, caption: "Instagram Image", contextInfo: commonContextInfo() }, { quoted: ms });
      }
    }
  } catch (err) { repondre(zk, dest, ms, "Error: " + err.message); }
});

// ================= TWITTER =================
bmbtz({
  nomCom: "twitter",
  aliases: ["tw", "twitdl"],
  categorie: "Download",
  reaction: "🐦"
}, async (dest, zk, commandeOptions) => {
  const { ms, arg } = commandeOptions;
  if (!arg || !arg[0]) return repondre(zk, dest, ms, 'Provide a Twitter URL!');
  try {
    const res = await axios.get(`https://api.vihangayt.me/download/twitter?url=${encodeURIComponent(arg[0])}`);
    const video = res.data.data.HD || res.data.data.SD;
    await zk.sendMessage(dest, { video: { url: video }, caption: "Twitter Video", contextInfo: commonContextInfo() }, { quoted: ms });
  } catch (err) { repondre(zk, dest, ms, "Error: " + err.message); }
});

// ================= TIKTOK =================
bmbtz({
  nomCom: "tiktok",
  aliases: ["tt", "ttdl"],
  categorie: "Download",
  reaction: "🎵"
}, async (dest, zk, commandeOptions) => {
  const { ms, arg } = commandeOptions;
  if (!arg || !arg[0]) return repondre(zk, dest, ms, 'Provide a TikTok URL!');
  try {
    const res = await axios.get(`https://api.vihangayt.me/download/tiktok?url=${encodeURIComponent(arg[0])}`);
    const video = res.data.data.play || res.data.data.nowm;
    await zk.sendMessage(dest, { video: { url: video }, caption: "TikTok Video", contextInfo: commonContextInfo() }, { quoted: ms });
  } catch (err) { repondre(zk, dest, ms, "Error: " + err.message); }
});

// ================= MEDIAFIRE =================
bmbtz({
  nomCom: "mediafire",
  aliases: ["mfire", "mf"],
  categorie: "Download",
  reaction: "📂"
}, async (dest, zk, commandeOptions) => {
  const { ms, arg } = commandeOptions;
  if (!arg || !arg[0]) return repondre(zk, dest, ms, 'Provide a Mediafire URL!');
  try {
    const res = await axios.get(`https://api.vihangayt.me/download/mediafire?url=${encodeURIComponent(arg[0])}`);
    const file = res.data.data;
    await zk.sendMessage(dest, { document: { url: file.link }, mimetype: file.mime, fileName: file.filename, caption: "Mediafire File", contextInfo: commonContextInfo() }, { quoted: ms });
  } catch (err) { repondre(zk, dest, ms, "Error: " + err.message); }
});

// ================= HENTAIVID =================
bmbtz({
  nomCom: "hentaivid",
  aliases: ["hentai"],
  categorie: "Download",
  reaction: "🔞"
}, async (dest, zk, commandeOptions) => {
  const { ms, arg } = commandeOptions;
  if (!arg || !arg[0]) return repondre(zk, dest, ms, 'Provide a Hentaivid URL!');
  try {
    const res = await axios.get(`https://api.vihangayt.me/download/hentaivid?url=${encodeURIComponent(arg[0])}`);
    const video = res.data.data.video;
    await zk.sendMessage(dest, { video: { url: video }, caption: "Hentaivid Video", contextInfo: commonContextInfo() }, { quoted: ms });
  } catch (err) { repondre(zk, dest, ms, "Error: " + err.message); }
});
