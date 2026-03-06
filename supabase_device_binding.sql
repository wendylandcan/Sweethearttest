-- 删除旧函数并创建新的设备绑定验证函数
DROP FUNCTION IF EXISTS validate_entry_code(TEXT);

CREATE OR REPLACE FUNCTION validate_entry_code(p_code TEXT, p_device_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_entry RECORD;
BEGIN
  -- 查询考号信息
  SELECT id, code, is_used, used_count, max_uses, bound_device_id
  INTO v_entry
  FROM seiyo_academy.entry_codes
  WHERE code = UPPER(TRIM(p_code))
  LIMIT 1;

  -- 考号不存在
  IF NOT FOUND THEN
    RETURN json_build_object(
      'valid', false,
      'error', '考号不存在'
    );
  END IF;

  -- 检查使用次数是否已满
  IF v_entry.used_count >= v_entry.max_uses THEN
    RETURN json_build_object(
      'valid', false,
      'error', '该考号的使用次数已达上限'
    );
  END IF;

  -- 检查设备绑定
  IF v_entry.bound_device_id IS NOT NULL AND v_entry.bound_device_id != p_device_id THEN
    RETURN json_build_object(
      'valid', false,
      'error', '该考号已绑定其他设备，无法跨设备使用'
    );
  END IF;

  -- 更新数据：增加使用次数，绑定设备（如果首次使用）
  UPDATE seiyo_academy.entry_codes
  SET
    used_count = used_count + 1,
    bound_device_id = COALESCE(bound_device_id, p_device_id),
    is_used = CASE
      WHEN (used_count + 1) >= max_uses THEN true
      ELSE is_used
    END
  WHERE id = v_entry.id;

  -- 返回成功
  RETURN json_build_object(
    'valid', true,
    'code', v_entry.code,
    'remaining_uses', v_entry.max_uses - v_entry.used_count - 1
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'valid', false,
      'error', '系统错误: ' || SQLERRM
    );
END;
$$;

-- 授予权限
GRANT EXECUTE ON FUNCTION validate_entry_code(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION validate_entry_code(TEXT, TEXT) TO authenticated;
