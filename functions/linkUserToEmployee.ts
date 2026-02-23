import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { user_id, employee_id, client_id } = payload;

    if (!user_id && !employee_id && !client_id) {
      return Response.json({ error: 'Must provide user_id with either employee_id or client_id' }, { status: 400 });
    }

    // Handle Employee connection
    if (employee_id) {
      const employee = await base44.entities.Employee.filter({ id: employee_id }, '', 1);
      if (!employee || employee.length === 0) {
        return Response.json({ error: 'Employee not found' }, { status: 404 });
      }
      
      await base44.asServiceRole.entities.Employee.update(employee_id, {
        user_id: user_id
      });

      return Response.json({
        success: true,
        message: 'Employee linked to user successfully',
        employee_id: employee_id,
        user_id: user_id
      });
    }

    // Handle Client connection
    if (client_id) {
      const client = await base44.entities.Client.filter({ id: client_id }, '', 1);
      if (!client || client.length === 0) {
        return Response.json({ error: 'Client not found' }, { status: 404 });
      }
      
      // Update the User with the client reference
      await base44.asServiceRole.entities.User.update(user_id, {
        client_id: client_id,
        app_role: 'client'
      });

      return Response.json({
        success: true,
        message: 'Client linked to user successfully',
        client_id: client_id,
        user_id: user_id
      });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});