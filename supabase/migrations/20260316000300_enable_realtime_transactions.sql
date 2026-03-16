-- Enable Supabase Realtime on transactions and accounts tables
-- This allows the frontend to receive live updates when webhooks insert new data

ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE accounts;
