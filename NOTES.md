# NOTES — "update a user" endpoint (`PUT /users/:id`)

## Plan

**The plan-mode review happened after the code was written, not before.** The task was first given to Claude Code as a single instruction ("read the README, implement PUT /users/:id with validation and 404, make `npm test` green, commit in logical units"), so the endpoint was built without a plan-mode review. The AI mentor's PR review pointed this out. In response, Claude entered plan mode, wrote up the plan for the feature as built, and I reviewed and approved it with ExitPlanMode. The README's "plan first, then build" order was therefore not followed. The plan was reviewed after the fact, as a check on the design.

The plan I approved:

1. **`db/store.js`**: add `updateUser(id, { name, email })`. It uses the existing `getUserById` to find the user and returns `undefined` if the user doesn't exist, so the store never decides HTTP status codes; the route does. It replaces `name` and `email` and never changes the `id`.
2. **`routes/users.js`**: add `PUT /:id`. It checks the input first (400), then calls the store helper. If the store returns nothing it responds 404 `{ error: "User not found" }`, otherwise 200 with the updated user.
3. **Commits**: store helper, then route and validation, then NOTES.md. One logical change each.
4. **Out of scope**: PATCH (partial updates) and changing `POST /users`.

When reviewing, I checked the points the README asks about: the plan touches the right files (the route and `db/store.js`, without editing the tests), and it handles not-found and invalid input the way the tests expect. **I approved the plan without edits.** Because nothing changed, the code needed no follow-up changes.

Design choices:
- **PUT means replace**, so both `name` and `email` are required (this is also what the 400 test expects). Partial updates would be a `PATCH`.
- **Validation before lookup**: invalid input is a 400 whether or not the user exists. This is cheaper and gives the client a consistent answer.
- Validation goes beyond "present": `name` must be a non-empty string (it is trimmed before saving), and `email` must look like an address (`x@y.z`). The error body uses the same `{ error: "..." }` shape as the existing routes.
- The 404 body (`{ error: "User not found" }`) matches `GET /users/:id`. Non-numeric ids also return 404, as they do for GET.
- An `id` in the request body is ignored; the id can't change.

## Model

Claude Opus 5.5. The feature is small, but the work covered reading the README and tests, matching existing conventions, making several commits, and a self-review, all from one instruction. A stronger model makes it more likely the edge cases (wrong types, blank strings, non-JSON bodies, non-numeric ids) get handled the first time. For a change this size, a faster model such as Sonnet would also have been reasonable.

## Commits

1. `Add updateUser helper to the in-memory store`: the data-access layer only.
2. `Add PUT /users/:id endpoint to update a user`: the route plus validation. This is the commit that turns the update-user tests green.
3. `Add NOTES.md`: this write-up.
4. `Update NOTES.md to record the plan-mode review`: after the mentor's review, records the plan review done after the code was written.

The split follows the layers: the store change stands on its own and can be reviewed and reverted on its own, and the route builds on it. Docs are kept apart so the code history stays clean.

## Review

Besides `npm test` and `npm run lint`, the endpoint was tested by hand with supertest: blank name, non-string name, invalid email, non-numeric id, a non-JSON body, and a body that tries to change `id`. Each gave the expected 400, 404, or 200. The review confirmed:
- Missing or non-JSON bodies don't crash. `express.json()` leaves `req.body` as `{}`, and the validator also guards against `undefined`, so both get a clean 400.
- The not-found path can't throw, because the store returns `undefined` instead of touching a missing object.

One small thing the review flagged and that was left as it is: the new endpoint trims `name` but `POST /users` does not, so the two endpoints are slightly inconsistent. Changing POST was out of scope for this change.
