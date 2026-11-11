# NOTES — "update a user" endpoint (`PUT /users/:id`)

## Plan

The task was given to Claude Code directly as a single instruction ("read the README, implement PUT /users/:id with validation and 404, make `npm test` green, commit in logical units") rather than through an interactive plan-mode session, so there was no separate plan to edit before approval. The plan Claude followed after reading the README, the existing routes, `db/store.js`, and `tests/update-user.test.js` was:

1. Add an `updateUser(id, { name, email })` helper to `db/store.js` that returns the updated user, or `undefined` when the id doesn't exist (same "return undefined, let the route decide the status" pattern as `getUserById`).
2. Add `PUT /users/:id` in `routes/users.js`: validate the body first (400), then call the store helper and return 404 if it found nothing, otherwise 200 with the user.
3. Write this `NOTES.md`.

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

The split follows the layers: the store change stands on its own and can be reviewed and reverted on its own, and the route builds on it. Docs are kept apart so the code history stays clean.

## Review

Besides `npm test` and `npm run lint`, the endpoint was tested by hand with supertest: blank name, non-string name, invalid email, non-numeric id, a non-JSON body, and a body that tries to change `id`. Each gave the expected 400, 404, or 200. The review confirmed:
- Missing or non-JSON bodies don't crash. `express.json()` leaves `req.body` as `{}`, and the validator also guards against `undefined`, so both get a clean 400.
- The not-found path can't throw, because the store returns `undefined` instead of touching a missing object.

One small thing the review flagged and that was left as it is: the new endpoint trims `name` but `POST /users` does not, so the two endpoints are slightly inconsistent. Changing POST was out of scope for this change.
