# Rove · Fuse, Decide, Fight

Interactive synthetic Mars workshop for Denisa Cakoni.

## Run the workshop

- The participant mission includes an interactive 3D NASA/JPL Perseverance rover with mast scanning, arm deployment to a sampling target, wheel motion, dust and Mars terrain. Four camera views, drag-to-orbit, reduced-motion support, animation skipping and a still-image fallback are included. Motion is illustrative, accelerated and independent of engine randomness. See `dist/assets/CREDITS.md` for sources and limits.
- Open `#play` for participants. The shared challenge is MSN-2047. Practice is a separate map.
- Open `#console` for the presenter. Use the five stage buttons or left/right arrows.
- Fuse: ask for a prediction, scan, then reveal the ground truth. The demo uses seed 3105, separate from the shared challenge. The Evidence lab shows raw signals, log-odds contributions and the actual fusion function.
- Decide: use the Live code lab to execute individual training actions and inspect each Q update. Focus lab puts the update and its source code side by side on a desktop. Train Rove runs 8,000 site episodes from a blank table; Next checkpoint reveals one of eight recorded evaluations, and Show final policy completes the reveal. Changing battery price requires pressing Train Rove before the policy changes.
- Inside: inspect the learned action table and results across 300 evaluation missions.
- Fight: copy the participant link, start the local three-minute timer, and enter liters from Zoom chat. Names are optional. Undo reverses the last entry; clear rehearsal removes scores on this device. Reveal Rove and inspect its full replay.
- Break: start the shared sensor bias, compare results, and retrain in the storm. Test a known-bias repair subtracts the exact offset and measures the original policy on the corrected observations; knowing that offset is an explicit experimental assumption.

The complete timed facilitator script is kept outside the public `dist/` folder in `private/` for now. Rebuild the private HTML after editing the Markdown with `node scripts/build-script.mjs`; it is not served by the participant domain. The presenter console is also behind its private access code.

Participant controls: S = scan, D = drill, M = move. Touch controls stay visible on phones. Progress is stored locally in the participant browser. Presenter scores are local to the presenter browser; there is no synchronized live leaderboard. Anyone able to access the site can open the presenter tab, so the sealed result is for the workshop reveal, not a security barrier.

## Verified results

All figures are computed by `dist/engine.mjs`. The original workshop narrative's unverified numbers are not hardcoded into charts.

| MSN-2047 strategy | Liters |
|---|---:|
| Rove | 390 |
| Always drill | 365 |
| Fused, no rescans | 442 |
| Hand-tuned rule | 480 |

Rove visits 19 sites, finds 5 water sites, makes no dry holes, and uses 11 extra scans. Some baselines win on this map; one mission is not an estimate of average performance.

Across 300 other missions, Rove averages 325 L in clear skies, 218 L under the unmodeled storm, and 329 L after retraining in the storm. Corresponding dry-hole means are 0.73, 6.17, and 2.35. Retraining does not repair probability calibration.

Subtracting the exact known storm offset restores the original observations and reproduces all clear-sky baseline metrics across those 300 missions. The step-through and full training paths use the same `trainingSteps` generator and `updateValue` function, and tests verify identical learned tables.

## Model

This is a synthetic teaching simulator. Signals are dimensionless, battery is an action budget, and liters are a fictional resource score. It does not model liquid-water extraction, actual instrument physics, rover dynamics, communications or terrain-dependent travel. The mission briefing and facilitator script explain these boundaries and link NASA's instrument documentation.

Sites are wet with probability 0.3. Wet sites contain independent uniform integer volumes from 40 to 120 L. Signals have mean +1 for wet and −1 for dry, plus independent Gaussian noise with standard deviations 1.56, 2.34, and 3.51. Bayesian odds update with every reading. Rounded inverse-variance weights are 61%, 27%, 12%.

Actions cost scan=1, drill=9 (including onward travel), move=3. First readings are free. Up to 8 extra scans at each site. A mission ends when fewer than 3 battery units remain; unaffordable actions are disabled. Learned simulations replace unaffordable actions with moving on.

Q-learning uses 18 confidence bins × 9 scan-count states × 3 actions and 8,000 practice sites. Reward is 10 per successful water hit minus battery price times cost. Each hit has the same expected water volume. This is a cost-sensitive per-site policy, not a globally optimal finite-battery planner. Training is seeded and uses exploration declining from 100% to 3%. Confidence binning and finite training can create uneven policies.

The storm applies +2.6 shared offset to every instrument without updating the fusion model. Paired evaluation preserves ground truth, water volumes, and noise samples. Adding similarly biased sensors would not remove the bias.

## Local development and checks

No build or dependencies required. Serve `dist` with a static server, e.g. `python3 -m http.server 4173 --directory dist`, and visit http://localhost:4173.

Run `node tests/simulator.mjs` for deterministic missions, resource accounting, invalid actions, exhaustion, matched storm conditions, and measured recovery. Check scripts with `node --check dist/app.mjs` and `node --check dist/engine.mjs`.

Run `node tests/edge-cases.mjs` for posterior behavior, rejected-action state preservation, scan-limit reset, 100 mixed-action missions, finite learned values at three battery prices, and storm ground-truth preservation.

Run `node tests/learning.mjs` for step/batch equivalence, terminal and bootstrapped Q targets, corrected probabilities, corrected policy evaluation and the numeric values displayed in the learning lab.

The site optionally exposes WebMCP read/action tools when supported. They use the same state and validation as the interface. The terrain is original generated artwork. Fonts load from Google Fonts with local system fallbacks. Gameplay has no external API dependency.

The existing public site is https://fusedecidefight.com. Hosting is registered in `.openai/hosting.json`; preserve its public attendee access when publishing updates.
