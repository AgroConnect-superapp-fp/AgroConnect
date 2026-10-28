export interface ApiSuccessBody<T> {
  success: true;
  data: T;
  message: string;
}

export function success<T>(data: T, message: string): ApiSuccessBody<T> {
  return { success: true, data, message };
}
