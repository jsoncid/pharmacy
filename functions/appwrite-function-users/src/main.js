import { Client, Users, Query } from 'node-appwrite';

// This Appwrite function will be executed every time your function is triggered
export default async ({ req, res, log, error }) => {
  // You can use the Appwrite SDK to interact with other services
  // For this example, we're using the Users service
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] || process.env.APPWRITE_API_KEY);
  const users = new Users(client);

  const pathParts = req.path.split('/').filter(p => p);

  if (pathParts[0] === 'users') {
    const userId = pathParts[1];

    try {
      if (req.method === 'GET' && !userId) {
        const response = await users.list([Query.equal('status', true)]);
        log(`Total users: ${response.total}`);
        return res.json({ success: true, data: response.users, total: response.total });
      } else if (req.method === 'POST') {
        const { userId, email, password, name } = JSON.parse(req.body);
        const user = await users.create(userId, email, null, password, name);
        return res.json({ success: true, data: user });
      } else if (req.method === 'PUT' && userId) {
        const { name, email, password } = JSON.parse(req.body);
        const user = await users.get(userId);
        if (name && name !== user.name) await users.updateName(userId, name);
        if (email && email !== user.email) await users.updateEmail(userId, email);
        if (password) await users.updatePassword(userId, password);
        return res.json({ success: true, message: 'User updated' });
      } else if (req.method === 'DELETE' && userId) {
        await users.updateStatus(userId, false);
        return res.json({ success: true, message: 'User deleted' });
      } else {
        return res.json({ success: false, error: 'Method not allowed or invalid path' });
      }
    } catch (err) {
      error('Operation failed: ' + err.message);
      return res.json({ success: false, error: err.message });
    }
  }

  // The req object contains the request data
  if (req.path === '/ping') {
    // Use res object to respond with text(), json(), or binary()
    // Don't forget to return a response!
    return res.text('Pong');
  }

  // return res.json({
  //   motto: 'Build like a team of hundreds_',
  //   learn: 'https://appwrite.io/docs',
  //   connect: 'https://appwrite.io/discord',
  //   getInspired: 'https://builtwith.appwrite.io',
  // });
};
