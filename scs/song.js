const { bmbtz } = require('../devbmb/bmbtz');
const axios = require('axios');
const fs = require('fs-extra');
const { sendMessage, repondre } = require(__dirname + "/../devbmb/context");
const { igdl } = require('ruhend-scraper');
const conf = require(__dirname + "/../settings");
const getFBInfo = require("@xaviabot/fb-downloader");

// Context info function (cleaned)
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
    };
  } catch (error) {
    console.error(`Error in commonContextInfo: ${error.message}`);
    return {};
  }
}

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

// FACEBOOK
bmbtz({
  nomCom: "facebook1",
  aliases: ["fbdl", "facebookdl", "fb"],
  categorie: "Download",
  reaction: "📽️"
}, async (dest, zk, commandeOptions) => {
  const { ms, arg } = commandeOptions;

  if (!arg || !arg[0]) {
    return repondre(zk, dest, ms, 'Please provide a Facebook video URL!');
  }

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
      caption: caption,
      contextInfo: commonContextInfo()
    }, { quoted: ms });

    const messageId = message.key.id;

    const replyHandler = async (update) => {
      try {
        const messageContent = update.messages[0];
        if (!messageContent.message) return;

        const isReply = messageContent.message.extendedTextMessage?.contextInfo?.stanzaId === messageId;
        if (!isReply) return;

        const responseText = messageContent.message.conversation ||
          messageContent.message.extendedTextMessage?.text;

        if (!['1', '2', '3', '4', '5'].includes(responseText)) {
          return await zk.sendMessage(dest, {
            text: "Invalid option. Please reply with a number between 1-5.",
            quoted: messageContent,
            contextInfo: commonContextInfo()
          });
        }

        await zk.sendMessage(dest, {
          react: { text: '⬇️', key: messageContent.key },
        });

        switch (responseText) {
          case '1':
            await zk.sendMessage(dest, {
              video: { url: videoData.sd },
              caption: `*${conf.BOT || 'Facebook Downloader'}* - SD Quality`,
              contextInfo: commonContextInfo()
            }, { quoted: messageContent });
            break;

          case '2':
            if (videoData.hd) {
              await zk.sendMessage(dest, {
                video: { url: videoData.hd },
                caption: `*${conf.BOT || 'Facebook Downloader'}* - HD Quality`,
                contextInfo: commonContextInfo()
              }, { quoted: messageContent });
            } else {
              await zk.sendMessage(dest, {
                text: "HD quality not available. Sending SD quality instead.",
                quoted: messageContent,
                contextInfo: commonContextInfo()
              });
              await zk.sendMessage(dest, {
                video: { url: videoData.sd },
                caption: `*${conf.BOT || 'Facebook Downloader'}* - SD Quality`,
                contextInfo: commonContextInfo()
              }, { quoted: messageContent });
            }
            break;

          case '3':
            await zk.sendMessage(dest, {
              audio: { url: videoData.sd },
              mimetype: "audio/mpeg",
              caption: `*${conf.BOT || 'Facebook Downloader'}* - Audio`,
              contextInfo: commonContextInfo()
            }, { quoted: messageContent });
            break;

          case '4':
            await zk.sendMessage(dest, {
              document: { url: videoData.sd },
              mimetype: "video/mp4",
              fileName: `${conf.BOT || 'Facebook'}_${Date.now()}.mp4`,
              caption: `*${conf.BOT || 'Facebook Downloader'}* - Video Document`,
              contextInfo: commonContextInfo()
            }, { quoted: messageContent });
            break;

          case '5':
            await zk.sendMessage(dest, {
              audio: { url: videoData.sd },
              mimetype: "audio/ogg; codecs=opus",
              ptt: true,
              caption: `*${conf.BOT || 'Facebook Downloader'}* - Voice Message`,
              contextInfo: commonContextInfo()
            }, { quoted: messageContent });
            break;
        }

        await zk.sendMessage(dest, {
          react: { text: '✅', key: messageContent.key },
        });

      } catch (error) {
        console.error("Error handling reply:", error);
        await zk.sendMessage(dest, {
          text: "An error occurred while processing your request. Please try again.",
          quoted: update.messages[0],
          contextInfo: commonContextInfo()
        });
      }
    };

    zk.ev.on("messages.upsert", replyHandler);
    setTimeout(() => {
      zk.ev.off("messages.upsert", replyHandler);
    }, 300000);

  } catch (error) {
    console.error("Facebook download error:", error);
    repondre(zk, dest, ms, `Failed to download video. Error: ${error.message}\nYou can try with another link or check if the video is public.`);
  }
});
