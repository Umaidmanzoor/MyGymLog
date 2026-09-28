export function youtubeURL(input: string): string {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw Error("Paste a full YouTube video URL.");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:")
    throw Error("Use a YouTube video link.");
  const host = url.hostname.toLowerCase().replace(/^(www\.|m\.)/, "");
  let id = "";
  if (host === "youtu.be") id = url.pathname.split("/")[1] ?? "";
  else if (host === "youtube.com" || host === "youtube-nocookie.com")
    id =
      url.pathname === "/watch"
        ? (url.searchParams.get("v") ?? "")
        : /^\/(shorts|embed|live)\//.test(url.pathname)
          ? url.pathname.split("/")[2]
          : "";
  if (!/^[\w-]{11}$/.test(id))
    throw Error("Enter a valid YouTube video link (watch, share, or Shorts).");
  const result = new URL(`https://www.youtube.com/watch?v=${id}`);
  const time = url.searchParams.get("t") ?? url.searchParams.get("start");
  if (time && /^\d+(?:h\d+m\d+s|m\d+s|s)?$/.test(time))
    result.searchParams.set("t", time);
  return result.href;
}
