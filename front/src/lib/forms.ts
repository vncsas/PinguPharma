import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormProps } from "react-hook-form";
import type { z } from "zod";
import { errorMessage } from "./api-client";

/** `useForm` com validação por schema zod; os erros aparecem ao sair do campo e a cada submit. */
export function useZodForm<S extends z.ZodTypeAny>(
  schema: S,
  options?: Omit<UseFormProps<z.input<S>, unknown, z.output<S>>, "resolver">,
) {
  return useForm<z.input<S>, unknown, z.output<S>>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    ...options,
  });
}

/** Mensagem de erro da API para exibir no `FormError` do formulário (campo `root`). */
export function serverError(err: unknown, fallback: string) {
  return { type: "server", message: errorMessage(err, fallback) } as const;
}
