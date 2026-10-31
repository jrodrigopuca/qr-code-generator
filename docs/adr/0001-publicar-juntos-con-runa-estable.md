# ADR-0001: Publicar los paquetes juntos cuando Runa sea estable

- Status: accepted
- Drivers:
  - En `core`, `react`, `vue`, `wifi`, `vcard` y `compress`, el tarball frente a npm solo cambia `engines` (`>=18` a `>=24`) y `.d.ts` regenerados: ninguna mejora para quien los instala, y un major solo agregaría un requisito.
  - `packages/cli` es el único paquete con cambios reales y depende de `@runa-cmd/core` y `@runa-cmd/help` fijados en `0.2.0-beta.0`, con 5 workarounds listados en `docs/runa-dx-feedback.md`.
- Decision: no publicar ningún paquete por ahora. Cuando Runa tenga versión estable, se saca la CLI 2.0.0 sin esos workarounds y las librerías en el mismo release. `qr-pure` queda fuera: está deprecado.
- Tradeoff accepted: `master` queda adelantado respecto de npm, y `@qr-plus/cli` sigue publicado con commander hasta entonces.
- Revisit if: Runa publica una versión estable, aparece una vulnerabilidad que afecte el código publicado, o una librería necesita un cambio funcional antes de que Runa esté lista.

## Al publicar

- Publicar `core` primero, porque `workspace:^` toma su versión al empaquetar.
- Documentar el corte a Node 24 en `CHANGELOG.md`.
- Agregar `vue` y `compress` a la lista de publicación de `CONTRIBUTING.md`.
- Crear un tag de git por release: hoy no hay ninguno.
