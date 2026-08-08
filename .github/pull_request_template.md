## Descripción

<!-- Qué cambia y por qué. -->

## Tipo de cambio

- [ ] feat
- [ ] fix
- [ ] refactor
- [ ] docs
- [ ] chore
- [ ] test

## Cómo se testeó

<!-- Pasos manuales, tests agregados, capturas si aplica. -->

## Checklist

- [ ] `pnpm run typecheck` pasa en local
- [ ] `pnpm run lint` pasa en local
- [ ] `pnpm run test` pasa en local
- [ ] Se agregó la entrada correspondiente en `CHANGELOG.md` bajo `[Unreleased]`
- [ ] La lógica de negocio nueva/tocada tiene test
- [ ] No hay `console.*` nuevo sin gate a `import.meta.env.DEV`
- [ ] No hay `catch` de I/O real (Supabase, storage) sin `reportError(error, { scope })`
- [ ] Si se tocó `src/domain`, el `.md` compañero del archivo sigue reflejando el comportamiento real
