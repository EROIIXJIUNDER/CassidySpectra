import axios from "axios";

export const meta: CassidySpectra.CommandMeta = {
  name: "autodl",
  description:
    "Auto-downloads videos from TikTok, YouTube, Facebook, Instagram, Twitter, and more. Replies with the downloaded video.",
  version: "1.0.0",
  author: "Asmit Adk",
  requirement: "2.5.0",
  icon: "📥",
  category: "Media",
  role: 0,
  noWeb: true,
};

// Toggle command: !autodl on/off
export async function entry({
  output,
  input,
  threadsDB,
  args,
}: CommandContext) {
  if (!input.isAdmin) {
    return output.reply("Only admins can enable or disable this feature.");
  }

  const current = (await threadsDB.queryItem(input.threadID, "autodl"))?.autodl;
  const toggle = args[0] === "on" ? true : args[0] === "off" ? false : !current;

  await threadsDB.setItem(input.threadID, { autodl: toggle });

  return output.reply(`✅ Auto Downloader is now **${toggle ? "ENABLED" : "DISABLED"}**.`);
}

// Event handler: triggered on every message
export async function event({ output, input, threadsDB }: CommandContext) {
  try {
    const cache = await threadsDB.getCache(input.threadID);
    if (cache.autodl === false) return;

    const body = String(input);
    const urlRegex = /https:\/\/(vt\.tiktok\.com|www\.tiktok\.com|youtu\.be|youtube\.com|www\.facebook\.com|fb\.watch|x\.com|twitter\.com|www\.instagram\.com|pin\.it|vm\.tiktok\.com)[^\s]+/gi;
    const match = body.match(urlRegex);

    if (!match || match.length === 0) return;

    const videoURL = match[0];
    output.react("⏳");

    const apiData = await axios.get(
      "https://raw.githubusercontent.com/romeoislamrasel/romeobot/refs/heads/main/api.json"
    );
    const apiUrl = apiData.data.alldl;

    const res = await axios.get(`${apiUrl}/allLink`, {
      params: { link: videoURL },
    });

    if (!res.data.download_url) {
      output.react("❌");
      return;
    }

    const { download_url: videoLink, platform, video_title } = res.data;

    const stream = await global.utils.getStreamFromURL(videoLink, "video.mp4");

    await output.reply({
      body: `Here's your downloaded video:\nPlatform: ${platform}\nTitle: ${video_title}`,
      attachment: stream,
    });

    output.react("✅");
  } catch (err) {
    output.react("❌");
    output.reply(require("util").inspect(err));
  }
}
