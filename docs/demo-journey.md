# Demo journey

This is the shortest path to demonstrate the complete MVP with deterministic local demo media.

## Primary: tree plantation

1. Open the home screen and select **Start with a sample field journal → Tree plantation**.
2. Confirm the project heading, location, dates, and impact story.
3. In **Media journal**, inspect the eight source cards. The short video card shows a transcript signal; the lowest-confidence cards show a review cue.
4. Select **Organize evidence**. With no OpenRouter key, the page labels the result as demo suggestions. With a key, the route makes one compact metadata request.
5. Select **Review suggestions**. Confirm the first planting moment, reject or edit a later suggestion, and check the timeline and before/after pair.
6. Select **Impact report** and choose **Generate report**.
7. Verify the six headings: Summary, Timeline, Evidence table, Before / after, Recommendations, and Source links.
8. Choose **Print / save PDF** and use the browser's print dialog.

## Secondary examples

The home screen also provides Water conservation and Infrastructure scenarios. They create a normal project and use the same media, organizer, review, and report screens; only the sample metadata and tags change.

## Accessibility and responsive check

- Test the project flow at 360px, 768px, and desktop widths.
- Navigate the upload area, workflow tabs, review actions, and report controls with the keyboard.
- Check that uncertainty uses text and an icon as well as color.
- Check long filenames, captions, source URLs, dates, and report sections do not create horizontal scrolling.
- At 200% browser zoom, confirm the source grid, timeline, and report remain readable.

## Provider recovery

If Cloudinary is missing, use the sample journal or the labeled local preview path and add credentials before retrying real uploads. If OpenRouter is missing, the demo suggestions/report are clearly labeled. If a provider rate-limits or returns invalid grouping JSON, preserve the current project and continue manually; the app does not automatically retry invalid output.

