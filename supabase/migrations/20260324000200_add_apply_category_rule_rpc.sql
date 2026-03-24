-- RPC function to apply category rules retroactively using SQL-level filtering
-- Much more efficient than fetching all transactions to client
CREATE OR REPLACE FUNCTION apply_category_rule_retroactively(
  p_user_id UUID,
  p_pattern TEXT,
  p_match_type TEXT,
  p_category_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  affected INTEGER;
BEGIN
  IF p_match_type = 'exact' THEN
    UPDATE transactions
    SET category_id = p_category_id, category_confidence = 1.0
    WHERE user_id = p_user_id
      AND (category_id IS NULL OR category_id != p_category_id)
      AND lower(coalesce(description, '') || ' ' || coalesce(merchant_name, '')) = p_pattern;
  ELSE
    UPDATE transactions
    SET category_id = p_category_id, category_confidence = 1.0
    WHERE user_id = p_user_id
      AND (category_id IS NULL OR category_id != p_category_id)
      AND lower(coalesce(description, '') || ' ' || coalesce(merchant_name, '')) ILIKE p_pattern;
  END IF;

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;
