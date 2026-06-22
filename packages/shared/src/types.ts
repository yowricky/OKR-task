// ========== 枚举 ==========
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'accepted';
export type Priority = 'high' | 'medium' | 'low';
export type UserRole = 'admin' | 'manager' | 'worker';
export type PeriodType = 'annual' | 'quarterly' | 'monthly';
export type EventType = 'event' | 'task';
export type RiskLevel = 'high' | 'medium' | 'low';
export type RiskStatus = 'open' | 'investigating' | 'resolved';

// ========== 用户 ==========
export interface User {
  id: string;
  account: string;
  name: string;
  email: string;
  orgId: string;
  role: UserRole;
  skillTags: string[];
  status: 'active' | 'disabled';
  createdAt: string;
  updatedAt: string;
}

// ========== 组织 ==========
export interface Organization {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
  status: 'active' | 'disabled';
}

// ========== 任务 ==========
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  planStartDate: string | null;
  dueDate: string | null;
  actualEndDate: string | null;
  ownerId: string;
  krId: string | null;
  parentId: string | null;
  projectId: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: Priority;
  planStartDate?: string;
  dueDate?: string;
  ownerId?: string;
  krId?: string;
  parentId?: string;
  projectId?: string;
  tags?: string[];
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  status?: TaskStatus;
}

// ========== 日历 ==========
export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  type: EventType;
  taskId: string | null;
  ownerId: string;
  isAllDay: boolean;
  recurrence: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  type?: EventType;
  taskId?: string;
  isAllDay?: boolean;
  recurrence?: string;
}

// ========== OKR ==========
export interface Objective {
  id: string;
  title: string;
  description: string;
  orgId: string;
  period: PeriodType;
  periodLabel: string;
  weight: number;
  status: 'active' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface KeyResult {
  id: string;
  title: string;
  description: string;
  objectiveId: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  ownerId: string;
  progress: number; // 服务端计算字段: Math.min(100, Math.round(currentValue / targetValue * 100))
  createdAt: string;
  updatedAt: string;
}

export interface CreateObjectiveInput {
  title: string;
  description?: string;
  orgId: string;
  period: PeriodType;
  periodLabel: string;
  weight?: number;
}

export interface CreateKeyResultInput {
  title: string;
  description?: string;
  objectiveId: string;
  targetValue: number;
  unit: string;
  ownerId: string;
}

// ========== 风险 ==========
export interface RiskItem {
  id: string;
  taskId: string;
  level: RiskLevel;
  description: string;
  rootCause: string | null;
  suggestedAction: string | null;
  status: RiskStatus;
  createdAt: string;
  updatedAt: string;
}

// ========== API 包装 ==========
export interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

export interface PaginatedResponse<T> extends ApiResponse<{
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages?: number;
}> {}

export interface LoginRequest {
  account: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
