# LUNAR Website

Static website for the Livermore Unit of the National Association of Rocketry (LUNAR).

## Current sections
- Home with launch alert and countdown
- Launch updates
- Programs (ARC, High Power Certification, Chip Can)
- Dedicated challenge pages for ARC, High Power Certification, and Chip Can
- Records and history (leaderboard, launch summaries, aggregate counters)
- FAQ
- Lost and Found board
- Gallery
- Join

## Content source
Most dynamic content is sourced from one file:

- `js/data/site-data.json`

The script `js/main.js` reads this file and renders sections on each page.

## How to update launch status quickly
1. Open `js/data/site-data.json`.
2. Edit `launchStatus.state`:
	- `scheduled`
	- `moved`
	- `cancelled`
3. Update `launchStatus.nextLaunchISO` with the new launch date/time.
4. If needed, enable the urgent banner:
	- set `launchStatus.alert.enabled` to `true`
	- update `launchStatus.alert.kind` to `moved` or `cancelled`
	- update `headline` and `body`

Once saved, refresh the site and the homepage will immediately reflect the new status.

## Other editable data blocks
- `counters`: total motors flown, highest altitude, and related metrics
- `launches`: schedule cards used on Home and Launches pages
- `launchSites`: the approved site list for Snow Ranch, Brigantino Park, and Ohlone Newark Campus
- `faq`: FAQ preview and full FAQ page
- `lostFound`: Lost and Found board entries
- `programs`: ARC / HPR / Chip Can cards and links
- `motorRecords`: highest altitude by motor class
- `flightHistory`: launch summary timeline
