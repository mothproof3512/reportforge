## Gedetailleerde foutmeldingen en stacktraces

**Severity**: Low · **CVSS 3.1**: 3.7 (`CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N`) · **Status**: Confirmed · **Source**: Handmatig · **Mapping**: A05:2021, WSTG-ERRH-01, WSTG-ERRH-02, V7 · **CWE**: 209 · **Tags**: web, api, configuratie

**Affected**:

- (vul in: host, URL of systeem)

### Description

Bij ongeldige invoer of een interne fout geeft de applicatie een volledige foutmelding terug, inclusief stacktrace, interne bestandspaden, frameworkversies, databasequery's en/of hostnamen van interne systemen. De debug-modus van het framework lijkt actief te zijn op een omgeving die voor gebruikers bereikbaar is.

### Impact

De informatie helpt een aanvaller bij het voorbereiden van gerichte aanvallen: exacte versies om exploits op te zoeken, paden en tabelnamen voor injectie-aanvallen en interne hostnamen voor laterale beweging. In sommige frameworks biedt de debug-pagina bovendien een interactieve console, wat direct tot code-uitvoering leidt.

### Evidence

_Vul hier het bewijs uit de opdracht in: de betrokken parameter of functie, de reproductiestappen, het verzoek en antwoord (ingekort) en een screenshot. Neem alleen het relevante deel op en anonimiseer gegevens van derden._

### Recommendation

- Schakel de debug-modus uit op elke omgeving die van buiten bereikbaar is en geef gebruikers een generieke foutmelding met een correlatie-ID.
- Log de details server-side en koppel ze aan het correlatie-ID, zodat de informatie voor beheerders beschikbaar blijft.
- Controleer dat ook de reverse proxy of API-gateway geen interne details lekt bij fouten (502/504-pagina's).

### References

- OWASP Error Handling Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html
- CWE-209: https://cwe.mitre.org/data/definitions/209.html
