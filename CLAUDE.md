# VECTOR Engineering website

Statische site (index.html, css/, js/) op Vercel, met een serverless contactformulier (api/contact.js, nodemailer via Strato SMTP).

## Wijzigen en live zetten
1. Pas de bestanden aan; verhoog `?v=` achter css/js in index.html bij elke wijziging aan die bestanden.
2. Commit en push naar `main` op GitHub. Vercel deployt automatisch.
3. SMTP-gegevens staan alleen als environment variables in Vercel (zie .env.example). Nooit committen of tonen.

`_php-oud/` is de oude PHP-versie, alleen ter referentie en niet in git.
