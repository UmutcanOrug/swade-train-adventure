# Changelog

## 0.2.5

- Broadcast Tier 3 Override audio now creates one shared random playback position each time the receiver reconnects to that broadcast.
- All clients use Foundry's synchronized server clock, so players viewing the Radio tab hear the same part of the track even when their audio finishes loading at different times or they open the tab later.
- Remaining tuned to the same broadcast, adjusting Gain, rerendering the panel, muting, and unmuting no longer choose a new position.
- Global receiver loops continue starting normally; random offsets apply only to per-broadcast override audio.

## 0.2.4

- Changed per-broadcast audio from a post-roll decoded-message one-shot into a Broadcast Tier 3 Override.
- The override replaces the global Frequency Found / Tier 3 loop only after that broadcast's carrier frequency is acquired.
- Broadcasts without an override continue using the Receiver's global Tier 3 audio.
- Removed duplicate audio playback after a successful signal-lock roll, so the broadcast override no longer overlaps the receiver loop.
- Added a per-broadcast Requires Signal Lock switch. Open broadcasts reveal their full transmission as soon as frequency and Gain are aligned, without actor selection, permission, stabilization, or a SWADE roll.
- Empty response lists are supported and simply omit response actions from the radio log.

## 0.2.3

- Added a shared 1.00-5.00 Signal Gain control beside the frequency dial. A signal can stabilize and lock only when both frequency and Gain are aligned.
- Gain gives no directional or audio clue until the carrier frequency is acquired. Once acquired, GAIN LOW, GAIN HIGH, GAIN ALIGNED, and clarity feedback guide the second tuning step.
- Added per-broadcast Target Gain and Gain Tolerance controls for GM customization.
- Changed receiver audio so Mute fades tracks to silence without stopping them; Unmute returns at the existing playback positions instead of restarting loops.
- Replaced the full actor dropdown with a searchable actor picker limited to 12 visible matches.
- Player-assigned characters and player-owned actors are prioritized in radio actor search results.
- Removed the redundant radio Fallback Die setting. Missing radio skills now always use the SWADE Unskilled d4-2 attempt.
- Fixed legacy invalid radio modifiers such as `- NaN`; invalid values now normalize and display as `0`.

## 0.2.2

- Added a per-user Mute control that stops receiver loops and decoded message audio without interrupting tuning or stabilization.
- Added a GM-only receiver Power control shared by the whole table.
- Powered-off receivers stop all audio, reject frequency changes, signal locks, lock requests, and transmitted responses, and display a clear offline warning.
- Removed biome restrictions from radio broadcasts. On Air state and optional turn windows now control broadcast availability.
- Migrated legacy biome-limited broadcasts into biome-independent broadcasts automatically.

## 0.2.1

- Replaced the frequency slider with a mouse-driven rotary tuning dial. Mouse wheel and arrow keys provide fine tuning.
- Added a feathered trace range so signal strength and partial transcript words appear progressively before the core carrier range.
- Added configurable signal stabilization time. Operators must hold the correct frequency steady before locking or requesting a lock.
- Rebuilt GM Radio Control into Broadcasts, Receiver, and Access workspaces.
- Changed broadcasts into compact expandable rows with clear On Air state, frequency, biome, and source summaries.
- Replaced embedded audio controls with Foundry V13 FilePicker buttons and Foundry Sound playback.
- Added built-in Tier 1 Static, Tier 2 Close, and Tier 3 Understandable radio audio loops with one-time migration for existing worlds.
- Added desktop and narrow-window layout validation for the redesigned radio panel.

## 0.2.0

- Added the shared 80.0-120.0 MHz Dominion Radio minigame.
- Added live frequency synchronization so every open Radio tab follows the current operator without rerendering the train panel.
- Added partial static transcripts, signal strength, lock tolerance, SWADE actor skill rolls, unskilled attempts, success, failure, critical failure, and Raise intelligence.
- Added GM-controlled signal-lock permissions and player lock-request queue.
- Added GM broadcast editing for frequency, biome, turn window, source, skill, modifier, partial/full/Raise text, one-shot behavior, response choices, and decoded message audio.
- Added Radio Log, transmit responses, per-turn lock attempt limits, and GM reset/clear controls.
- Added three simultaneous looping audio layers for Noise, Approaching Signal, and Frequency Found with smooth volume crossfades and no track restart while tuning.
- Radio audio now stops whenever the Radio tab or train panel is closed.

## 0.1.9

- Moved over-10 Raise reward controls out of individual event tiers and into global Settings.
- Raise rewards now add extra dice to the last positive dice pool in the reward formula, preserving multipliers such as `10x6d10 -> 10x7d10`.
- Added wagon roles: Population Wagon, Storage Wagon, Fuel Wagon, and Special Wagon.
- Added Fuel cap from active Fuel Wagons.
- Added shared Storage cap from active Storage Wagons for Food, Water, and Amenities combined.
- Added dashboard storage/fuel capacity displays and cap warnings.
- Market buys, manual resource edits, and Scavenge gains now respect wagon capacity caps.

## 0.1.8

- Added a GM-only Clear button for Scavenge recent results.
- Added passenger group portrait URLs with portrait previews in People.
- Added a Current Turn control in Settings for GM turn correction.
- Fixed checkbox styling so checkbox controls no longer render as large text-input boxes.
- Added over-10 reward dice controls for Scavenge event tiers; extra dice are merged into the matching reward dice pool when possible.
- Added automatic SWADE-style Unskilled attempts: missing actor skills roll d4 with an automatic -2 modifier.
- Changed Scavenge modifier input to accept signed values such as `+2` and `-2`.

## 0.1.7

- Changed Scavenge chat output to include real Foundry Roll data for trait die, wild die, and reward roll.
- Scavenge chat now uses Foundry's active roll mode instead of always hard-whispering to GM, so roll-tab modules can classify it as a roll.
- Added actor speaker fallback for actors that are not placed on the current map.
- Cleaned old fixed amount suffixes from event titles such as `Complication: Food -16`.
- Changed Gold-Amenities into an Amenities-only scavenge category; Talion is no longer awarded automatically.

## 0.1.6

- Renamed generated event lore from the old translated labels to Directorate/Caesarist.
- Rebalanced biome events so most faction beats are local forces, biome communities, independent soldiers, and old Imperial remnants.
- Reduced direct CSD, Directorate, and Caesarist references so they appear as occasional complications instead of dominating every event.
- Bumped the generated event schema so older generated event pools refresh into the new naming and distribution.

## 0.1.5

- Changed the Dashboard biome image into a full-card background with readable overlays.
- Added Events tier filter buttons for All and Tier 1-10.
- Added per-tier Reward Roll formulas such as `10x6d10`.
- Changed Scavenge reward amounts to roll from the selected tier formula instead of being fixed in each event line.
- Updated the Events editor line format to `title | text` while keeping old `resource amount | title | text` lines readable.
- Added migration for older generated event pools so biome event tables refresh into distinct CSD, Directorate, Caesarist, Party, and local-power flavored events.
- Changed Scavenge chat messages to use the selected actor as speaker and mark the message as a roll when Foundry supports it.

## 0.1.4

- Added biome-specific Scavenge event pools.
- Added biome selector buttons to the GM-only Events tab.
- Updated Scavenge rolls to use the current route biome's event table.
- Preserved older single-pool event data by copying it into biome pools during normalization.
- Added CSD, Directorate, Caesarist, Party, and local-power flavor to generated fallback events.
- Added `docs/scavenge-biome-events.txt` with biome/category/tier event tables for GM review.

## 0.1.3

- Renamed the player-facing Hunting workflow to Scavenge.
- Reworked Scavenge into four resource cards: Food, Water, Fuel, and Gold-Amenities.
- Added per-resource actor selection, skill name, roll die, modifier, and actor-skill override control.
- Added a GM-only Events tab.
- Added editable event pools for Food, Water, Fuel, and Gold-Amenities.
- Moved Scavenge event selection to world data so GM edits are used by future rolls.
- Added `docs/scavenge-events.txt` in the same line format used by the Events editor.

## 0.1.2

- Added a Hunting / Scavenge tab with SWADE-style trait die, wild die, capped 1-10 result tier, and d50 event selection.
- Added actor selection for Hunting / Scavenge rolls.
- Added Hunting / Scavenge results to GM chat and a recent-results panel log.
- Added biome image URL support; images display on the Dashboard biome card.
- Added biome image URL fields to Settings.
- Changed stopped train turn behavior: stopped turns consume Food, Water, and Amenities, but do not consume Fuel or advance the route.
- Allowed turns to advance even after destination is reached.
- Removed the old destination-reached hard stop from Advance Turn.

## 0.1.1

- Changed panel hotkey from O to I.
- Added biome multipliers for Plains, Desert, Snow, Tundra, and Industrial Wastes.
- Added Dashboard biome display.
- Added player visibility for Local Markets.
- Fixed market purchase actions sending an empty market id.

## 0.1.0

- Initial SWADE Dominion train management panel.
- Added resources, wagons, passenger groups, local markets, route tracking, permissions, chat output, and Advance Turn automation.
