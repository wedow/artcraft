const getCardUrl = (data: any, source: string, type: string) => {
  let isBookmark = data.token && data.token.startsWith("ub_");
  let bookmarkedToken = data.details?.entity_token;
  let prefix = type === "media" ? `/media/${isBookmark ? bookmarkedToken : data.token}` : `/weight/${isBookmark ? bookmarkedToken : data.weight_token }`;
  let suffix = source ? "?source=" + source : "";
  return prefix + suffix;
}

export default getCardUrl;