import { Client, Teams, Users } from 'node-appwrite';

// This Appwrite function will be executed every time your function is triggered
export default async ({ req, res, log, error }) => {
  // You can use the Appwrite SDK to interact with other services
  // For this example, we're using the Teams service
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] ?? '');
  const teams = new Teams(client);
  const users = new Users(client);

  try {
    log('Type of req.body:', typeof req.body);
    log('Raw body:', req.body);
    let body;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch (e) {
      return res.json({ error: 'Invalid JSON body' }, 400);
    }

    const { teamId, roles, email, userId, phone, url, allTeams } = body;

    log('Parsed body:', { teamId, roles, email, userId, phone, url, allTeams });

    // Ensure roles is an array
    const rolesArray = Array.isArray(roles) ? roles : [roles];

    if (!teamId || !email || !rolesArray.length) {
      return res.json({ error: 'Missing required parameters: teamId, email, roles' }, 400);
    }

    log('Email value:', email);

    // Check if team exists
    try {
      const team = await teams.get(teamId);
      log('Team exists:', team.$id);
    } catch (teamError) {
      log('Team does not exist:', teamError.message);
      return res.json({ error: 'Team does not exist' }, 404);
    }

    // Check if user is already a member
    const memberships = await teams.listMemberships(teamId);
    const existingMembership = memberships.memberships.find(m => 
      m.userId === userId || (email && m.userEmail === email)
    );

    let result;
    if (existingMembership) {
      // Update existing membership roles
      log('User is already a member, updating roles');
      const updateResult = await teams.updateMembership(teamId, existingMembership.$id, rolesArray);
      log(`Updated membership roles for user in team ${teamId}`);
      result = { membership: updateResult, action: 'updated' };
    } else {
      // Create new membership
      const membership = await teams.createMembership(teamId, rolesArray, email, userId, phone, url);
      log(`Created membership for email ${email} in team ${teamId}`);
      result = { membership, action: 'created' };
    }

    // Cleanup: delete memberships for teams not in allTeams (do this only once per user session)
    if (allTeams && allTeams.length > 0 && teamId === allTeams[0]) {
      log('Performing membership cleanup for user');
      const userMemberships = await users.listMemberships(userId);
      for (const membership of userMemberships.memberships) {
        if (!allTeams.includes(membership.teamId)) {
          await teams.deleteMembership(membership.teamId, membership.$id);
          log(`Deleted membership for team ${membership.teamId}`);
        }
      }
    }

    return res.json(result);
  } catch(err) {
    error("Could not create team membership: " + err.message);
    return res.json({ error: err.message }, 500);
  }

  // The req object contains the request data
  if (req.path === "/ping") {
    // Use res object to respond with text(), json(), or binary()
    // Don't forget to return a response!
    return res.text("Pong");
  }

  return res.json({
    motto: "Build like a team of hundreds_",
    learn: "https://appwrite.io/docs",
    connect: "https://appwrite.io/discord",
    getInspired: "https://builtwith.appwrite.io",
  });
};
