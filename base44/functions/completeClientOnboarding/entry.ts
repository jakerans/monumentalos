import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Step 1: Auth check
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.app_role !== 'client' && user.app_role !== 'admin') {
      return Response.json({ error: 'Forbidden: Only client users can complete onboarding' }, { status: 403 });
    }

    // Step 2: Receive confirmed data from request body
    const body = await req.json();
    const confirmed_name = body.confirmed_name || '';
    const confirmed_email = body.confirmed_email || '';
    const confirmed_phone = body.confirmed_phone || '';
    const confirmed_company = body.confirmed_company || '';

    // Step 3: Check if user already has a client_id
    if (user.client_id) {
      return Response.json({ success: true, already_linked: true, client_id: user.client_id }, { status: 200 });
    }

    // Step 4: Find the matching Client record
    const allClients = await base44.asServiceRole.entities.Client.filter({ status: 'active' });
    
    let matchingClient = null;
    
    // Search by user.email first
    for (const client of allClients) {
      if (!client.contacts || !Array.isArray(client.contacts)) continue;
      const found = client.contacts.find(contact => 
        contact.email && contact.email.toLowerCase() === (user.email || '').toLowerCase()
      );
      if (found) {
        matchingClient = client;
        break;
      }
    }

    // If no match by user.email, try confirmed_email
    if (!matchingClient && confirmed_email) {
      for (const client of allClients) {
        if (!client.contacts || !Array.isArray(client.contacts)) continue;
        const found = client.contacts.find(contact => 
          contact.email && contact.email.toLowerCase() === confirmed_email.toLowerCase()
        );
        if (found) {
          matchingClient = client;
          break;
        }
      }
    }

    if (!matchingClient) {
      return Response.json(
        { error: 'No matching client account found. Contact your account manager.', no_match: true },
        { status: 404 }
      );
    }

    // Step 5: Link the User to the Client
    await base44.asServiceRole.entities.User.update(user.id, { client_id: matchingClient.id });

    // Step 6: Update the contact's name in the Client's contacts array
    if (confirmed_name && matchingClient.contacts && Array.isArray(matchingClient.contacts)) {
      const contactEmail = user.email || confirmed_email;
      const matchingContact = matchingClient.contacts.find(contact =>
        contact.email && contact.email.toLowerCase() === contactEmail.toLowerCase()
      );
      if (matchingContact && (!matchingContact.name || matchingContact.name !== confirmed_name)) {
        matchingContact.name = confirmed_name;
        await base44.asServiceRole.entities.Client.update(matchingClient.id, {
          contacts: matchingClient.contacts
        });
      }
    }

    // Step 7: Create the ClientOnboarding audit record
    await base44.asServiceRole.entities.ClientOnboarding.create({
      user_id: user.id,
      confirmed_name,
      confirmed_email,
      confirmed_phone,
      confirmed_company,
      client_id: matchingClient.id,
      status: 'completed'
    });

    // Step 8: Return success
    return Response.json(
      { success: true, client_id: matchingClient.id, client_name: matchingClient.name },
      { status: 200 }
    );
  } catch (error) {
    console.error('completeClientOnboarding error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});