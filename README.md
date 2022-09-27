# karabiner-elements-config
Clone this repo into `~/.config/karabiner`. `node build.js` creates `karabiner.json`, the actual Karabiner config file.

---

#### Input source notes
I want to bind ⌥J and ⌥K to next/previous tab in Firefox. But, I use [Tree Style Tab](https://github.com/piroor/treestyletab), 
and I want to enable TST's "Don't expand collapsed tree and skip collapsed descendants, while switching focus of tabs via keyboard shortcuts"
option. TST has to implement this with some weird modifier key watching code due to Firefox limitations, and if I just
bind ⌥J/⌥K to ⌃Tab/⌃⇧Tab then TST's modifier key watching gets confused and it can't skip collapsed descendants reliably.
I can get around that by having Karabiner pass ⌥J/⌥K through to Firefox unchanged, and then binding them to TST's
"Focus to Next/Previous Tab (don't expand tree)" commands through Firefox's "Manage Extension Shortcuts". But, after doing that,
there's an issue where, if the current Firefox tab has a textfield selected, ⌥J/⌥K will just enter ∆/˚ characters into the textfield
rather than switching tabs. I can get around _that_ by changing MacOS's input source to "Unicode Hex Input" in keyboard settings,
but that causes another issue where ⌥←/⌥→ no longer do anything in textfields. To get around this final issue, I got the
`Unicode Hex Input.keylayout` from [Ukelele](https://software.sil.org/ukelele/) v2.2.8 (the file seems removed from more recent versions),
and edited it with the latest version of Ukelele to change the output of the arrow keys back to their default value while holding ⌥,
producing the `Griffin.keylayout` file in this repo. Then I put that file in `/Library/Keyboard Layouts/`, select it as the input
source, and now everything works including ⌥←/⌥→ to move by word in textfields. The important part of `Griffin.keylayout` here is the
first `keyMap index="3"` section, which binds ⌥arrows to some ASCII control characters.

Switching the next/previous tab keybinding to ⌃J/⌃K did also make everything work without all the input source stuff, presumably because
getting ⌥ out of the equation avoids confusing TST's modifier key watching, but I'm in too deep to change that keybinding now 😅.
