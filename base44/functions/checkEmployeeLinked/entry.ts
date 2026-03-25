import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ linked: false }, { status: 200 });
    }

    const employees = await base44.asServiceRole.entities.Employee.filter(
      { user_id: user.id, status: 'active' },
      null,
      1
    );

    if (employees && employees.length > 0) {
      return Response.json({ linked: true, employee_id: employees[0].id }, { status: 200 });
    }

    return Response.json({ linked: false }, { status: 200 });
  } catch (error) {
    return Response.json({ linked: false }, { status: 200 });
  }
});