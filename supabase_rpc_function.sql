-- 在 Supabase SQL Editor 中运行此函数
-- 这个函数可以访问 seiyo_academy schema 中的表

CREATE OR REPLACE FUNCTION validate_entry_code(p_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_entry RECORD;
  v_result JSON;
BEGIN
  -- 查询考号
  SELECT id, code, is_used
  INTO v_entry
  FROM seiyo_academy.entry_codes
  WHERE code = UPPER(TRIM(p_code))
    AND is_used = false
  LIMIT 1;

  -- 如果找不到或已使用
  IF NOT FOUND THEN
    RETURN json_build_object(
      'valid', false,
      'error', '考号不存在或已被使用'
    );
  END IF;

  -- 更新为已使用
  UPDATE seiyo_academy.entry_codes
  SET is_used = true,
      used_at = NOW()
  WHERE id = v_entry.id;

  -- 返回成功
  RETURN json_build_object(
    'valid', true,
    'code', v_entry.code
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'valid', false,
      'error', '系统错误: ' || SQLERRM
    );
END;
$$;

-- 授予 anon 角色执行权限
GRANT EXECUTE ON FUNCTION validate_entry_code(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION validate_entry_code(TEXT) TO authenticated;
