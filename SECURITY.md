# Security Policy

## Reporting a vulnerability

If you find a security issue in this project, please **do not** open a public GitHub issue.

Email the repository owner (GitHub: [@WorkerBNTU](https://github.com/WorkerBNTU)) with:

- short description of the issue
- steps to reproduce
- impact (e.g. unauthenticated access, data leak, XSS)

We aim to respond within a few business days. Please give us reasonable time to fix before any public disclosure.

## Scope notes

- Production secrets (`.env`, Telegram tokens, admin passwords) must never be committed.
- Media uploads and lead PII are handled on the server; treat dumps/`backups/` as sensitive.
