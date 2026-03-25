import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Step 1: Auth check
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowedRoles = ['setter', 'marketing_manager', 'admin', 'finance_admin', 'onboard_admin'];
    if (!allowedRoles.includes(user.app_role)) {
      return Response.json({ error: 'Forbidden: Only internal employees can complete onboarding' }, { status: 403 });
    }

    // Step 2: Receive confirmed data from request body
    const payload = await req.json();
    const { confirmed_name, confirmed_email, confirmed_phone } = payload;

    if (!confirmed_email) {
      return Response.json({ error: 'confirmed_email is required' }, { status: 400 });
    }

    // Step 3: Find matching Employee record
    const userEmailLower = user.email.toLowerCase();
    const confirmedEmailLower = confirmed_email.toLowerCase();

    // First try: match by user's email
    let matchedEmployees = await base44.asServiceRole.entities.Employee.filter(
      { email: user.email },
      '',
      100
    );

    let employee = matchedEmployees?.find(e => !e.user_id);

    // If no match by user email, try confirmed_email
    if (!employee) {
      matchedEmployees = await base44.asServiceRole.entities.Employee.filter(
        { email: confirmed_email },
        '',
        100
      );
      employee = matchedEmployees?.find(e => !e.user_id);
    }

    // If still no match, return error
    if (!employee) {
      return Response.json(
        { error: 'No matching employee record found. Contact your manager.', no_match: true },
        { status: 404 }
      );
    }

    // Step 4: Link the Employee to the User
    const updateData = { user_id: user.id };
    
    if (confirmed_name && confirmed_name !== employee.full_name) {
      updateData.full_name = confirmed_name;
    }
    
    if (confirmed_phone) {
      updateData.phone = confirmed_phone;
    }

    await base44.asServiceRole.entities.Employee.update(employee.id, updateData);

    // Step 5: Create PaidDayOffBank if none exists
    const existingPTO = await base44.asServiceRole.entities.PaidDayOffBank.filter(
      { setter_id: user.id },
      '',
      1
    );

    let ptoCreated = false;
    if (!existingPTO || existingPTO.length === 0) {
      await base44.asServiceRole.entities.PaidDayOffBank.create({
        setter_id: user.id,
        days_earned: 0,
        days_used: 0,
        last_updated: new Date().toISOString()
      });
      ptoCreated = true;
    }

    // Step 6: Create the EmployeeOnboarding audit record
    await base44.asServiceRole.entities.EmployeeOnboarding.create({
      user_id: user.id,
      confirmed_name: confirmed_name || '',
      confirmed_email: confirmed_email,
      confirmed_phone: confirmed_phone || '',
      employee_id: employee.id,
      status: 'completed'
    });

    // Step 7: Return success
    return Response.json({
      success: true,
      employee_id: employee.id,
      employee_name: employee.full_name,
      pto_created: ptoCreated
    });
  } catch (error) {
    console.error('Error in completeEmployeeOnboarding:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});