import { z } from 'zod';

export const loginSchema = z.object({
  account: z.string().min(1, '账号不能为空'),
  password: z.string().min(6, '密码至少6位'),
});

export const weworkCallbackSchema = z.object({
  code: z.string().min(1, 'code不能为空'),
  state: z.string().min(1, 'state不能为空'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type WeworkCallbackInput = z.infer<typeof weworkCallbackSchema>;
