// Quote identifiers in PostgREST expressions, preserving spaces and punctuation.
export function quoteIdentifier(name) { return `"${name.replaceAll('"', '\\"')}"`; }
