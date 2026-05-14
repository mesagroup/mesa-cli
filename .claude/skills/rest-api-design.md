---
name: rest-api-design
description: REST conventions enforced across MESA projects. Use when designing new endpoints or reviewing existing routes.
when_to_use:
  - designing a new API endpoint
  - reviewing PR that adds/changes routes
  - resolving "should this be POST or PUT?" questions
---

# REST API design

## Resources & methods

| Verb   | Path                       | Purpose                          | Success status |
| ------ | -------------------------- | -------------------------------- | -------------- |
| GET    | `/api/widgets`             | List (paginated)                 | 200            |
| GET    | `/api/widgets/:id`         | Read one                         | 200            |
| POST   | `/api/widgets`             | Create (server assigns id)       | 201            |
| PUT    | `/api/widgets/:id`         | Replace (idempotent)             | 200 or 204     |
| PATCH  | `/api/widgets/:id`         | Partial update                   | 200            |
| DELETE | `/api/widgets/:id`         | Delete                           | 204            |

- **Resource names are plural nouns**. `/api/users`, not `/api/getUser`.
- **Sub-resources** for ownership: `/api/users/:id/uploads`.
- **No verbs in URLs** except for clear action endpoints (`/api/auth/login`).

## Status codes

- 200 OK — successful read or update.
- 201 Created — successful create. Include `Location` header.
- 204 No Content — successful delete or update with no body.
- 400 Bad Request — validation failed (Zod error).
- 401 Unauthorized — no/invalid token.
- 403 Forbidden — token is valid but caller lacks permission.
- 404 Not Found — resource doesn't exist (or caller can't see it).
- 409 Conflict — duplicate (e.g. username already taken).
- 422 Unprocessable Entity — semantic validation (e.g. business rule).
- 500 Internal Server Error — unexpected.

## Pagination

```http
GET /api/widgets?limit=50&cursor=eyJpZCI6MTIzfQ
```

Response:

```json
{
  "data": [ ... ],
  "nextCursor": "eyJpZCI6MTczfQ",
  "hasMore": true
}
```

## Errors

```json
{
  "error": "username already taken",
  "code": "USERNAME_TAKEN"
}
```

Always `error` (string). Optionally `code` (UPPER_SNAKE machine ID).
Never include stack traces or internal field names.

## Security

- All non-public endpoints require JWT (`Authorization: Bearer <token>`).
- Validate request body, query, and headers with Zod.
- Rate-limit `/api/auth/login` and `/api/auth/register`.
