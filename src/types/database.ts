export type { Database } from './supabase';

import type { Database } from './supabase';

type Tables = Database['public']['Tables'];

export type Profile = Tables['profiles']['Row'];
export type UserSettings = Tables['user_settings']['Row'];
export type BankConnection = Tables['bank_connections']['Row'];
export type Account = Tables['accounts']['Row'];
export type Transaction = Tables['transactions']['Row'];
export type Category = Tables['categories']['Row'];
export type RecurringTransaction = Tables['recurring_transactions']['Row'];
export type Subscription = Tables['subscriptions']['Row'];
export type ChatMessage = Tables['chat_messages']['Row'];
export type ChatUsage = Tables['chat_usage']['Row'];
