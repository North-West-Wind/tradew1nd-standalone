# TradeW1nd Standalone
The TradeW1nd Discord music bot, now available as a desktop application!

# Installation
## Linux
Depending on your distro, there are different installation methods.

### Debian-based
Download the .deb file from the [release page](https://github.com/North-West-Wind/tradew1nd-standalone) and install it.

### Fedora-related
Download the .rpm file from the [release page](https://github.com/North-West-Wind/tradew1nd-standalone) and install it.

### Arch-based
Install it from the AUR. The package's name is `tradew1nd-standalone-bin`.

# Usage
## Getting Started
1. Launch the program.
2. Create a new queue by typing in a name in the input box and press enter.
3. Click on the newly created queue to view its content.
4. Add soundtracks to the queue by putting URLs into the input box. Supported soundtrack sources can be found down below.
5. Click the "Download" button, which will download all the soundtracks.
6. Click on a soundtrack to start playing it.

## Layout
![Layout](https://raw.githubusercontent.com/North-West-Wind/tradew1nd-standalone/main/resources/layout.png)

### Top Bar
This holds all the options available while music is being played.
- Autoplay: Continue playing after a track has ended.
- Random: Choose the next track randomly.
- Loop: Loop back to the start of the list after playing the last track.
- Repeat: Keep playing the same track.
- Stop: Stop the music that is playing currently.

### Bottom Bar
This holds the progress bar of a playing soundtrack. You can seek to a certain point of the track by clicking on it.

### Left Panel
This holds the information of the soundtrack that is being played.
- Thumbnail: Click on it to pause or resume.
- URL: The source URL of the track. Click on it to open in browser.
- Range: Start and end time of the soundtrack. Settings will be applied next time it gets played again.
- Global Volume: Controls the volume of the player.
- File Volume: Controls the volume of the specific soundtrack. Player volume is calculated by `global * file`.

### Right Panel
This holds the queue list or track list of a queue.

If showing queue list,
- New Queue Input: An input box for name of a new queue. Press enter to create a new empty queue.
- Duplicate: Duplicates a queue from the queue list. When active, select a queue to duplicate it. You can optionally set a name for it by first typing in the input box.
- Remove Button: Toggles queue removing. Select queues while this button is active to mark queues as removal. Turn it off to actually remove the queues.
- Queues: Click on a queue to see its content.

If show track list,
- Title: By clicking the title, you can get back to the queue list.
- Adding Tracks
	- Soundtrack URL Input: An input box for adding new soundtracks. Press enter to add them to the queue.
	- Local File(s): A button that allows you to choose local file(s) to be added to the queue.
- Playing the List
	- Download: Attempts to download all the tracks on the list.
	- Play: Plays the first track on the list.
	- Play Random: Plays a random track from the list.
- Disabled Options
	- Show Disabled: Whether to show disabled tracks or not.
	- Remove Disabled: Automatically removes disabled tracks from the list.
- Queue Manipulation
	- Disable: Toggles disabling mode. You can mark tracks as disabled, and they will not be played automatically.
	- Rearrange: Toggles rearrangement mode. You can drag the tracks around to rearrange them.
	- Remove: Toggles removal mode. Tracks can be marked as removal. Toggling it off will remove all selected tracks.


## Color Indicators
Every queue and soundtrack on the list can have a different background color, which means different things.

### Green
It means the track or queue is playing.
![Soundtrack with green background](https://raw.githubusercontent.com/North-West-Wind/tradew1nd-standalone/main/resources/green.png)

### Light Blue
It means the track or queue is fully downloaded. If it is blinking, that means the track is being downloaded.
![Soundtrack with light blue background](https://raw.githubusercontent.com/North-West-Wind/tradew1nd-standalone/main/resources/light_blue.png)

### Gray
It means the track is not downloaded.
![Soundtrack with gray background](https://raw.githubusercontent.com/North-West-Wind/tradew1nd-standalone/main/resources/gray.png)

### Dark Blue
It means the track is disabled. If will be skipped if autoplay or random is enabled.
![Soundtrack with dark blue background](https://raw.githubusercontent.com/North-West-Wind/tradew1nd-standalone/main/resources/dark_blue.png)

### Purple
It means the track is being viewed on the left panel. Right-click a track to get into this state.
![Soundtrack with purple background](https://raw.githubusercontent.com/North-West-Wind/tradew1nd-standalone/main/resources/purple.png)

### Red
Only exists while "Remove" is toggled. It marks the track for removal. Turning off "Remove" will remove all tracks marked as red.
![Soundtrack with red background](https://raw.githubusercontent.com/North-West-Wind/tradew1nd-standalone/main/resources/red.png)

## Importing from TradeW1nd
You can obtain a queue file of your Discord server queue with TradeW1nd using the command `/queue export`.

Then, you'll need to place the file in the data path of TradeW1nd Standalone, which varies for different OSes:
- Linux: `$HOME/.config/tradew1nd-standalone/queues`
- Mac: `~/Library/Application Support/tradew1nd-standalone/queues`
- Windows: `%APPDATA%/tradew1nd-standalone/queues`

# License
GPLv3