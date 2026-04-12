import instrumentSchema from "@/data/schemas/instrument.schema.json";

export interface SchemaEntry {
  subject: string;
  version: string;
  schema: unknown;
}

const SCHEMAS: SchemaEntry[] = [
  {
    subject: "wave-i-instrument",
    version: "1.0.0",
    schema: instrumentSchema,
  },
];

export function listRegisteredSchemas(): SchemaEntry[] {
  return [...SCHEMAS];
}

export function getSchema(subject: string): SchemaEntry | undefined {
  return SCHEMAS.find((schema) => schema.subject === subject);
}
