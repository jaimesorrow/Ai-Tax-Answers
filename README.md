# Tax Answers

An AI-first, mobile-friendly US federal tax information assistant. It researches IRS.gov, asks relevant follow-up questions, and explains how the retrieved rules relate to the user's facts.

## Run locally

Requires Node.js 22 or later. No third-party packages required.

```sh
cp .env.example .env
# Set OPENAI_API_KEY in .env; never commit it.
npm start
```

Open http://127.0.0.1:3000. Without a key the interface runs, but explicitly reports that live answers are unavailable. Set OPENAI_MODEL to a Responses API model supporting filtered web_search (default gpt-5.4). API usage incurs provider charges.

```sh
npm test
```

## First build

- Chat with suggested starter questions, follow-up conversations, reset, loading/error/retry states and accessible mobile layout.
- Server-side API key; mandatory live web_search restricted to IRS.gov on each turn.
- Tax-year-aware interview instructions: identify tests first, ask up to three unresolved questions, explain missing facts, then provide detailed public rule application and next steps.
- Provider citation annotations checked against HTTPS IRS domains. Responses without completed search and IRS citations are withheld. Citations verify domain/provenance, not the correctness of every individual claim; expert evaluation remains required.
- No database, browser persistence or request-body logging. Conversations stay in browser memory and are sent with each request. Provider storage is disabled with store:false; this does not guarantee zero provider retention. New chat clears browser conversation memory.
- Input limits, same-origin checks, concurrency cap, security headers and CI tests.

## Before a public launch

This is a runnable development MVP, not a released Android app. Live provider integration needs a configured key and end-to-end validation. Validate interview accuracy with reviewed cases for dependencies, self-employment, filing status and credits, including historical years and contradictory facts. Add authentication, per-user rate/budget limits and secure HTTPS hosting before exposing the paid endpoint publicly; the current global concurrency cap is not a per-user abuse control. Keep the default loopback binding during development.

Future Android packaging can reuse this API and chat flow in a native client. Play Store packaging, signing, privacy disclosures and release checks are not included. No payments, tax filing, document uploads or state tax advice in this initial scope.

The existing repository license is preserved.

Implementation reference: [OpenAI Responses API web search](https://developers.openai.com/api/docs/guides/tools-web-search).
