# Rove · Fuse, Decide, Fight

Interactive synthetic Mars workshop for Denisa Cakoni.

## Run the workshop

- Open `#play` for participants. The shared challenge is MSN-2047. Practice is a separate map.
- Open `#console` for the presenter. Use the five stage buttons or left/right arrows.
- Fuse: ask for a prediction, scan, then reveal the ground truth.
- Decide: train from a blank table. The 8 checkpoints reveal over about 7 seconds; computation is faster. Change battery price and retrain. “Finish reveal” skips the animation.
- Inside: inspect the learned action table and results across 300 evaluation missions.
- Fight: copy the participant link, start the local three-minute timer, and enter liters from Zoom chat. Names are optional. Undo reverses the last entry; clear rehearsal removes scores on this device. Reveal Rove and inspect its full replay.
- Break: start the shared sensor bias, compare results, and retrain in the storm.

Participant controls: S = scan, D = drill, M = move. Touch controls stay visible on phones. Progress is stored locally in the participant browser. Presenter scores are local to the presenter browser; there is no synchronized live leaderboard. Anyone able to access the site can open the presenter tab, so the sealed result is for the workshop reveal, not a security barrier.

## Verified results (simulator version 1)

All figures are computed by `dist/engine.mjs`. The original workshop narrative's unverified numbers are not hardcoded into charts.

| MSN-2047 strategy | Liters |
|---|---:|
| Rove | 390 |
| Always drill | 365 |
| Fused, no rescans | 442 |
| Hand-tuned rule | 480 |

Rove visits 19 sites, finds 5 water sites, makes no dry holes, and uses 11 extra scans. Some baselines win on this map; one mission is not an estimate of average performance.

Across 300 other missions, Rove averages 325 L in clear skies, 218 L under the unmodeled storm, and 329 L after retraining in the storm. Corresponding dry-hole means are 0.73, 6.17, and 2.35. Retraining does not repair probability calibration.

## Model

Sites are wet with probability 0.3. Wet sites contain independent uniform integer volumes from 40 to 120 L. Signals have mean +1 for wet and −1 for dry, plus independent Gaussian noise with standard deviations 1.56, 2.34, and 3.51. Bayesian odds update with every reading. Rounded inverse-variance weights are 61%, 27%, 12%.

Actions cost scan=1, drill=9 (including onward travel), move=3. First readings are free. Up to 8 extra scans at each site. A mission ends when fewer than 3 battery units remain; unaffordable actions are disabled. Learned simulations replace unaffordable actions with moving on.

Q-learning uses 18 confidence bins × 9 scan-count states × 3 actions and 8,000 practice sites. Reward is 10 per successful water hit minus battery price times cost. Each hit has the same expected water volume. This is a cost-sensitive per-site policy, not a globally optimal finite-battery planner. Training is seeded and uses exploration declining from 100% to 3%. Confidence binning and finite training can create uneven policies.

The storm applies +2.6 shared offset to every instrument without updating the fusion model. Paired evaluation preserves ground truth, water volumes, and noise samples. Adding similarly biased sensors would not remove the bias.

## Local development and checks

No build or dependencies required. Serve `dist` with a static server, e.g. `python3 -m http.server 4173 --directory dist`, and visit http://localhost:4173.

Run `node tests/simulator.mjs` for deterministic missions, resource accounting, invalid actions, exhaustion, matched storm conditions, and measured recovery. Check scripts with `node --check dist/app.mjs` and `node --check dist/engine.mjs`.

Run `node tests/edge-cases.mjs` for posterior behavior, rejected-action state preservation, scan-limit reset, 100 mixed-action missions, finite learned values at three battery prices, and storm ground-truth preservation.

The site optionally exposes WebMCP read/action tools when supported. They use the same state and validation as the interface. The terrain is original generated artwork. Fonts load from Google Fonts with local system fallbacks. Gameplay has no external API dependency.

Deploy the `dist` directory with a static hosting provider. Confirm attendee access before distributing the workshop link.
