# Fuse Decide Fight workshop script

**Denisa Cakoni · MHC++ × ACM @ CCNY**  
**Friday October 9, 2026 · 3–4 PM ET · Zoom**

This is your rehearsal and delivery guide. Quoted paragraphs are words you can say naturally; the actions and questions give students time to do the thinking. The hour combines explanation, a numerical exercise, live training, a game, and a failure experiment. You do not need to speak continuously for sixty minutes.

**Presenter:** [fusedecidefight.com/#console](https://fusedecidefight.com/#console)  
**Participants:** [fusedecidefight.com/#play](https://fusedecidefight.com/#play)  
**Code:** [ditto-d/fuse-decide-fight](https://github.com/ditto-d/fuse-decide-fight)

## The hour at a glance

| Clock ET | Minutes | Screen | Students do |
| --- | --- | --- | --- |
| 3:00–3:04 | 0–4 | Welcome and pipeline | Predict scan, drill or move |
| 3:04–3:14 | 4–14 | Fuse | Interpret conflicting signals and inspect fusion code |
| 3:14–3:27 | 14–27 | Decide | Calculate a Q update, train, change the reward cost |
| 3:27–3:33 | 27–33 | Inside | Read the policy and compare baselines |
| 3:33–3:47 | 33–47 | Fight | Play, explain a decision, then replay |
| 3:47–3:53 | 47–53 | Break | Predict a failure and compare two repairs |
| 3:53–4:00 | 53–60 | Debrief | Answer three exit questions and discuss extensions |

**By the end, students should be able to:** explain how noisy observations become one estimate; identify state, action and reward; calculate one Q-learning update; distinguish a learned policy from a sensor model; and explain why testing a model under changed conditions matters.

## Before people arrive

- Open the presenter console in the browser you will share. Keep this script in a separate window or on another device. Share the console window in Zoom so your notes stay available to you.
- Reload the console for a clean rehearsal state. Clear any rehearsal scores in Fight. Reset the live code lab. Leave the battery price at 0.45. Start on Fuse, demo site 01, one scan, truth hidden.
- Keep one separate participant tab ready in practice mode. Do not demonstrate the shared mission before the competition; the Fuse demo now uses a different seed.
- Enlarge the browser until the code is readable in a Zoom screen share. Close unrelated tabs and notifications. Check the participant link on a second device without signing in.
- Ask a cohost to paste the participant link, collect questions, give you a two-minute warning at 3:51, and collect first-attempt scores. Scores on the presenter screen are entered manually and stored on that device.
- Have the organizer’s feedback link ready. If it has not arrived, ask for feedback in Zoom chat; no feedback form is built into this game.
- Keep the local copy available as a backup. From the repository, run `python3 -m http.server 4175 --directory dist`, then open `http://localhost:4175/#console`. Attendees still use the public URL.

## 0 to 4 minutes — Set up a decision

**Screen:** presenter console, Fuse. Point to the three-stage pipeline and the demo estimate near 61%.

> Hi everyone, I’m Denisa. Today you’re going to make decisions for a simulated rover, then look inside the agent making those same decisions.
>
> You have a limited battery. Three instruments give you noisy clues about a site. You can spend battery on another scan, drill, or move on. Right now, the model estimates about a 61% chance this site is wet. Put S, D or M in chat: scan, drill, or move?

**Wait 20 seconds.** Read two different choices. Ask one volunteer for a reason; give them about 30 seconds.

> I want you to keep that reason in mind. By the end, you’ll be able to explain where the percentage came from, how the agent learns an action, and what happens when the assumptions behind its estimate stop being true.
>
> This is a teaching simulator. The sensor numbers, battery units and liters are invented so we can run controlled experiments. Real Mars rovers study rocks and geology; this game is not a model of pumping liquid water on Mars. The real engineering question is how to act when information is uncertain and getting more of it costs something.

**Give the plan:** “We’ll combine evidence, open the learning code, play a mission, and then deliberately break the model.” Tell students they need a browser, not an installation or an ML background. Ask them to wait to start the shared mission until Fight.

**Transition:** “First, we need an estimate of what might be underground.”

## 4 to 14 minutes — Fuse the evidence

### 4 to 7 — Predict before revealing

**Screen:** Fuse, demo site 01. The first estimate is **60.7%**, rounded to 61% in the main display. The camera disagrees with the other channels.

> The small percentages describe each instrument’s latest observation on its own. The large percentage uses all the observations we have collected here. They answer different questions.
>
> Which instrument should contribute most? Look at its reliability, rather than just whether you like its answer.

**Ask and wait 20 seconds:** “If the camera strongly disagrees, should one vote cancel another vote?”

**Expected discussion:** evidence should depend on noise. The spectrometer channel has the lowest noise, so its readings have the greatest influence under this model. The model can still be wrong on any particular site.

### 7 to 10 — Show the actual calculation

**Scroll to Evidence lab. Open “Show the fusion code.”** Spend roughly 90 seconds on three lines, not the entire file.

> We start with a prior: 30% of our generated sites are wet. A positive signal supports wet ground; a negative signal supports dry ground. Each signal’s contribution is divided by its noise variance. That is why a noisier instrument has less influence.
>
> We add these contributions in log-odds. The last line converts that running total back into a probability. The function on screen is the function the game actually calls.

Point to `Math.log(.3 / .7)`, the line beginning `logOdds +=`, and the return statement. Explain that the means are +1 for wet and −1 for dry, which is why the Gaussian likelihood-ratio contribution is `2 × signal / variance`.

**Keep the distinction clear:** the 61%, 27%, 12% relative weights come from inverse noise variances. The engine does **not** take a weighted average of the three displayed percentages. This fusion formula is specified by us; Q-learning does not learn it.

**Optional CS question, 30 seconds:** “If a sensor’s standard deviation doubles, what happens to its evidence weight?” Expected answer: its variance quadruples, so its weight becomes one quarter.

### 10 to 12 — Buy an observation

**Ask:** “Will one more scan always increase our confidence that water is there?” Let chat answer, then press **Scan again** once.

The demo estimate becomes **93.5%**, rounded to 94%. Press **Reveal truth**: this demo site is wet, worth **115 fictional liters**.

> This scan increased the estimate. Another scan could have lowered it. We want evidence to move our belief toward the truth; we do not want a number that only gets larger. Also, seeing one wet site does not establish that the model is reliable.

### 12 to 14 — Separate accuracy from decision quality

Point to the accuracy bars: about **78%** for the best individual channel, **83%** for one fused scan, **92%** for three fused scans across 4,000 synthetic sites. Always predicting dry has expected accuracy **70%** under the generator.

> Fusion helps on this simulated distribution. Three scans are more accurate overall, but they cost more. Accuracy alone does not tell us whether the extra scans are worth buying during a mission.

**Ask:** “Would you scan three times at every site?” Take two answers. The useful tension is better evidence versus fewer resources to drill or travel.

**Transition:** “Now we’ll learn a policy for deciding when more evidence is worth its cost.”

## 14 to 27 minutes — Teach an agent to decide

### 14 to 17 — Define the learning problem

**Screen:** Decide. Scroll to Live code lab, press **Focus lab**, and leave its table at zero. On a desktop, this puts the transition and actual code side by side while hiding the surrounding console.

> Our state is the estimated chance of a wet site, grouped into 18 bins, plus how many extra scans we’ve used. Our actions are scan, drill and move. Our reward gives credit for a water discovery and subtracts a cost for battery use.
>
> A Q-value estimates the reward an action can lead to from a state. It is not a probability. Initially every value is zero. The agent has to try actions and learn from their consequences.

Explain the action budget: one extra scan costs **1**; drilling and leaving costs **9**; moving without drilling costs **3**. Each new site starts with a free initial scan in this simplified model. At most eight extra scans are allowed.

At price 0.45, reward is **+5.95 for a successful drill**, **−4.05 for a dry drill**, **−0.45 for a scan**, and **−1.35 for moving**. A training episode is one site; it ends when the agent drills or moves.

**Ask:** “What stops the agent from scanning forever?” Expected answer: cost, the scan limit, and eventually comparing the learned value of scanning with other actions. Cost alone is not the hard limit in this implementation.

### 17 to 21 — Calculate one update together

**Open “Show the Q-learning update.” Press “Next training action” once.** The seeded first action explores by drilling a dry site at roughly 24.2% confidence.

> The drill failed and returned −4.05. The old Q-value was zero. We move 12% of the distance toward the target: zero plus 0.12 times negative 4.05. The updated value is −0.486.
>
> Only this state’s drill entry changed. We have made that action a little less attractive here. One failure is evidence, not a permanent ban on drilling.

Point to the updated cell. Explain `before`, `target`, and the update line. After drill or move, future value is zero because that site episode has ended.

**Student exercise, 45 seconds:** “The next action is a scan. It costs 0.45, and its next-state values are still zero. What will the updated scan value be? Type your calculation.”

Press **Next training action** again. The answer is **−0.054**. Confirm it on screen.

> Later in training, a scan can have positive future value because it leads to a state where a good drill decision becomes possible. That is the bootstrapping part: the target includes the best available next-state Q-value.

Explain exploration briefly: early epsilon is near one, so many actions are random. It declines toward 0.03 as training progresses. Random exploration can choose the same action the greedy policy would choose.

### 21 to 24 — Train from the blank table

**Press Exit focus, scroll up; price 0.45; press Train Rove.** It actually completes 8,000 site episodes in the browser. The screen reveals stored checkpoints so you can discuss them.

> Now we repeat that update across 8,000 generated sites. These are practice sites, separate from the shared mission. The plot shows the learned policy evaluated on 60 fixed missions at each checkpoint.

Press **Next checkpoint** two or three times, then **Show final policy**. Ask students whether the curve is perfectly smooth.

> Learning can be uneven. We have a small table, noisy experiences and a fixed learning rate. A rising curve is useful evidence, but we also need comparisons with simple alternatives.

**Honest timing language:** “Training has completed; we’re stepping through recorded checkpoints.” Do not imply that the reveal animation is the training speed.

### 24 to 27 — Change what the agent values

**Ask and wait 30 seconds:** “If battery becomes more expensive, predict what happens to dry holes, scans and water collected. Give a reason.”

Move **Battery price** to **0.90**, then press **Train Rove** and **Show final policy**. Moving the slider alone does not retrain. This changes the reward penalty, not the physical action costs.

> We changed the objective the agent learns from. It now has more reason to avoid expensive mistakes. That can reduce water collected as well as waste. More conservative does not automatically mean better for every goal.

For the later 300-mission comparison, this seeded run produces about **299 L**, **0.26 dry holes** and **8.7 extra scans** per mission, compared with **325 L**, **0.73 dry holes** and **10.2 extra scans** at 0.45. Do not promise each individual mission follows that pattern.

**Reset price to 0.45, Train Rove, Show final policy** before Inside. The competition agent has remained fixed at 0.45 throughout.

## 27 to 33 minutes — Inspect and challenge the policy

**Screen:** Inside. Explain S = scan, D = drill, M = move. Each confidence column represents a bin; each row represents an extra-scan count.

> This table is the learned policy. Find a cell marked S and a cell marked D. Why might one state be worth investigating and another be ready for a decision?

**Give 45 seconds** for chat explanations. Then ask: “What important mission resource is missing from these rows and columns?” Answer: remaining battery.

> This agent is cost-sensitive, but its learned state does not include the battery left in the mission. The game prevents unaffordable actions. A stronger mission planner would also learn when to save battery for later sites. That is a useful extension you can make in the repository.

**Move to the baseline table.** These are the fixed standard-price results rounded to whole liters over 300 evaluation missions:

| Strategy | Mean liters | Mean dry holes |
| --- | --- | --- |
| Always drill | 251 | 7.85 |
| Fuse and never rescan | 306 | 1.35 |
| Rove learned policy | 325 | 0.73 |
| Hand-tuned rule | 348 | 0.79 |

> Rove improves on always drilling and this simple fusion threshold. The hand-tuned rule does better on mean water here. That result belongs in the workshop. Learning does not excuse us from testing against a good rule.

**Ask:** “Why might that rule win?” Accept finite training, state discretization, a well-chosen rule, and a mismatch between per-site reward and finite-mission water. No single cause has been isolated by this comparison.

Explain that the evaluation seeds are separate from training. Reusing them while tuning makes them a validation set; a new experiment would reserve fresh seeds for a final test and report variability, not only means.

**Transition:** “You have the same evidence and action budget. Now try writing a policy with your own decisions.”

## 33 to 47 minutes — Play with a hypothesis

### 33 to 35 — Brief the room

**Screen:** Fight. Paste the participant link. Explain S, D, M keyboard shortcuts and the buttons.

> Before you start, write a one-sentence rule. For example: I’ll scan when I’m uncertain, drill when the evidence is strong, and move when it looks dry. Your job is to test that rule and notice where it breaks.
>
> Everyone gets mission 2047: the same sites and the same reading sequence at each site. Your choices determine how far your battery takes you. Finish one run and post your liters plus one decision you found difficult. Please label later replays separately.

The map is a fixed route, not free navigation. Scan adds evidence; drill collects any resource and advances; move skips without revealing the truth. Practice is a separate seed. The shared mission restores saved progress on that device; returning players should identify themselves as replays.

### 35 to 38 — First attempt

Press **Start 3-minute timer**. Let students work. Avoid narrating the shared map’s answers. At 90 seconds, ask: “Are you spending battery because you need information, or because you want certainty?”

If someone finishes early, ask them to write their rule and a decision they would change. If someone is still playing when time ends, allow a brief finish or label their score incomplete; compare completed runs only.

### 38 to 41 — Explain before revealing

Collect first-attempt scores in Zoom. Add several through the presenter score form. Names are optional. Ask two people with different approaches to describe a decision, spending about 45 seconds each.

> A dry hole after a reasonable decision is possible. A lucky hit after a weak decision is possible too. Tell us what information you had when you made the choice.

Press **Reveal Rove**. Standard Rove collects **390 L**, with **5 successful drills**, **0 dry holes**, and **11 extra scans** on this mission. Show one decision in its replay, particularly a scan followed by a different estimate.

> This is one seeded mission. The score is a conversation starter, not evidence that one person or algorithm is generally smarter. We need many different missions to judge a policy.

### 41 to 45 — Change one thing and replay

Ask students to change one part of their rule and press **Replay mission**. Give roughly three minutes. Then ask them to post “replay,” the score, and what changed.

> Because you have seen this map already, a better replay may reflect memory as well as a better rule. To measure generalization, we would test that rule on new maps.

### 45 to 47 — Connect back to the learning objective

Ask: “When was a scan worth its cost?” and “What would you add to Rove’s state?” Invite one answer to each. Tie answers back to expected future reward and the missing remaining-battery variable.

**Transition:** “So far, our sensors have behaved the way the model expects. Let’s change that.”

## 47 to 53 minutes — Break the assumptions and compare repairs

**Screen:** Break. It starts with a known dry site whose clear-sky estimate is about **16%**.

> Suppose an environmental effect pushes every sensor upward. Before I switch it on: will averaging more readings necessarily protect us?

**Wait 20 seconds**, then press **Start the dust storm**. The dry site now displays about **87%** wet. The storm is a controlled shared offset of +2.6 synthetic signal units; it is not a physical dust model.

> The instruments agree for a bad reason: they share the same error. The estimator still assumes the original sensor model, so its confidence is misleading.

Point to the 300-mission comparison: mean score falls from **325 L to 218 L**; dry holes rise from **0.73 to 6.17**.

**Ask:** “Should we repair the decision rule, the measurements, or both?” Take two answers.

Press **Retrain in the storm**. Mean score becomes about **329 L**, with **2.35 dry holes**.

> The policy adapted to these changed inputs. But the probability on this dry site is still wrong. Better decisions do not prove that the sensor estimate has become calibrated.

Press **Test a known-bias repair**. The corrected estimate is **16.2%**. This experiment measures **325 L** with the original policy over the same 300 missions after subtracting the known offset.

> Here we know the exact offset because we created it. Subtracting it restores our original observations. In a real system, detecting and estimating the bias would be an additional problem. A fourth sensor helps only if it adds useful evidence; an independent failure mode can matter more than another agreeing reading.

**Optional 45-second extension:** ask how to estimate an unknown bias. Good answers include calibration against known reference samples, an instrument based on different physics, monitoring residuals, and validating after the correction. Do not suggest that more Q-learning automatically solves sensor calibration.

## 53 to 60 minutes — Make the learning explicit

### 53 to 56 — Three exit questions

Ask students to answer in chat, one at a time. Give 20–30 seconds for each.

1. **What part combined the sensor evidence?** The programmed Bayesian fusion model.
2. **What did reinforcement learning change?** Action values, which define a policy for scan, drill or move.
3. **Why did the storm fool the system?** The input distribution shifted through a shared bias that the original observation model did not represent.

> Today you traced an estimate back to its inputs, calculated a learning update, changed an agent’s objective, tested a policy, and inspected a failure. Those are useful habits whenever we build systems that have to make decisions from uncertain information.

### 56 to 59 — Questions and a concrete next step

Share the repository. For students who want to extend it, suggest one task rather than a complete rewrite:

- Add remaining battery to the state and evaluate on fresh mission seeds.
- Compare a calibrated bias correction with a learned policy adaptation.
- Add correlated or persistent sensor errors and check calibration across confidence bins.

> Pick one change, state what you expect it to improve, and compare it with the original on the same new missions. Report the cases where it fails too.

If asked whether this is deep learning: it is tabular Q-learning. There is no neural network or language model making the decisions. The small table makes every update inspectable.

### 59 to 60 — Close

> Thank you for experimenting with me, and thank you to MHC++ and ACM at CCNY for hosting. The site and code are available after the session. Please share one thing that became clearer and one question you still have in the feedback form or in chat.

Show the organizer’s supplied feedback link or QR if available. End by 4:00 PM.

## If the room or technology needs a different pace

**Small group:** five participants is enough. Ask each person for one prediction and one decision they would change. Let the different rules drive the discussion; avoid calling it a failure to fill the room.

**Quiet room:** give choices first. “A: another scan always helps. B: it can help, but has a cost.” Allow chat responses before inviting a voice answer. Wait a full 15–20 seconds.

**Five minutes behind:** shorten the replay to one explained decision and skip the optional fusion derivation. Keep the numerical Q update, the baseline comparison and the storm. They establish the technical learning.

**Site or participant connection fails:** share your local console and run a collective mission by chat vote. Use the verified numerical examples below to explain fusion and learning without waiting for the network. Label this a demonstration, not an individual competition.

**Training chart stalls:** reload and use the built-in standard policy. Do not imply retraining occurred if it did not. Explain the first Q update from the script and use the actual code view or repository.

**Someone asks about physical realism:** acknowledge the boundary directly. The simulator captures uncertainty, information costs, reward-driven decisions and model mismatch. It omits rover dynamics, power hardware, terrain-dependent costs, water extraction, communication latency and detailed instrument physics.

## Technical reference for questions

**Data generation.** A seeded generator samples wet versus dry with prior 0.30. Conditional signal means are +1 and −1. Independent Gaussian noise has standard deviations 1.56, 2.34 and 3.51. The optional storm adds a common constant +2.6. No external dataset is downloaded. A fixed seed makes the experiment reproducible; it does not make it representative of real Mars geology.

**Fusion.** Start with prior log-odds, then add `2 × signal / variance` for every observed channel and scan. Convert with the logistic function. This follows the likelihood ratio for the chosen Gaussian model. Independence and known noise are assumptions. The evidence table displays the actual numbers used by the engine.

**Learning.** There are 18 confidence bins × 9 scan-count states = 162 states and 3 stored action values each = 486 entries. Scan is unavailable at the final scan-count state. The learning rate is 0.12; discount is 1 because the site episode is finite. Epsilon decays quadratically from 1 toward 0.03 over 8,000 site episodes. Future value is the maximum legal next-action value after scanning, and zero after terminal drill or move. Binning is an approximation to the continuous belief state.

**Objective.** Training uses +10 per water discovery minus price times battery cost. Liters at a wet site are uniform integers from 40 to 120 and unknown before drilling. Each discovery has expected volume 80 L. The per-site reward is a useful cost-sensitive proxy; it is not an exact solution to maximizing water over a 100-unit mission. Remaining battery is absent from the learned state.

**Useful arithmetic.** Dry drill: `0 + 0.12 × (−4.05 − 0) = −0.486`. First scan with zero future value: `0 + 0.12 × (−0.45 − 0) = −0.054`. Successful drill reward: `10 − 9 × 0.45 = 5.95`. If the only choices are drill or move, expected immediate reward favors drilling when `10p − 4.05 > −1.35`, or `p > 0.27`. That last threshold excludes the value of scanning and is not the full learned policy.

**Evaluation.** Training sites use seeds 100000–107999. Evaluation missions use 70000–70299; checkpoint evaluation uses the first 60 of those missions. Fusion accuracy uses 4,000 separately generated sites. Shared challenge seed is 2047; practice seed is 4815; Fuse demo seed is 3105. The baseline comparison reports means, without confidence intervals. Repeatedly choosing settings based on these missions would tune to the evaluation set, so reserve fresh seeds for a final research comparison.

**Game behavior.** Each mission starts at 100 battery and ends below the travel cost, or at the traversal cap. Unaffordable learned actions fall back to moving. Drill includes leaving the site. A skipped site stays unknown to the player. The simulation internally knows truth to generate observations and drill outcomes; the policy does not receive the truth in its state. Attendee actions do not retrain the competition policy. This is a public educational site, not a secure or cheat-proof contest.

**Sources for further reading.** [NASA Perseverance science instruments](https://science.nasa.gov/mission/mars-2020-perseverance/science-instruments/) describes the real instrument context. [Sutton and Barto, Reinforcement Learning, second-edition draft](https://www.incompleteideas.net/book/bookdraft2018mar21.pdf), Chapter 6, explains temporal-difference learning and Q-learning. Simulator numbers in this script come from the workshop code and its seeded tests.
