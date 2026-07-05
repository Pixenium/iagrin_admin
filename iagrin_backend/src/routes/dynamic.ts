import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import { ObjectId } from 'mongodb';

export default function (io: Server) {
  const router = Router();

  // Helper to get collection name and socket event from path
  function parseRoute(path: string) {
    if (path.includes('/admin/users') || path.includes('/admin/user')) return { col: 'users', event: 'users:changed' };
    if (path.includes('/farms')) return { col: 'farms', event: 'farms:changed' };
    if (path.includes('/alerts')) return { col: 'alerts', event: 'soil:changed' }; // assuming soil alerts
    if (path.includes('/crop-doctor/admin/diagnoses')) return { col: 'diagnoses', event: 'crop-doctor:changed' };
    if (path.includes('/crop-doctor/admin/diseases')) return { col: 'diseases', event: 'crop-doctor:changed' };
    if (path.includes('/crop-doctor/admin/crops')) return { col: 'crops', event: 'crop-doctor:changed' };
    if (path.includes('/crop-doctor/admin/treatments')) return { col: 'treatments', event: 'crop-doctor:changed' };
    if (path.includes('/crop-doctor/admin/translations')) return { col: 'translations', event: 'crop-doctor:changed' };
    if (path.includes('/market/prices')) return { col: 'prices', event: 'market:changed' };
    if (path.includes('/videos')) return { col: 'videos', event: 'videos:published' };
    if (path.includes('/notifications')) return { col: 'notifications', event: 'notifications:changed' };
    if (path.includes('/tasks')) return { col: 'tasks', event: 'tasks:changed' };
    if (path.includes('/events')) return { col: 'events', event: 'events:changed' };
    if (path.includes('/schemes')) return { col: 'schemes', event: 'schemes:changed' };
    if (path.includes('/machinery')) return { col: 'machinery', event: 'machinery:changed' };
    if (path.includes('/news')) return { col: 'news', event: 'news:changed' };
    
    // fallback
    const parts = path.split('/').filter(Boolean);
    const colName = parts[parts.length - 1] === 'list' || parts[parts.length - 1] === 'create' ? parts[parts.length - 2] : parts[0];
    return { col: colName || 'unknown', event: `${colName || 'unknown'}:changed` };
  }

  // Dynamic Generic Request Handler
  router.use('/', async (req: Request, res: Response) => {
    try {
      const { col, event } = parseRoute(req.path);
      const collection = mongoose.connection.db?.collection(col);
      
      if (!collection) {
        return res.status(500).json({ error: 'Database not initialized' });
      }

      // Handle ID param matching (e.g. /users/:id/role or /users/:id)
      const segments = req.path.split('/').filter(Boolean);
      let id: string | null = null;
      for (const seg of segments) {
        if (seg.length === 24 && /^[0-9a-fA-F]{24}$/.test(seg)) {
          id = seg;
          break;
        }
      }

      if (req.method === 'GET') {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        // Generic search handling
        const query: any = {};
        if (req.query.search) {
          const searchRegex = new RegExp(req.query.search as string, 'i');
          query['$or'] = [
            { name: searchRegex },
            { title: searchRegex },
            { description: searchRegex }
          ];
        }
        
        // Custom filters from query
        for (const key of Object.keys(req.query)) {
          if (!['page', 'limit', 'search', 'sort'].includes(key) && req.query[key] !== 'all') {
            query[key] = req.query[key];
          }
        }

        const items = await collection.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }).toArray();
        const total = await collection.countDocuments(query);
        const mappedItems = items.map(item => ({ ...item, id: item._id.toString() }));

        return res.json({
          data: {
            rows: mappedItems,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
          }
        });
      }

      if (req.method === 'POST') {
        // Special case for complete task etc
        if (req.path.endsWith('/complete') && id) {
          await collection.updateOne({ _id: new ObjectId(id) }, { $set: { status: 'completed', progress: 100 } });
          io.emit(event);
          return res.json({ data: { success: true } });
        }
        
        // Special case for notifications read
        if (req.path.endsWith('/read') && req.body.notificationIds) {
          const ids = req.body.notificationIds.map((nId: string) => new ObjectId(nId));
          await collection.updateMany({ _id: { $in: ids } }, { $set: { read: true } });
          io.emit(event);
          return res.json({ data: { success: true } });
        }

        const doc = { ...req.body, createdAt: new Date(), updatedAt: new Date() };
        const result = await collection.insertOne(doc);
        io.emit(event); // Realtime sync
        
        return res.status(201).json({
          data: { ...doc, id: result.insertedId.toString() }
        });
      }

      if (req.method === 'PUT' || req.method === 'PATCH') {
        if (!id) return res.status(400).json({ error: 'ID is required for update' });
        
        const updateData = { ...req.body, updatedAt: new Date() };
        // Remove _id or id if sent in body
        delete updateData._id;
        delete updateData.id;

        await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateData });
        io.emit(event); // Realtime sync
        
        return res.json({ data: { success: true } });
      }

      if (req.method === 'DELETE') {
        if (!id) return res.status(400).json({ error: 'ID is required for deletion' });
        
        await collection.deleteOne({ _id: new ObjectId(id) });
        io.emit(event); // Realtime sync
        
        return res.json({ data: { success: true } });
      }

      return res.status(405).json({ error: 'Method not allowed' });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: error.message || 'Server error' });
    }
  });

  return router;
}
