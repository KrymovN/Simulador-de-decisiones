# LEVIO CLARIFICATION ENGINE

## 1. Purpose

This document specifies the future Levio Clarification Engine.

The Clarification Engine detects information gaps, contradictions, and safety conditions before scenario generation and recommendation. Its purpose is not to prolong conversation. Its purpose is to ask the smallest number of questions that materially improve decision quality or make the analysis safe.

This is a documentation-only specification. It does not implement a conversational flow or change the current simulator.

## 2. Core Principle

Levio must not generate a recommendation merely because the user submitted text.

The engine must first determine:

1. What decision is being made?
2. What goal should the decision serve?
3. What meaningful options exist?
4. What constraints could eliminate an option?
5. What missing information could reverse or materially change the recommendation?
6. Does the subject require restricted or high-stakes safety behavior?

When those questions cannot be answered from the current decision model, clarification takes precedence over recommendation.

## 3. Clarification Pipeline

```text
Parse supplied decision context
->
Build provisional DecisionModel
->
Run deterministic completeness checks
->
Detect contradictions and safety signals
->
Create and classify InformationGaps
->
Estimate question information value
->
Select a minimal question set
->
Collect and validate answers
->
Merge answers with provenance
->
Rebuild model and re-run gates
->
Proceed, ask again, limit analysis, withhold, or refuse
```

## 4. Gap Detection

### 4.1 Required Decision Dimensions

The engine checks for:

- clear decision statement;
- at least one primary goal;
- meaningful options;
- blocking and material constraints;
- critical variables;
- affected stakeholders where relevant;
- decision deadline and relevant time horizon;
- reversibility and cost of delay;
- major downside exposure;
- assumptions and contradictions;
- safety domain and escalation needs.

### 4.2 Detection Methods

Future implementation should combine:

- deterministic required-field checks;
- contradiction checks across supplied facts and answers;
- semantic classification of material unknowns;
- domain-specific safety checks;
- option-feasibility checks;
- recommendation-sensitivity checks.

AI-assisted detection may propose gaps, but deterministic validation must classify and enforce critical-gap behavior.

### 4.3 Gap Severity

#### Critical

A missing or contradictory fact is critical when it could:

- reverse the preferred option;
- eliminate an option through a non-negotiable constraint;
- expose the user or another person to serious harm;
- make the requested recommendation professionally irresponsible;
- make all scenario comparisons materially unreliable;
- prevent understanding the actual decision or goal.

Critical unresolved gaps block a normal recommendation.

#### Important

An important gap could materially change ranking, risk, benefit, timing, or confidence, but useful conditional analysis remains possible.

Important unresolved gaps require explicit limitations and may force a conditional or deferred recommendation.

#### Optional

An optional gap may refine the analysis but is unlikely to change the recommendation materially.

Optional gaps should not normally produce a clarification question before the first useful response.

## 5. Missing Information Taxonomy

| Category | Example | Typical severity |
| --- | --- | --- |
| Goal | The user names an action but not the outcome they want | Critical or important |
| Option | No meaningful alternative is defined | Critical or important |
| Constraint | Unknown non-negotiable budget, health, legal, or family condition | Critical |
| Variable | Unknown amount, capacity, dependency, or deadline | Critical or important |
| Stakeholder | A materially affected person or authority is omitted | Important or critical |
| Time horizon | No deadline, delay cost, or consequence window | Important or critical |
| Reversibility | Unknown ability or cost to undo the action | Important or critical |
| Risk | High-impact downside not characterized | Critical |
| Benefit | Claimed gain is vague or unsupported | Important |
| Assumption | A material belief is unvalidated | Important or critical |
| Contradiction | Two supplied facts cannot both be true | Critical |
| Safety | High-stakes or harmful context lacks required safeguards | Critical |

## 6. Question Information Value

Each candidate question receives a conceptual information-value score.

```text
Question Value =
  recommendation sensitivity
  * gap severity
  * answerability
  * expected uncertainty reduction
  - user burden
  - sensitivity cost
  - duplication penalty
```

The score is used for ranking, not exposed as a claim of scientific precision.

Priority increases when an answer could:

- eliminate an option;
- reveal a blocking constraint;
- reverse the likely recommendation;
- materially change risk or benefit;
- change the decision deadline;
- change stakeholder impact;
- determine whether professional guidance is required.

Priority decreases when:

- the answer is already present;
- the answer would only add cosmetic detail;
- the question asks for unnecessary sensitive data;
- the user cannot reasonably know the answer;
- the answer would not change the analysis.

## 7. Question Selection Rules

### 7.1 Minimal Set

Ask the smallest set that resolves the highest-impact gaps.

Default first-pass limits:

- target: `1-3` questions;
- hard conceptual maximum before re-evaluation: `5` questions;
- one question should resolve one primary uncertainty, even if it also resolves related gaps.

These are product defaults for future validation, not implemented quotas.

### 7.2 Question Quality

Every question must be:

- specific;
- concise;
- answerable;
- neutral;
- non-leading;
- linked to one or more gap IDs;
- accompanied by a short explanation of why it matters;
- expressed in the requested output language;
- free of unnecessary conversational filler.

### 7.3 Avoid Compound Questions

Avoid combining unrelated uncertainties.

Poor:

> What is your budget, deadline, family situation, and risk tolerance?

Better:

> What is the maximum amount you can lose without affecting essential expenses?

The second question resolves a material financial constraint with a clearer answer boundary.

### 7.4 Answer Types

Use structured answer types when they reduce ambiguity:

- `boolean` for clear yes/no constraints;
- `single_select` for mutually exclusive states;
- `multi_select` for applicable factors;
- `number` for material quantities;
- `date` for deadlines;
- `free_text` when nuance is necessary.

Do not force a structured answer when it would distort the user's meaning.

## 8. Contradiction Handling

Contradictions must not be silently reconciled by choosing the most convenient fact.

When material facts conflict:

1. Create a critical contradiction gap.
2. Identify the conflicting claims and their provenance.
3. Ask a neutral reconciliation question.
4. Preserve both claims until the user confirms or corrects them.
5. Record the superseded claim without presenting it as current truth.

Example:

> You described the budget as fixed, but later said additional funding is available. Which condition should the analysis use?

If the contradiction remains unresolved, recommendation must be withheld or explicitly limited.

## 9. Sensitive and High-Stakes Questions

The engine must apply data minimization.

- Ask only for information necessary to assess the decision safely.
- Explain why sensitive information matters.
- Prefer ranges or categories over exact values when sufficient.
- Do not request passwords, secrets, government identifiers, payment-card data, or raw private documents.
- Do not infer medical, legal, financial, political, or psychological facts.
- Do not store clarification answers persistently without a separately approved memory and consent flow.

For medical, legal, financial, self-harm, violence, illegal-activity, or other high-stakes contexts, safety classification occurs before normal question ranking.

## 10. Safety Behavior

### 10.1 Standard

Normal clarification and recommendation rules apply.

### 10.2 Elevated

The engine may ask questions and provide conditional analysis, but it must:

- state limitations;
- avoid professional certainty;
- identify when qualified review is appropriate;
- prefer reversible next steps.

### 10.3 Restricted

The engine must not choose a consequential path for the user. It may:

- clarify immediate safety and scope;
- organize questions for a qualified professional;
- suggest information-gathering steps;
- identify reversible, low-risk next actions.

### 10.4 Refuse

When the request seeks harmful or illegal assistance:

- do not ask questions that improve the user's ability to cause harm;
- do not provide enabling scenarios or optimization;
- provide a clear refusal and safe redirect where appropriate.

## 11. Answer Processing

Clarification answers are evidence records with provenance.

```ts
type ClarificationAnswer = {
  questionId: string;
  answerText: string;
  suppliedAt: string;
  source: "user_answer";
  validation: "accepted" | "ambiguous" | "contradictory" | "out_of_scope";
};
```

Answer processing rules:

- Preserve the user's wording where meaningful.
- Extract structured values without discarding the source answer.
- Mark ambiguity instead of guessing.
- Detect newly introduced contradictions.
- Update only the gaps and entities the answer supports.
- Do not promote an answer to persistent memory during this stage.
- Recalculate completeness, confidence, safety, and recommendation eligibility after merging.

## 12. Re-Questioning Rules

The engine may ask another clarification round only when:

- a critical gap remains;
- an answer introduced a new critical contradiction;
- a safety condition requires another question;
- the user explicitly asks for a deeper analysis.

The engine should not repeatedly ask when:

- remaining gaps are optional;
- uncertainty cannot reasonably be resolved;
- the user chooses to proceed with accepted unknowns;
- the user declines to answer;
- another answer is unlikely to change the output.

When the user declines a critical question, the engine must explain the consequence and provide limited analysis, withhold recommendation, or refuse as required.

## 13. Stop Conditions

Clarification stops when one of these conditions is met:

### Proceed to Analysis

- no unresolved critical gap exists;
- minimum completeness gates pass;
- safety permits analysis;
- remaining uncertainty can be represented explicitly.

### Proceed With Limited Analysis

- no safety blocker exists;
- critical uncertainty is accepted as unknown only where responsible;
- scenarios remain useful;
- recommendation is conditional, deferred, or withheld.

### Withhold Recommendation

- a critical gap cannot be resolved;
- contradiction remains material;
- model confidence remains insufficient;
- the user declines necessary clarification;
- the safety state is restricted.

### Refuse

- the requested assistance is unsafe or prohibited.

## 14. Proceed-Without-Answers Behavior

The user must retain agency to decline clarification, but that choice does not force the engine to recommend.

If the user proceeds without answers:

- unresolved gaps remain visible;
- engine assumptions must be explicit and minimal;
- scenario scope must narrow where necessary;
- confidence must decrease;
- recommendation may become conditional, deferred, or withheld;
- safety gates remain mandatory.

The engine must never imply that skipped questions were answered.

## 15. Relationship to Scenario Generation

Clarification changes scenario generation by:

- adding or removing feasible options;
- defining constraints and trigger conditions;
- identifying delay and information-first scenarios;
- setting adverse-condition assumptions;
- improving risk and benefit evaluation;
- defining indicators to monitor;
- clarifying reversibility and exit conditions.

Scenario generation must not begin as if critical gaps were resolved when they are not.

## 16. Relationship to Recommendation Logic

Clarification supports recommendation eligibility, but it does not guarantee a recommendation.

After clarification, the recommendation engine must still:

- compare meaningful options;
- evaluate goal alignment;
- enforce constraints;
- evaluate risks and benefits symmetrically;
- consider reversibility and cost of delay;
- state assumptions and conditions that change the recommendation;
- expose confidence and unresolved uncertainty.

When information gathering is the most valuable next action, the correct recommendation is `defer`, not a forced choice.

## 17. Example Flows

### 17.1 Missing Goal

User input:

> Should I accept the offer?

Detected gap:

- The action is clear, but the primary goal is unknown.

Question:

> What matters most in this decision: income, long-term career growth, stability, location, or something else?

Why it matters:

- Different goals may reverse the preferred option.

### 17.2 Blocking Constraint

User input:

> Should I invest most of my savings in this business?

Detected gaps:

- Loss tolerance is unknown.
- Essential-expense exposure is unknown.
- Financial context is high-stakes.

Behavior:

- Safety level becomes elevated or restricted.
- Ask for a broad affordable-loss boundary, not exact account details.
- Do not present a confident investment recommendation.
- Suggest qualified financial review and reversible information-gathering steps.

### 17.3 User Declines Clarification

User input:

> I do not want to explain the family constraint. Just tell me whether to move.

Behavior:

- Preserve the unresolved critical constraint.
- Explain that it could reverse the recommendation.
- Provide a limited scenario comparison if safe.
- Withhold the preferred-path recommendation.

### 17.4 Information-First Decision

User input:

> Should I launch now or wait?

Detected gap:

- Demand evidence is weak, but a small reversible test is available.

Behavior:

- Generate an information-first scenario.
- Recommend a bounded validation step if it offers better value than immediate full commitment.

## 18. Quality Metrics for Future Implementation

Future evaluation should measure:

- critical-gap recall;
- false critical-gap rate;
- duplicate-question rate;
- already-answered-question rate;
- average questions before useful analysis;
- question completion rate;
- recommendation-change rate after clarification;
- contradiction detection accuracy;
- safety escalation accuracy;
- user-rated relevance and burden;
- percentage of recommendations with unresolved critical gaps;
- percentage of outputs that clearly distinguish accepted unknowns.

No AI provider should be connected until a representative evaluation set and acceptance thresholds exist.

## 19. Required Test Cases

Future contract tests must include:

- clear model requiring no clarification;
- missing primary goal;
- missing meaningful alternative;
- unknown blocking constraint;
- contradictory facts;
- unresolved important gap;
- user declines a critical question;
- user supplies an ambiguous answer;
- answer introduces a new contradiction;
- high-stakes elevated behavior;
- restricted recommendation behavior;
- harmful request refusal;
- multilingual question generation with stable canonical values;
- repeated request that must not ask an already answered question.

## 20. Current Implementation Boundary

Stage 2.14 does not:

- add clarification UI;
- change `HomeSimulator`;
- change the current mock simulation flow;
- change dashboard or saved simulations;
- create persistence or memory;
- connect OpenAI or another AI provider;
- implement safety classifiers or runtime validators.
