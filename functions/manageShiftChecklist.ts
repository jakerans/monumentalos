import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    if (action === 'get_active') {
      try {
        const allChecklists = await base44.asServiceRole.entities.ShiftChecklist.list('-updated_at', 100);
        console.log('GET_ACTIVE: total checklists found:', allChecklists.length);
        console.log('GET_ACTIVE: checklists:', JSON.stringify(allChecklists.map(c => ({ id: c.id, name: c.name, is_active: c.is_active, type_of_active: typeof c.is_active }))));
        const active = allChecklists.find(c => c.is_active === true || c.is_active === 'true');
        console.log('GET_ACTIVE: active match:', active ? active.id : 'NONE');
        return Response.json({ checklist: active || null });
      } catch (err) {
        console.log('GET_ACTIVE ERROR:', err.message);
        return Response.json({ checklist: null, debug_error: err.message });
      }
    }

    if (action === 'save_template') {
      const role = user.app_role || user.role;
      if (role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
      const { checklist_id, name, header_note, tasks, is_active } = body;
      const tasksStr = typeof tasks === 'string' ? tasks : JSON.stringify(tasks);
      const payload = {
        name,
        header_note: header_note || '',
        tasks: tasksStr,
        is_active: is_active !== undefined ? is_active : true,
        updated_at: new Date().toISOString(),
      };
      let checklist;
      if (checklist_id) {
        checklist = await base44.asServiceRole.entities.ShiftChecklist.update(checklist_id, payload);
      } else {
        checklist = await base44.asServiceRole.entities.ShiftChecklist.create(payload);
      }
      return Response.json({ checklist });
    }

    if (action === 'get_today_log') {
      const { setter_id } = body;
      const today = new Date().toISOString().slice(0, 10);
      const logs = await base44.asServiceRole.entities.SetterDailyChecklistLog.filter({ setter_id, date: today }, '-created_date', 1);
      return Response.json({ log: logs[0] || null });
    }

    if (action === 'complete_task') {
      const { setter_id, checklist_id, task_id } = body;
      const today = new Date().toISOString().slice(0, 10);

      // Find or create today's log
      const logs = await base44.asServiceRole.entities.SetterDailyChecklistLog.filter({ setter_id, checklist_id, date: today }, '-created_date', 1);
      let log = logs[0] || null;
      const now = new Date().toISOString();

      let completedTasks = [];
      if (log) {
        completedTasks = JSON.parse(log.completed_tasks || '[]');
      }

      if (!completedTasks.includes(task_id)) {
        completedTasks.push(task_id);
      }

      // Check if all tasks are complete
      const checklist = await base44.asServiceRole.entities.ShiftChecklist.get(checklist_id);
      const allTasks = JSON.parse(checklist?.tasks || '[]');
      const allComplete = allTasks.length > 0 && allTasks.every(t => completedTasks.includes(t.id));

      const logPayload = {
        setter_id,
        checklist_id,
        date: today,
        completed_tasks: JSON.stringify(completedTasks),
        all_complete: allComplete,
        started_at: log?.started_at || now,
        ...(allComplete && !log?.completed_at ? { completed_at: now } : {}),
      };

      if (log) {
        log = await base44.asServiceRole.entities.SetterDailyChecklistLog.update(log.id, logPayload);
      } else {
        log = await base44.asServiceRole.entities.SetterDailyChecklistLog.create(logPayload);
      }

      return Response.json({ log });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});