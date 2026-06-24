import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { ChevronRight, ChevronDown, Plus, Building2, Users, Shield, Edit2, Check, X, UserPlus, Trash2, Loader2 } from 'lucide-react';
import type { Organization, User, UserRole } from '@app/shared';

// ========== types ==========
interface OrgNode extends Organization {
  children: OrgNode[];
}

interface CreateOrgInput {
  name: string;
  code: string;
  parentId?: string;
}

interface CreateUserInput {
  account: string;
  name: string;
  email: string;
  password: string;
  orgId: string;
  role: UserRole;
}

// ========== Inline Text Edit ==========
function InlineTextEdit({
  value,
  onSave,
  onCancel,
  placeholder,
  inputType,
}: {
  value: string;
  onSave: (val: string) => void;
  onCancel: () => void;
  placeholder?: string;
  inputType?: string;
}) {
  const [val, setVal] = useState(value);
  return (
    <div className="flex items-center gap-1">
      <input
        type={inputType || 'text'}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="text-sm px-1.5 py-0.5 bg-background border border-border rounded outline-none focus:border-primary w-32"
        placeholder={placeholder}
        autoFocus
        onKeyDown={(e) => { if (e.key === 'Enter') onSave(val); if (e.key === 'Escape') onCancel(); }}
      />
      <button onClick={() => onSave(val)} className="p-0.5 hover:text-success"><Check className="w-3.5 h-3.5" /></button>
      <button onClick={onCancel} className="p-0.5 hover:text-danger"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
}

// ========== Confirm Dialog ==========
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
        <h3 className="text-base font-semibold">确认操作</h3>
        <p className="text-sm text-muted-foreground mt-2">{message}</p>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onCancel} className="px-4 py-2 text-xs font-medium rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity">取消</button>
          <button onClick={onConfirm} disabled={isPending} className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-danger text-danger-foreground hover:opacity-90 transition-opacity disabled:opacity-50">
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            确认
          </button>
        </div>
      </div>
    </div>
  );
}

// ========== Org Tree Node ==========
function OrgTreeNode({ node, depth, onCodeEdit, onNameEdit, onEdit }: { node: OrgNode; depth: number; onCodeEdit: (id: string) => void; onNameEdit: (id: string) => void; onEdit: (id: string) => void }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-accent cursor-pointer text-sm group"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren ? (
          expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <div className="w-4 shrink-0" />
        )}
        <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="font-medium">{node.name}</span>
        <span className="text-xs text-muted-foreground">({node.code})</span>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(node.id); }}
          className="ml-1 p-0.5 opacity-0 group-hover:opacity-100 hover:text-primary transition-opacity"
          title="编辑部门"
        >
          <Edit2 className="w-3 h-3" />
        </button>
      </div>
      {expanded && hasChildren && (
        <div>
          {node.children
            .sort((a, b) => (parseInt(a.code, 10) || 0) - (parseInt(b.code, 10) || 0))
            .map((child) => (
              <OrgTreeNode key={child.id} node={child} depth={depth + 1} onCodeEdit={onCodeEdit} onNameEdit={onNameEdit} onEdit={onEdit} />
            ))}
        </div>
      )}
    </div>
  );
}

// ========== Edit Org Dialog ==========
function EditOrgDialog({ org, onClose }: { org: OrgNode; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(org.name);
  const [code, setCode] = useState(org.code);

  const updateMutation = useMutation({
    mutationFn: (payload: { name: string; code: string }) => api.put(`/org/structure/${org.id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-structure'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    updateMutation.mutate({ name: name.trim(), code: code.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-xl border border-border p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">编辑部门</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">部门名称</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="如：研发部" className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">部门编码</label>
            <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="数字编码如 10" className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:border-primary" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent">取消</button>
            <button type="submit" disabled={updateMutation.isPending || !name.trim() || !code.trim()} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {updateMutation.isPending ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ========== Create Org Dialog ==========
function CreateOrgDialog({ orgs, onClose }: { orgs: OrgNode[]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [code, setCode] = useState('10');
  const [parentId, setParentId] = useState<string>('');

  const flatOrgs: { id: string; name: string; depth: number }[] = [];
  function flatten(list: OrgNode[], d: number) {
    for (const n of list) {
      flatOrgs.push({ id: n.id, name: n.name, depth: d });
      flatten(n.children, d + 1);
    }
  }
  flatten(orgs, 0);

  // 自动生成数字编码：找到同级最大数字+10
  const autoGenerateCode = () => {
    const siblings = parentId
      ? orgs.flatMap((n) => flattenSiblings(n, parentId))
      : orgs;
    // 简化：所有已有code中找最大数字
    const allCodes = flatOrgs.map((o) => orgs.find((n) => n.id === o.id)?.code || '0');
    const existingOrgs = orgs.reduce<OrgNode[]>((acc, n) => acc.concat(n).concat(n.children), [] as any);
    const maxNum = Math.max(0, ...flatOrgs.map((o) => {
      const org = findOrgById(orgs, o.id);
      const num = parseInt(org?.code || '0', 10);
      return isNaN(num) ? 0 : num;
    }));
    setCode(String(maxNum + 10));
  };

  function findOrgById(list: OrgNode[], id: string): OrgNode | null {
    for (const n of list) {
      if (n.id === id) return n;
      const found = findOrgById(n.children, id);
      if (found) return found;
    }
    return null;
  }

  const createMutation = useMutation({
    mutationFn: (payload: CreateOrgInput) => api.post<Organization>('/org/structure', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-structure'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    createMutation.mutate({
      name: name.trim(),
      code: code.trim(),
      parentId: parentId || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-xl border border-border p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">新建部门</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">部门名称</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="如：研发部" className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              部门编码
              <button type="button" onClick={autoGenerateCode} className="ml-2 text-xs text-primary hover:underline">自动生成</button>
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="数字编码如 10"
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">上级部门（可选）</label>
            <select value={parentId} onChange={(e) => setParentId(e.target.value)} className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:border-primary">
              <option value="">无（顶级部门）</option>
              {flatOrgs.map((o) => (
                <option key={o.id} value={o.id}>{'  '.repeat(o.depth)}{o.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent">取消</button>
            <button type="submit" disabled={createMutation.isPending || !name.trim() || !code.trim()} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {createMutation.isPending ? '创建中...' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ========== Create User Dialog ==========
function CreateUserDialog({ orgs, onClose }: { orgs: OrgNode[]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [account, setAccount] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgId, setOrgId] = useState('');
  const [role, setRole] = useState<UserRole>('worker');

  const flatOrgs: { id: string; name: string }[] = [];
  function flatten(list: OrgNode[]) {
    for (const n of list) {
      flatOrgs.push({ id: n.id, name: n.name });
      flatten(n.children);
    }
  }
  flatten(orgs);

  const createMutation = useMutation({
    mutationFn: (payload: CreateUserInput) => api.post<User>('/org/users', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-users'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!account.trim() || !name.trim() || !email.trim() || !password || !orgId) return;
    createMutation.mutate({ account: account.trim(), name: name.trim(), email: email.trim(), password, orgId, role });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-xl border border-border p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">新建用户</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">登录账号</label>
            <input value={account} onChange={(e) => setAccount(e.target.value)} placeholder="账号" className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">姓名</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="姓名" className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">邮箱</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">密码</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="至少6位" className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">所属部门</label>
            <select value={orgId} onChange={(e) => setOrgId(e.target.value)} className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:border-primary">
              <option value="">选择部门</option>
              {flatOrgs.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">角色</label>
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:border-primary">
              <option value="admin">管理员</option>
              <option value="manager">经理</option>
              <option value="worker">成员</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent">取消</button>
            <button type="submit" disabled={createMutation.isPending || !account.trim() || !name.trim() || !email.trim() || !password || !orgId} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {createMutation.isPending ? '创建中...' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ========== Role Badge ==========
const roleLabels: Record<UserRole, string> = { admin: '管理员', manager: '经理', worker: '成员' };
const roleColors: Record<UserRole, string> = { admin: 'bg-danger/10 text-danger', manager: 'bg-primary/10 text-primary', worker: 'bg-accent text-muted-foreground' };

function RoleBadge({ role }: { role: UserRole }) {
  return <span className={`text-xs px-2 py-0.5 rounded-full ${roleColors[role]}`}>{roleLabels[role]}</span>;
}

// ========== Status Badge ==========
function StatusBadge({ status }: { status: string }) {
  const active = status === 'active';
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
      {active ? '启用' : '禁用'}
    </span>
  );
}

// ========== Inline Edit Role ==========
function InlineRoleSelect({ userId, currentRole, onSave, onCancel }: { userId: string; currentRole: UserRole; onSave: (role: UserRole) => void; onCancel: () => void }) {
  const [value, setValue] = useState<UserRole>(currentRole);
  return (
    <div className="flex items-center gap-1">
      <select value={value} onChange={(e) => setValue(e.target.value as UserRole)} className="text-xs px-1 py-0.5 bg-background border border-border rounded outline-none" autoFocus>
        <option value="admin">管理员</option>
        <option value="manager">经理</option>
        <option value="worker">成员</option>
      </select>
      <button onClick={() => onSave(value)} className="p-0.5 hover:text-success"><Check className="w-3.5 h-3.5" /></button>
      <button onClick={onCancel} className="p-0.5 hover:text-danger"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
}

// ========== Inline Edit Status ==========
function InlineStatusSelect({ userId, currentStatus, onSave, onCancel }: { userId: string; currentStatus: string; onSave: (status: string) => void; onCancel: () => void }) {
  const [value, setValue] = useState(currentStatus);
  return (
    <div className="flex items-center gap-1">
      <select value={value} onChange={(e) => setValue(e.target.value)} className="text-xs px-1 py-0.5 bg-background border border-border rounded outline-none" autoFocus>
        <option value="active">启用</option>
        <option value="disabled">禁用</option>
      </select>
      <button onClick={() => onSave(value)} className="p-0.5 hover:text-success"><Check className="w-3.5 h-3.5" /></button>
      <button onClick={onCancel} className="p-0.5 hover:text-danger"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
}

// ========== Main Page ==========
export function OrgPage() {
  const [tab, setTab] = useState<'org' | 'users'>('org');
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [editOrgDialog, setEditOrgDialog] = useState<OrgNode | null>(null);
  const [editingUserField, setEditingUserField] = useState<{ id: string; field: string } | null>(null);
  const queryClient = useQueryClient();

  // Fetch org tree
  const { data: orgTree = [], isLoading: orgLoading } = useQuery<OrgNode[]>({
    queryKey: ['org-structure'],
    queryFn: () => api.get<OrgNode[]>('/org/structure'),
  });

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['org-users'],
    queryFn: () => api.get<User[]>('/org/users'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.put(`/org/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-users'] });
    },
  });

  const handleSaveRole = (userId: string, role: UserRole) => {
    updateMutation.mutate({ id: userId, data: { role } });
    setEditingRole(null);
  };

  const handleSaveStatus = (userId: string, status: string) => {
    updateMutation.mutate({ id: userId, data: { status } });
    setEditingStatus(null);
  };

  const handleSaveUserField = (userId: string, field: string, value: string) => {
    if (!value.trim()) { setEditingUserField(null); return; }
    updateMutation.mutate({ id: userId, data: { [field]: value.trim() } });
    setEditingUserField(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">系统设置</h1>
          <p className="text-sm text-muted-foreground mt-1">组织架构与用户管理</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border px-6">
        <button
          onClick={() => setTab('org')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === 'org' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Building2 className="w-4 h-4" />
          组织架构
        </button>
        <button
          onClick={() => setTab('users')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === 'users' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="w-4 h-4" />
          用户管理
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {tab === 'org' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">部门列表</h2>
              <button
                onClick={() => setShowCreateOrg(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90"
              >
                <Plus className="w-4 h-4" />
                新建部门
              </button>
            </div>
            {orgLoading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">加载中...</p>
            ) : orgTree.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">暂无部门</p>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl p-2">
                {orgTree.map((node) => (
                  <OrgTreeNode key={node.id} node={node} depth={0} onCodeEdit={(id) => {}} onNameEdit={(id) => {}} onEdit={(id) => {
                    const org = findOrg(orgTree, id);
                    if (org) setEditOrgDialog(org);
                  }} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'users' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">用户列表</h2>
              <button
                onClick={() => setShowCreateUser(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90"
              >
                <UserPlus className="w-4 h-4" />
                新建用户
              </button>
            </div>
            {usersLoading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">加载中...</p>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">暂无用户</p>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">账号</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">姓名</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">邮箱</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">角色</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-border last:border-0 hover:bg-accent/30">
                        <td className="px-4 py-3">
                          {editingUserField?.id === user.id && editingUserField?.field === 'account' ? (
                            <InlineTextEdit
                              value={user.account}
                              onSave={(val) => handleSaveUserField(user.id, 'account', val)}
                              onCancel={() => setEditingUserField(null)}
                            />
                          ) : (
                            <button
                              onClick={() => setEditingUserField({ id: user.id, field: 'account' })}
                              className="group flex items-center gap-1"
                            >
                              {user.account}
                              <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {editingUserField?.id === user.id && editingUserField?.field === 'name' ? (
                            <InlineTextEdit
                              value={user.name}
                              onSave={(val) => handleSaveUserField(user.id, 'name', val)}
                              onCancel={() => setEditingUserField(null)}
                            />
                          ) : (
                            <button
                              onClick={() => setEditingUserField({ id: user.id, field: 'name' })}
                              className="group flex items-center gap-1"
                            >
                              {user.name}
                              <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {editingUserField?.id === user.id && editingUserField?.field === 'email' ? (
                            <InlineTextEdit
                              value={user.email}
                              onSave={(val) => handleSaveUserField(user.id, 'email', val)}
                              onCancel={() => setEditingUserField(null)}
                            />
                          ) : (
                            <button
                              onClick={() => setEditingUserField({ id: user.id, field: 'email' })}
                              className="group flex items-center gap-1"
                            >
                              {user.email}
                              <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingRole === user.id ? (
                            <InlineRoleSelect userId={user.id} currentRole={user.role} onSave={(r) => handleSaveRole(user.id, r)} onCancel={() => setEditingRole(null)} />
                          ) : (
                            <button onClick={() => setEditingRole(user.id)} className="flex items-center gap-1 group">
                              <RoleBadge role={user.role} />
                              <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingStatus === user.id ? (
                            <InlineStatusSelect userId={user.id} currentStatus={user.status} onSave={(s) => handleSaveStatus(user.id, s)} onCancel={() => setEditingStatus(null)} />
                          ) : (
                            <button onClick={() => setEditingStatus(user.id)} className="flex items-center gap-1 group">
                              <StatusBadge status={user.status} />
                              <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      {showCreateOrg && <CreateOrgDialog orgs={orgTree} onClose={() => setShowCreateOrg(false)} />}
      {showCreateUser && <CreateUserDialog orgs={orgTree} onClose={() => setShowCreateUser(false)} />}
      {editOrgDialog && <EditOrgDialog org={editOrgDialog} onClose={() => setEditOrgDialog(null)} />}
    </div>
  );
}

// ========== Helpers ==========
function findOrg(list: OrgNode[], id: string): OrgNode | null {
  for (const n of list) {
    if (n.id === id) return n;
    const found = findOrg(n.children, id);
    if (found) return found;
  }
  return null;
}
