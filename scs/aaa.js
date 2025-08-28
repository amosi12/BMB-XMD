const { bmbtz } = require('../devbmb/bmbtz');
const { addOrUpdateDataInAlive, getDataFromAlive } = require('../lib/alive');
const moment = require("moment-timezone");
const s = require(__dirname + "/../settings");
const path = require("path");
const fs = require("fs");

// VCard Contact (Meta AI Verified)
const quotedContact = {
  key: {
    fromMe: false,
    participant: `0@s.whatsapp.net`,
    remoteJid: "status@broadcast"
  },
  message: {
    contactMessage: {
      displayName: "Meta AI ✅",
      vcard: 
`BEGIN:VCARD
VERSION:3.0
FN:Meta AI ✅
ORG:Meta AI Bot;
TEL;type=CELL;type=VOICE;waid=254700000001:+254 700 000001
END:VCARD`
    }
  }
};

// Newsletter context
const newsletterContext = {
  contextInfo: {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: "120363382023564830@newsletter",
      newsletterName: "Meta AI Updates",
      serverMessageId: 1
    }
  }
};

// Function to send random image or fallback to text
async function sendMetaAIAlive(zk, dest, repondre) {
    const scsFolder = path.join(__dirname, "../scs");
    const files = fs.existsSync(scsFolder) ? fs.readdirSync(scsFolder) : [];
    const images = files.filter(f => /^menu\d+\.jpg$/i.test(f));
    const randomImage = images.length > 0 ? images[Math.floor(Math.random() * images.length)] : null;
    const imagePath = randomImage ? path.join(scsFolder, randomImage) : null;

    const time = moment().tz('Etc/GMT').format('HH:mm:ss');
    const date = moment().format('DD/MM/YYYY');

    const aliveMsg = `┏━━━━━━━━━━━━━━━━━━━━━━━┓
┃       Meta AI ✅ ALIVE        ┃
┣━━━━━━━━━━━━━━━━━━━━━━━┫
┃ 📅 Date    : ${date}      
┃ 🕒 Time    : ${time}      
┃ 👑 Owner   : ${s.OWNER_NAME}   
┃ 🔵 Platform : *VPS*  
┗━━━━━━━━━━━━━━━━━━━━━━━┛`;

    try {
        if (imagePath) {
            await zk.sendMessage(dest, {
                image: { url: imagePath },
                caption: aliveMsg,
                ...newsletterContext
            }, { quoted: quotedContact });
        } else {
            await zk.sendMessage(dest, { text: aliveMsg, ...newsletterContext }, { quoted: quotedContact });
        }
    } catch (e) {
        console.error("Error:", e);
        repondre(`❌ Failed to send Meta AI Alive message: ${e.message}`);
    }
}

// Register alive command
bmbtz(
    {
        nomCom: 'ali',
        categorie: 'General',
        reaction: "🟢"
    },
    async (dest, zk, { arg, repondre, superUser }) => {
        const data = await getDataFromAlive();

        // Show alive message if no arguments
        if (!arg || !arg[0]) {
            await sendMetaAIAlive(zk, dest, repondre);
        } else {
            // Only superUser can update alive message
            if (!superUser) {
                repondre("❌ Only the owner can update Alive message.");
                return;
            }

            const [texte, tlien] = arg.join(' ').split(';');
            await addOrUpdateDataInAlive(texte, tlien);
            repondre(`✅ Alive message updated successfully!`);
        }
    }
);
