// deno-lint-ignore-file no-namespace
export namespace GenerateConstX {
    export type Input = {
        state: string[];
        event: string[];
        guard: string[];
        action: string[];
        delay: string[];
        actor: string[];
    };

    export type Output = {
        state: {
            [name: string]: {
                name: string;
                ref: string;
                description: string;
            };
        };
        event: { [type: string]: { type: string } & Record<string, unknown> };
    } & Record<"guard" | "action" | "delay" | "actor", Record<string, string>>;
}
