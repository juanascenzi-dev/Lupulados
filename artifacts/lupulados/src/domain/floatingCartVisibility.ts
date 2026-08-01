export interface FloatingCartVisibilityInput {
  totalItems: number;
  pathname: string;
  hash: string;
  orderFlowActive: boolean;
}

export function shouldShowFloatingCart({
  totalItems,
  pathname,
  hash,
  orderFlowActive,
}: FloatingCartVisibilityInput) {
  if (totalItems <= 0) return false;
  if (pathname !== "/") return false;
  if (hash === "#arma-tu-pedido") return false;
  if (orderFlowActive) return false;
  return true;
}
