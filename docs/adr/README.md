# Decisiones de arquitectura

| ADR | Decisión | Estado |
|---|---|---|
| [0001](0001-publicar-juntos-con-runa-estable.md) | Publicar los paquetes juntos cuando Runa sea estable | accepted |

## Notas

- **ADR-0001:** la decisión sigue vigente, pero sus drivers describen `0.2.0-beta.0`. Desde `0.2.0-beta.2`, la CLI depende solo de `@runa-cmd/core` y ya no tiene workarounds. `docs/runa-dx-feedback.md` se movió a `docs/research/2026-10-qr-plus-migration.md`, en el repo `runa-cmd`.
- **ADR-0001, noviembre 2026:** se cumplió su condición, Runa publicó la 1.0.0. La CLI depende de `@runa-cmd/core` `^1.0.0`, porque desde la 1.0 Runa promete no romper en un minor los exit codes, los streams ni los flags. Todos los paquetes salen como 2.0.0, porque subir el mínimo de Node a 24 rompe a quien usa Node 18.
