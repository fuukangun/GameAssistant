export interface AppError {
  code: string;
  message: string;
  detail?: string;
  recoverable: boolean;
}

export type AppResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: AppError };

const USER_MESSAGES: Record<string, string> = {
  save_dir_not_found: '未在默认路径找到星露谷存档，请手动选择存档目录。',
  permission_denied: '无法读取该目录，请检查文件权限或选择其他目录。',
  save_xml_invalid: '存档文件无法解析，可能已损坏或格式不受支持。',
  required_field_missing: '存档缺少关键字段，部分功能可能不可用。',
  config_write_failed: '设置保存失败，请检查磁盘空间或权限。',
  unknown_internal_error: '发生未知错误，请重试；如持续出现，请提交反馈。',
};

export function getUserMessageForError(error: AppError): string {
  return USER_MESSAGES[error.code] ?? error.message;
}
