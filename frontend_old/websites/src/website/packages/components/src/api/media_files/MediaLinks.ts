import { ResponseMediaLinks } from "./GetMedia";

const MediaLinker = (baseUrl: string) => (width: number) =>
	baseUrl.replace("{WIDTH}", width.toString());

export type MediaLinkFn = (width: number) => string;

export interface MediaLinkUtility {
	mainURL: string;
	fixedVideoStill: string;
	fixedVideoAnimated: string;
	imageThumb: MediaLinkFn | null;
	videoStill: MediaLinkFn | null;
	videoAnimated: MediaLinkFn | null;
}

export function MediaLinks(mediaLinks?: ResponseMediaLinks): MediaLinkUtility {
	return {
		mainURL: mediaLinks?.cdn_url || "",
		fixedVideoStill: mediaLinks?.maybe_video_previews?.still || "",
		fixedVideoAnimated: mediaLinks?.maybe_video_previews?.animated || "",
		imageThumb: mediaLinks?.maybe_thumbnail_template
			? MediaLinker(mediaLinks.maybe_thumbnail_template)
			: null,
		videoStill: mediaLinks?.maybe_video_previews
			? MediaLinker(mediaLinks.maybe_video_previews.still_thumbnail_template)
			: null,
		videoAnimated: mediaLinks?.maybe_video_previews
			? MediaLinker(mediaLinks.maybe_video_previews.animated_thumbnail_template)
			: null,
	};
}
