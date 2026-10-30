export const ACTION_TONE: Record<string, "success" | "warn" | "danger" | "brand"> = {
  PRODUCT_CREATED: "success",
  PRODUCT_UPDATED: "warn",
  PRODUCT_DELETED: "danger",
  SALE_CREATED: "success",
  SALE_CANCELED: "danger",
  USER_CREATED: "success",
  USER_UPDATED: "warn",
  USER_DELETED: "danger",
  PASSWORD_RESET: "warn",
};

export const ACTION_LABEL: Record<string, string> = {
  PRODUCT_CREATED: "Produto criado",
  PRODUCT_UPDATED: "Produto atualizado",
  PRODUCT_DELETED: "Produto excluído",
  SALE_CREATED: "Venda registrada",
  SALE_CANCELED: "Venda cancelada",
  USER_CREATED: "Usuário criado",
  USER_UPDATED: "Usuário atualizado",
  USER_DELETED: "Usuário excluído",
  PASSWORD_RESET: "Senha redefinida",
};
