---
name: cursor-usage-percentage
description: Calculate Cursor usage percentage from total available usage. Use this whenever the user asks how much Cursor usage is used/left, asks for quota percentage, asks for remaining budget as a percent, or asks to interpret Cursor dashboard usage values.
---

# Cursor Usage Percentage

Provide an accurate usage percentage for Cursor usage/budget and show the math clearly.

## When this skill is relevant

Use this skill when the user asks things like:
- "How much of my Cursor usage have I used?"
- "What percentage do I have left?"
- "How much quota is remaining?"
- "Can you interpret these Cursor usage numbers?"

## Data collection order

1. Try to obtain usage values from user-provided context first:
   - pasted dashboard values
   - screenshots
   - billing/usage export text
2. If values are missing, ask for the minimum required numbers instead of guessing.
3. If multiple pools are shown (for example API and Auto/Composer), compute each pool separately and label each result.

## Required inputs

Use any one complete pair:
- `used` and `total`
- `remaining` and `total`
- `used` and `remaining` (derive `total`)

If none of these pairs are available, ask the user for the missing values.

## Calculation rules

1. Derive missing values:
   - `used = total - remaining`
   - `remaining = total - used`
   - `total = used + remaining`
2. Validate inputs:
   - `total` must be greater than 0
   - `used` and `remaining` should not be negative
3. Compute percentages:
   - `used_percent = (used / total) * 100`
   - `remaining_percent = (remaining / total) * 100`
4. Round to one decimal place for display, but keep raw arithmetic internally.

## Response format

Always report:
1. Used amount out of total
2. Used percentage
3. Remaining amount out of total
4. Remaining percentage
5. A one-line formula with substituted values

Use this exact structure:

`Used: <used> / <total> (<used_percent>%)`
`Remaining: <remaining> / <total> (<remaining_percent>%)`
`Math: (<used> / <total>) * 100 = <used_percent>%`

## Behavior constraints

- Never invent or assume usage numbers.
- If values conflict, show the conflict and ask the user which values to trust.
- If there are separate usage pools, do not combine them unless the user explicitly asks for a combined total.
