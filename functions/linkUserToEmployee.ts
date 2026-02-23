import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { user_id, employee_id } = payload;

    if (!user_id && !employee_id) {
      return Response.json({ error: 'Must provide user_id or employee_id' }, { status: 400 });
    }

    let targetUserId = user_id;
    let targetEmployeeId = employee_id;

    // If only employee_id provided, find user by matching the employee's email
    if (employee_id && !user_id) {
      const employee = await base44.entities.Employee.filter({ id: employee_id }, '', 1);
      if (!employee || employee.length === 0) {
        return Response.json({ error: 'Employee not found' }, { status: 404 });
      }
      
      const employeeEmail = employee[0].email;
      const users = await base44.asServiceRole.entities.User.filter({ email: employeeEmail }, '', 1);
      if (!users || users.length === 0) {
        return Response.json({ error: 'No user found with that email' }, { status: 404 });
      }
      targetUserId = users[0].id;
      targetEmployeeId = employee_id;
    }

    // If only user_id provided, find employee by matching user's email
    if (user_id && !employee_id) {
      const userRecord = await base44.asServiceRole.entities.User.filter({ id: user_id }, '', 1);
      if (!userRecord || userRecord.length === 0) {
        return Response.json({ error: 'User not found' }, { status: 404 });
      }
      
      const userEmail = userRecord[0].email;
      const employees = await base44.asServiceRole.entities.Employee.filter({ email: userEmail }, '', 1);
      if (!employees || employees.length === 0) {
        return Response.json({ error: 'No employee found with that email' }, { status: 404 });
      }
      targetUserId = user_id;
      targetEmployeeId = employees[0].id;
    }

    // Update the employee with the user_id
    await base44.asServiceRole.entities.Employee.update(targetEmployeeId, {
      user_id: targetUserId
    });

    return Response.json({
      success: true,
      message: 'Employee linked to user successfully',
      employee_id: targetEmployeeId,
      user_id: targetUserId
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});