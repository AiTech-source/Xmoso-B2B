# DNS-AID records for xmoso.com

The isitagentready.com audit recommends DNS for AI Discovery (DNS-AID). This cannot be shipped from the Next.js codebase; it must be added in the public DNS zone for `xmoso.com`.

## Recommended records

Publish ServiceMode SVCB or HTTPS records in the authoritative DNS provider for `xmoso.com`.

```dns
_index._agents.xmoso.com. 3600 IN HTTPS 1 xmoso.com. alpn="h2,h3" endpoint="/.well-known/agent-skills/index.json"
_api._agents.xmoso.com. 3600 IN HTTPS 1 xmoso.com. alpn="h2,h3" endpoint="/.well-known/api-catalog"
```

## DNSSEC

Enable DNSSEC signing for the public `xmoso.com` zone and confirm the parent registrar publishes the DS record. DNS-AID is most useful when validating resolvers can return authenticated data.

## Verification checklist

- Query `_index._agents.xmoso.com` for HTTPS/SVCB and confirm it points to `/.well-known/agent-skills/index.json`.
- Query `_api._agents.xmoso.com` for HTTPS/SVCB and confirm it points to `/.well-known/api-catalog`.
- Confirm DNSSEC validation returns authenticated data for the zone.
