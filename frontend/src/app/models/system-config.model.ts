export interface SystemConfig {
  _id?: string;
  manuallyClosedOrders: boolean;
  closureMessage: string;
  closedBy?: string;
  closedAt?: Date;
  updatedAt?: Date;
}

export interface UpdateOrdersStatusDto {
  manuallyClosedOrders: boolean;
  closureMessage?: string;
}
