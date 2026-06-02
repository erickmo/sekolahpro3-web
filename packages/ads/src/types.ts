/** Shape returned by vernon_ads `get_ad` (the `message` field of the response). */
export interface AdCreative {
  ad_type: string;
  title: string | null;
  body_html: string | null;
  image_url: string | null;
  video_url: string | null;
  click_url: string; // relative, e.g. /api/method/...click?token=...
  track_url: string; // relative
  token: string;
  width: number | null;
  height: number | null;
}
