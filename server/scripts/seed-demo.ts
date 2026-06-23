// seed-demo.ts — 插入演示 OKR 和任务数据
import 'dotenv/config';
import { db } from '../src/db/index';
import { objectives, keyResults, tasks } from '../src/db/schema';

async function main() {
  console.log('Seeding demo data...');

  // 创建 OKR 目标
  const [o1] = await db.insert(objectives).values({
    title: '提升产品交付质量',
    description: '确保Q2产品迭代零重大缺陷',
    orgId: '3833d6f8-196d-4fc7-8d13-3ca6110015e7',
    period: 'quarterly',
    periodLabel: '2026 Q2',
    weight: 1,
  }).returning();
  console.log('O1:', o1.title);

  const [o2] = await db.insert(objectives).values({
    title: '提升团队研发效能',
    description: '缩短需求交付周期，提升自动化程度',
    orgId: '3833d6f8-196d-4fc7-8d13-3ca6110015e7',
    period: 'quarterly',
    periodLabel: '2026 Q2',
    weight: 1,
  }).returning();
  console.log('O2:', o2.title);

  const [o3] = await db.insert(objectives).values({
    title: '构建AI驱动的质量管理体系',
    description: '引入AI辅助代码审查和自动化测试',
    orgId: '3833d6f8-196d-4fc7-8d13-3ca6110015e7',
    period: 'quarterly',
    periodLabel: '2026 Q2',
    weight: 0.8,
  }).returning();
  console.log('O3:', o3.title);

  // 创建 KRs
  const userId = '1ed0f5c4-5df0-4a70-b440-9d2cc68eb222'; // admin user

  const krs = [
    { objectiveId: o1.id, title: '线上Bug率降至0.3%以下', targetValue: 0.3, unit: '%', currentValue: 0.15, ownerId: userId },
    { objectiveId: o1.id, title: '自动化测试覆盖率达到80%', targetValue: 80, unit: '%', currentValue: 45, ownerId: userId },
    { objectiveId: o1.id, title: '代码审查覆盖率100%', targetValue: 100, unit: '%', currentValue: 72, ownerId: userId },

    { objectiveId: o2.id, title: '需求交付周期缩短30%', targetValue: 30, unit: '%', currentValue: 8, ownerId: userId },
    { objectiveId: o2.id, title: 'CI/CD流水线构建时间<10分钟', targetValue: 10, unit: 'min', currentValue: 18, ownerId: userId },
    { objectiveId: o2.id, title: '每月发布频次提升到4次', targetValue: 4, unit: '次', currentValue: 2, ownerId: userId },

    { objectiveId: o3.id, title: 'AI代码审查覆盖率≥60%', targetValue: 60, unit: '%', currentValue: 15, ownerId: userId },
    { objectiveId: o3.id, title: 'AI测试用例自动生成率≥40%', targetValue: 40, unit: '%', currentValue: 22, ownerId: userId },
  ];

  for (const kr of krs) {
    const progress = Math.round((kr.currentValue / kr.targetValue) * 100);
    const [row] = await db.insert(keyResults).values({ ...kr, progress }).returning();
    console.log('KR:', row.title, `(${progress}%)`);
  }

  // 创建示例任务
  const sampleTasks = [
    { title: '完成单元测试补充——用户模块', dueDate: new Date(), priority: 'high' as const },
    { title: '修复登录页面样式兼容问题', dueDate: new Date(), priority: 'high' as const },
    { title: '编写API接口文档', dueDate: new Date(Date.now() + 86400000), priority: 'medium' as const },
    { title: '评审OKR模块技术方案', dueDate: new Date(Date.now() + 86400000 * 2), priority: 'medium' as const },
    { title: '搭建自动化测试框架', dueDate: new Date(Date.now() + 86400000 * 3), priority: 'high' as const },
    { title: '优化数据库查询性能', dueDate: new Date(Date.now() - 86400000), priority: 'low' as const },
    { title: '编写部署文档', dueDate: new Date(Date.now() + 86400000), priority: 'low' as const },
  ];

  for (const t of sampleTasks) {
    const status = t.dueDate < new Date() ? 'in_progress' : 'pending';
    const [row] = await db.insert(tasks).values({
      title: t.title,
      description: '',
      priority: t.priority,
      dueDate: t.dueDate.toISOString(),
      status,
      ownerId: userId,
      tags: ['demo'],
    } as any).returning();
    console.log('Task:', row.title, `(${row.status}, ${row.priority})`);
  }

  console.log('\n✅ Demo data seeded!');
  console.log('   OKR: 3 objectives, 8 key results');
  console.log('   Tasks: 7 sample tasks');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
