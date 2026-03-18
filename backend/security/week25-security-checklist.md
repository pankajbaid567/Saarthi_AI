# Week 25 Security Testing Checklist

- OWASP Top 10 endpoint review (auth, upload, prompt-input, RBAC, rate limiting)
- Dependency scan command: `npm audit`
- API fuzzing focus:
  - auth payloads
  - quiz chat prompt payloads
  - mains submission payloads
- Gate override abuse testing:
  - non-admin override requests must return 403
  - override reason required for admin requests

## Existing automated coverage references

- `backend/tests/week18.routes.test.ts` (gate override abuse and role checks)
- `backend/tests/auth.routes.test.ts` (auth validation + token checks)
- `backend/tests/pdf.routes.test.ts` (upload validation)
