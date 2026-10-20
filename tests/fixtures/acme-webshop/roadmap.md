### 0 – 30 dagen

- F-01: autorisatiecontrole op orderniveau centraliseren in de API-middleware; alle object-endpoints daarop nalopen
- F-02: geparametriseerde query's in de zoekfunctie; code-review van overige database-aanroepen
- F-03: Apache op de DMZ bijwerken en in de maandelijkse patchcyclus opnemen

### 30 – 90 dagen

- F-04: output-encoding in de retourpagina en een Content-Security-Policy voor de storefront
- F-05: rate limiting op de API en het inlogformulier, met monitoring op afwijkende aantallen verzoeken
- F-06 t/m F-08: foutafhandeling, beveiligingsheaders en directory listing

### Structureel

- OWASP ASVS niveau 2 als eis bij nieuwe functionaliteit; security-review in de definition of done
- Jaarlijkse externe penetratietest en een hertest na iedere grote release
