import { createClient } from "@supabase/supabase-js";
import { getDeviceId } from "./deviceId";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export async function saveResult({ characterId, scores, inviteCode }) {
  if (!supabase) return { error: null };
  return supabase.from("quiz_results").insert({
    character_id: characterId,
    scores: scores,
    invite_code: inviteCode || null,
    created_at: new Date().toISOString(),
  });
}

export async function verifyInviteCode(code) {
  if (!supabase) return { valid: true };
  const { data, error } = await supabase
    .from("invite_codes")
    .select("id, used_count, max_uses")
    .eq("code", code)
    .single();

  if (error || !data) return { valid: false, error: "邀请码不存在" };
  if (data.max_uses && data.used_count >= data.max_uses)
    return { valid: false, error: "邀请码已达到使用上限" };

  await supabase
    .from("invite_codes")
    .update({ used_count: data.used_count + 1 })
    .eq("id", data.id);

  return { valid: true };
}

/**
 * 验证考号（支持设备绑定和多次使用）
 * @param {string} code - 用户输入的考号
 * @returns {Promise<{valid: boolean, error?: string, remainingUses?: number}>}
 */
export async function validatePasscode(code) {
  if (!supabase) {
    console.error("Supabase client not initialized");
    return { valid: false, error: "数据库连接失败" };
  }

  try {
    const trimmedCode = code.toUpperCase().trim();
    const deviceId = getDeviceId();

    console.log("Validating code:", trimmedCode);
    console.log("Device ID:", deviceId);

    // 调用 RPC 函数，传入考号和设备ID
    const { data, error } = await supabase
      .rpc('validate_entry_code', {
        p_code: trimmedCode,
        p_device_id: deviceId
      });

    console.log("RPC result:", { data, error });

    if (error) {
      console.error("RPC error:", error);
      return {
        valid: false,
        error: `验证失败: ${error.message}`
      };
    }

    // data 是 JSON 对象 {valid: boolean, error?: string, code?: string, remaining_uses?: number}
    if (data && data.valid) {
      console.log("Validation successful");
      console.log("Remaining uses:", data.remaining_uses);
      return {
        valid: true,
        remainingUses: data.remaining_uses
      };
    } else {
      return {
        valid: false,
        error: data?.error || "考号无效"
      };
    }
  } catch (err) {
    console.error("Passcode validation error:", err);
    return { valid: false, error: "系统错误，请稍后重试" };
  }
}


