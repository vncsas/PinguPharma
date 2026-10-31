import type { FieldValues, Resolver } from "react-hook-form";
import type { ZodTypeAny } from "zod";

export function zodResolver<T extends FieldValues>(schema: ZodTypeAny): Resolver<T> {
  return async (values) => {
    const r = schema.safeParse(values);
    if (r.success) return { values: r.data, errors: {} };
    const errors: Record<string, { type: string; message: string }> = {};
    for (const i of r.error.issues) {
      const key = String(i.path[0] ?? "root");
      if (!errors[key]) errors[key] = { type: i.code, message: i.message };
    }
    return { values: {}, errors } as never;
  };
}
