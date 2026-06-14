export type Subname = {
  raw: string;
  value: string;
  name: string;
  clarifications: readonly string[];
  parts: readonly string[];
};

type ParseOptions = {
  lowercase?: boolean;
};

const identifier_pattern = /^[A-Za-z0-9-]+$/;
const pattern_identifier_pattern = /^(\*|\*\*|[A-Za-z0-9-]+)$/;

const parse_parts = (
  input: unknown,
  { lowercase = false }: ParseOptions,
  pattern: RegExp,
) => {
  if (typeof input !== "string") {
    throw new Error("Subname must be a string");
  }

  const value = (lowercase ? input.toLowerCase() : input).trim();

  if (!value) {
    throw new Error("Subname must not be empty");
  }

  const parts = value.split(".");

  for (const part of parts) {
    if (!part || !pattern.test(part)) {
      throw new Error(`Invalid subname part: ${part}`);
    }
  }

  return { value, parts };
};

export class SubnameHelper {
  static parse(input: unknown, options: ParseOptions = {}): Subname {
    const { value, parts } = parse_parts(input, options, identifier_pattern);

    return {
      raw: String(input),
      value,
      name: parts[0],
      clarifications: parts.slice(1),
      parts,
    };
  }

  static has_clarification(subname: Subname, clarification: string): boolean {
    return subname.clarifications.includes(clarification);
  }

  static match(input: unknown, pattern: string, options: ParseOptions = {}): boolean {
    const subname = SubnameHelper.parse(input, options);
    const { parts: pattern_parts } = parse_parts(
      pattern,
      options,
      pattern_identifier_pattern,
    );

    return match_parts(subname.parts, pattern_parts);
  }
}

const match_parts = (
  value_parts: readonly string[],
  pattern_parts: readonly string[],
) => {
  for (let index = 0; index < pattern_parts.length; index += 1) {
    const pattern_part = pattern_parts[index];

    if (pattern_part === "**") {
      return index === pattern_parts.length - 1;
    }

    if (value_parts[index] === undefined) {
      return false;
    }

    if (pattern_part !== "*" && pattern_part !== value_parts[index]) {
      return false;
    }
  }

  return value_parts.length === pattern_parts.length;
};
