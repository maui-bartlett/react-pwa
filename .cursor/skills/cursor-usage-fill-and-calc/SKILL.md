---
name: cursor-usage-fill-and-calc
description: Prompt for missing Cursor usage values (used, remaining, total) and then compute usage percentages. Use this when the user wants a quick guided prompt to fill missing usage numbers before calculating used and remaining percentages.
---

# Cursor Usage Fill + Calc

Collect missing usage inputs in one short prompt, then compute and report percentages.

## Trigger guidance

Use this skill when:
- the user asks for a quick guided flow
- usage values are partial or missing
- the user wants the agent to ask for exactly what is needed

## Step 1: Determine what is missing

Valid complete pairs are:
- `used` + `total`
- `remaining` + `total`
- `used` + `remaining`

If a complete pair is already present, skip to Step 3.

## Step 2: Ask one compact follow-up

If values are missing, ask in a single message:

`Please share any two values you have (used, remaining, total), and include units (for example: $ or tokens).`

Do not ask multiple separate questions unless the user response is still incomplete.

## Step 3: Derive normalized values

Use:
- `used = total - remaining`
- `remaining = total - used`
- `total = used + remaining`

Validation:
- `total > 0`
- `used >= 0`
- `remaining >= 0`

If validation fails, explain the issue briefly and ask for corrected values.

## Step 4: Compute percentages

- `used_percent = (used / total) * 100`
- `remaining_percent = (remaining / total) * 100`

Round displayed percentages to one decimal place.

## Step 5: Response template

Always return:

`Used: <used> / <total> (<used_percent>%)`
`Remaining: <remaining> / <total> (<remaining_percent>%)`
`Math: (<used> / <total>) * 100 = <used_percent>%`

## Constraints

- Never invent numbers.
- Preserve user-provided units and keep them consistent in output.
- If multiple usage pools are provided, compute each pool separately and label them.
