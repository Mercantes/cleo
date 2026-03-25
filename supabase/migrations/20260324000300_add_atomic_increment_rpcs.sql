-- Atomic increment for usage_tracking (tier limits: transactions, chat_messages, bank_connections)
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_feature TEXT,
  p_period TEXT
) RETURNS INT AS $$
DECLARE
  new_count INT;
BEGIN
  INSERT INTO usage_tracking (id, user_id, feature, count, period)
  VALUES (gen_random_uuid(), p_user_id, p_feature, 1, p_period)
  ON CONFLICT (user_id, feature, period)
  DO UPDATE SET count = usage_tracking.count + 1
  RETURNING count INTO new_count;

  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic increment for chat_usage
CREATE OR REPLACE FUNCTION increment_chat_usage(
  p_user_id UUID,
  p_period TEXT
) RETURNS INT AS $$
DECLARE
  new_count INT;
BEGIN
  INSERT INTO chat_usage (id, user_id, message_count, period)
  VALUES (gen_random_uuid(), p_user_id, 1, p_period)
  ON CONFLICT (user_id, period)
  DO UPDATE SET message_count = chat_usage.message_count + 1
  RETURNING message_count INTO new_count;

  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
