export type AppMode = 'B2B' | 'B2C';

export const APP_MODE = (process.env.NEXT_PUBLIC_APP_MODE as AppMode) || 'B2C';
export const isB2CMode = APP_MODE === 'B2C';
export const isB2BMode = APP_MODE === 'B2B';
export const hasOrders = true;
