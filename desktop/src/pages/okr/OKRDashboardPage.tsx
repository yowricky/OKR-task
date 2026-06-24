import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth';
import type { Objective, KeyResult, CreateObjectiveInput, CreateKeyResultInput } from '@app/shared';
import { Plus, Target, X, Edit3, Trash2, Check, Loader2 } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardObjective extends Objective {
  keyResults: KeyResult[];
}

interface ObjectiveForm {
  title: string;
  description: string;
  period: 'annual' | 'quarterly' | 'monthly';
  periodLabel: string;
  weight: number;
}

interface KRForm {
  title: string;
  targetValue: number;
  unit: string;
}

const defaultObjectiveForm: ObjectiveForm = {
  title: '',
  description: '',
  period: 'quarterly',
  periodLabel: '',
  weight: 1,
};

const defaultKRForm: KRForm = {
  title: '',
  targetValue: 100,
  unit: '%',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getProgressColor(p: number) {
  if (p >= 70) return 'bg-success';
  if (p >= 40) return 'bg-warning';
  return 'bg-danger';
}

function generatePeriodLabel(period: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const quarter = Math.ceil((now.getMonth() + 1) / 3);
  if (period === 'annual') return `${year}`;
  if (period === 'quarterly') return `${year} Q${quarter}`;
  if (period === 'monthly')
    return `${year}.${String(now.getMonth() + 1).padStart(2, '0')}`;
  return '';
}

// ---------------------------------------------------------------------------
// Confirm Dialog
// ---------------------------------------------------------------------------

function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  isPending,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10">
      <div className="bg-background rounded-xl shadow-lg border border-border w-full max-w-sm mx-4 p-6">
        <h3 className="text-base font-semibold">确认删除</h3>
        <p className="text-sm text-muted-foreground mt-2">{message}</p>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-danger text-danger-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            确认删除
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ObjectiveFormCard({
  onSubmit,
  onCancel,
  initial,
}: {
  onSubmit: (input: CreateObjectiveInput) => void;
  onCancel: () => void;
  initial?: ObjectiveForm;
}) {
  const user = useAuthStore((s) => s.user);
  const [form, setForm] = useState<ObjectiveForm>(initial || defaultObjectiveForm);

  const handlePeriodChange = (period: 'annual' | 'quarterly' | 'monthly') => {
    setForm((f) => ({ ...f, period, periodLabel: generatePeriodLabel(period) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !user) return;
    onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      orgId: user.orgId,
      period: form.period,
      periodLabel: form.periodLabel,
      weight: form.weight,
    });
  };

  const isEdit = !!initial;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-accent/30 rounded-xl p-5 border border-border space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Target size={16} />
          {isEdit ? '编辑目标' : '新建目标'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 rounded hover:bg-muted transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Title */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">目标标题 *</label>
        <input
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="例如：提升团队研发效能"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">描述</label>
        <textarea
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          rows={2}
          placeholder="目标描述（可选）"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
      </div>

      {/* Period + Weight row */}
      <div className="grid grid-cols-3 gap-3">
        {/* Period type */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">周期类型</label>
          <select
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={form.period}
            onChange={(e) => handlePeriodChange(e.target.value as 'annual' | 'quarterly' | 'monthly')}
          >
            <option value="annual">年度</option>
            <option value="quarterly">季度</option>
            <option value="monthly">月度</option>
          </select>
        </div>

        {/* Period label */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">周期标签</label>
          <input
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="如 2026 Q2"
            value={form.periodLabel}
            onChange={(e) => setForm((f) => ({ ...f, periodLabel: e.target.value }))}
            required
          />
        </div>

        {/* Weight */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">权重</label>
          <input
            type="number"
            min={0}
            step={0.1}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={form.weight}
            onChange={(e) => setForm((f) => ({ ...f, weight: Number(e.target.value) }))}
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          {isEdit ? '保存' : '创建目标'}
        </button>
      </div>
    </form>
  );
}

function KRFormCard({
  objectiveId,
  onSubmit,
  onCancel,
  initial,
}: {
  objectiveId: string;
  onSubmit: (input: CreateKeyResultInput) => void;
  onCancel: () => void;
  initial?: KRForm;
}) {
  const user = useAuthStore((s) => s.user);
  const [form, setForm] = useState<KRForm>(initial || defaultKRForm);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !user) return;
    onSubmit({
      title: form.title.trim(),
      objectiveId,
      targetValue: form.targetValue,
      unit: form.unit,
      ownerId: user.id,
    });
  };

  const isEdit = !!initial;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-accent/20 rounded-lg p-4 border border-border space-y-3 mt-3"
    >
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">{isEdit ? '编辑 KR' : '添加 KR'}</h4>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 rounded hover:bg-muted transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">KR 标题 *</label>
        <input
          className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="例如：将部署频率提升至每日"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">目标值</label>
          <input
            type="number"
            min={0}
            className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={form.targetValue}
            onChange={(e) => setForm((f) => ({ ...f, targetValue: Number(e.target.value) }))}
            required
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">单位</label>
          <input
            className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="如 %, 次, 个"
            value={form.unit}
            onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
        >
          {isEdit ? '保存' : '添加 KR'}
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function OKRDashboardPage() {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [addingKRs, setAddingKRs] = useState<Record<string, boolean>>({});
  const [editingObjectiveId, setEditingObjectiveId] = useState<string | null>(null);
  const [editingObjectiveForm, setEditingObjectiveForm] = useState<ObjectiveForm | null>(null);
  const [editingKRId, setEditingKRId] = useState<string | null>(null);
  const [editingKRForm, setEditingKRForm] = useState<KRForm | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'objective' | 'kr'; id: string; title: string; objectiveId?: string } | null>(null);

  // ---- Fetch dashboard ----
  const { data: objectives = [], isLoading } = useQuery<DashboardObjective[]>({
    queryKey: ['okr', 'dashboard'],
    queryFn: () => api.get<DashboardObjective[]>('/okr/dashboard'),
  });

  // ---- Create objective mutation ----
  const createObjectiveMutation = useMutation({
    mutationFn: (input: CreateObjectiveInput) => api.post<Objective>('/okr/objectives', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['okr', 'dashboard'] });
      setShowCreateForm(false);
    },
  });

  // ---- Update objective mutation ----
  const updateObjectiveMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateObjectiveInput> }) =>
      api.put<Objective>(`/okr/objectives/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['okr', 'dashboard'] });
      setEditingObjectiveId(null);
      setEditingObjectiveForm(null);
    },
  });

  // ---- Delete objective mutation ----
  const deleteObjectiveMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/okr/objectives/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['okr', 'dashboard'] });
      setDeleteConfirm(null);
    },
  });

  // ---- Create KR mutation ----
  const createKRMutation = useMutation({
    mutationFn: (input: CreateKeyResultInput) => api.post<KeyResult>('/okr/key-results', input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['okr', 'dashboard'] });
      setAddingKRs((prev) => ({ ...prev, [variables.objectiveId]: false }));
    },
  });

  // ---- Update KR mutation ----
  const updateKRMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title?: string; targetValue?: number; unit?: string } }) =>
      api.put<KeyResult>(`/okr/key-results/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['okr', 'dashboard'] });
      setEditingKRId(null);
      setEditingKRForm(null);
    },
  });

  // ---- Delete KR mutation ----
  const deleteKRMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/okr/key-results/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['okr', 'dashboard'] });
      setDeleteConfirm(null);
    },
  });

  function startEditObjective(obj: DashboardObjective) {
    setEditingObjectiveForm({
      title: obj.title,
      description: obj.description || '',
      period: obj.period,
      periodLabel: obj.periodLabel,
      weight: obj.weight,
    });
    setEditingObjectiveId(obj.id);
  }

  function handleUpdateObjective(input: CreateObjectiveInput) {
    if (!editingObjectiveId) return;
    updateObjectiveMutation.mutate({ id: editingObjectiveId, data: input });
  }

  function startEditKR(kr: KeyResult) {
    setEditingKRForm({
      title: kr.title,
      targetValue: kr.targetValue,
      unit: kr.unit,
    });
    setEditingKRId(kr.id);
  }

  function handleUpdateKR(input: CreateKeyResultInput) {
    if (!editingKRId) return;
    updateKRMutation.mutate({
      id: editingKRId,
      data: { title: input.title, targetValue: input.targetValue, unit: input.unit },
    });
  }

  const isPending =
    createObjectiveMutation.isPending ||
    updateObjectiveMutation.isPending ||
    deleteObjectiveMutation.isPending ||
    createKRMutation.isPending ||
    updateKRMutation.isPending ||
    deleteKRMutation.isPending;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <h1 className="text-lg font-semibold">OKR 看板</h1>
        <button
          onClick={() => setShowCreateForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          新建目标
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Inline create form */}
        {showCreateForm && (
          <ObjectiveFormCard
            onSubmit={(input) => createObjectiveMutation.mutate(input)}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        {/* Loading */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">加载中...</p>
        ) : /* Empty state */
        objectives.length === 0 && !showCreateForm ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">暂无 OKR 数据</p>
            <p className="text-sm">点击「新建目标」开始创建</p>
          </div>
        ) : (
          /* Objective cards */
          objectives.map((obj) => (
            <div key={obj.id} className="bg-accent/30 rounded-xl p-5 group/objective">
              {editingObjectiveId === obj.id && editingObjectiveForm ? (
                <ObjectiveFormCard
                  initial={editingObjectiveForm}
                  onSubmit={handleUpdateObjective}
                  onCancel={() => { setEditingObjectiveId(null); setEditingObjectiveForm(null); }}
                />
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                      {obj.periodLabel}
                    </span>
                    <h2 className="font-semibold">O: {obj.title}</h2>
                    {obj.weight > 0 && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        权重 {obj.weight}
                      </span>
                    )}
                    {/* Objective edit/delete buttons */}
                    <div className="flex items-center gap-1 opacity-0 group-hover/objective:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEditObjective(obj)}
                        className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-primary transition-colors"
                        title="编辑目标"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ type: 'objective', id: obj.id, title: obj.title })}
                        className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-danger transition-colors"
                        title="删除目标"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {obj.keyResults.map((kr) => (
                      <div key={kr.id} className="bg-background rounded-lg p-4 group/kr">
                        {editingKRId === kr.id && editingKRForm ? (
                          <KRFormCard
                            objectiveId={kr.objectiveId}
                            initial={editingKRForm}
                            onSubmit={handleUpdateKR}
                            onCancel={() => { setEditingKRId(null); setEditingKRForm(null); }}
                          />
                        ) : (
                          <>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">{kr.title}</span>
                              <span className="text-sm font-mono">{kr.progress}%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all',
                                  getProgressColor(kr.progress)
                                )}
                                style={{ width: `${kr.progress}%` }}
                              />
                            </div>
                            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                              <span>
                                {kr.currentValue} / {kr.targetValue} {kr.unit}
                              </span>
                              {/* KR edit/delete buttons */}
                              <div className="flex items-center gap-1 opacity-0 group-hover/kr:opacity-100 transition-opacity">
                                <button
                                  onClick={() => startEditKR(kr)}
                                  className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-primary transition-colors"
                                  title="编辑 KR"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm({ type: 'kr', id: kr.id, title: kr.title, objectiveId: kr.objectiveId })}
                                  className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-danger transition-colors"
                                  title="删除 KR"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add KR button / form */}
                  {!addingKRs[obj.id] ? (
                    <button
                      onClick={() =>
                        setAddingKRs((prev) => ({ ...prev, [obj.id]: true }))
                      }
                      className="mt-3 flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Plus size={14} />
                      添加 KR
                    </button>
                  ) : (
                    <KRFormCard
                      objectiveId={obj.id}
                      onSubmit={(input) => createKRMutation.mutate(input)}
                      onCancel={() =>
                        setAddingKRs((prev) => ({ ...prev, [obj.id]: false }))
                      }
                    />
                  )}
                </>
              )}
            </div>
          ))
        )}

        {/* Mutation loading indicator */}
        {isPending && (
          <div className="fixed bottom-6 right-6 px-4 py-2 bg-foreground text-background rounded-lg text-sm shadow-lg">
            保存中...
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <ConfirmDialog
          message={`确定要删除「${deleteConfirm.title}」吗？${deleteConfirm.type === 'objective' ? '此操作将同时删除其下所有 KR。' : ''}此操作不可撤销。`}
          onConfirm={() => {
            if (deleteConfirm.type === 'objective') {
              deleteObjectiveMutation.mutate(deleteConfirm.id);
            } else {
              deleteKRMutation.mutate(deleteConfirm.id);
            }
          }}
          onCancel={() => setDeleteConfirm(null)}
          isPending={deleteObjectiveMutation.isPending || deleteKRMutation.isPending}
        />
      )}
    </div>
  );
}
