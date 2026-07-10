# @kindkitchen/plopper

Opinionated code-generation toolbox. One package, two sibling generators that
share the same idea — produce and maintain repetitive code from small
declarations — but attack it from different angles:

| Sibling         | Entry point                            | What it does                                                                                       |
| --------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **xstate**      | `jsr:@kindkitchen/plopper/xstate`      | Code-generators for opinionated xstate declaration strategies (machines, const-x types, charts).   |
| **templatizer** | `jsr:@kindkitchen/plopper/templatizer` | Bidirectional template generator: template → code (`generate`) and code → template (`templatize`). |

## xstate

Keeps xstate machines both expressive and chart-friendly by generating the
boilerplate that state-chart tooling requires from minimal developer
declarations.

```sh
deno run -A jsr:@kindkitchen/plopper/xstate --help
```

Read more: [src/lib/x_plopper/README.md](./src/lib/x_plopper/README.md)

## templatizer

Copies a directory and rewrites placeholder tokens in file names, directory
names, and contents — in either direction. Ships a self-contained Agent Skill
installable via `install-skill`.

```sh
deno run -A jsr:@kindkitchen/plopper/templatizer --help
```

Read more: [src/generate-template/README.md](./src/generate-template/README.md)

## License

MIT
