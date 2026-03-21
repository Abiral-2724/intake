import { AppError } from "../middleware/errorHandler.js";
import client from "../prisma.js";

export const getWorkspaces = async (req , res , next ) => {
    try {
      const userId = req.headers["x-user-id"] ;
      if (!userId) throw new AppError("Unauthorized", 401);
  
      const workspaces = await client.workspace.findMany({
        where: { members: { some: { userId } } },
        include: { _count: { select: { forms: true, members: true } } },
        orderBy: { createdAt: "desc" },
      });
  
      res.json({ success: true, data: workspaces });
    } catch (err) { next(err); }
  };


  export const createWorkspace = async (req , res , next ) => {
    try {
      const userId = req.headers["x-user-id"] ;
      if (!userId) throw new AppError("Unauthorized", 401);
  
      const { name, slug, logoUrl } = req.body;
      if (!name || !slug) throw new AppError("name and slug are required", 400);
  
      const workspace = await client.workspace.create({
        data: {
          name,
          slug,
          logoUrl,
          ownerId: userId,
          members: { create: { userId, role: "OWNER" } },
        },
          include: { _count: { select: { forms: true, members: true } } },
      });
  
      res.status(201).json({ success: true, data: workspace });
    } catch (err) { next(err); }
  };


  export const getWorkspace = async (req , res , next) => {
    try {
      const workspace = await client.workspace.findUnique({
        where: { id: req.params.id },
        include: {
          members: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true, profile: true } } } },
          _count: { select: { forms: true } },
        },
      });
      if (!workspace) throw new AppError("Workspace not found", 404);
      res.json({ success: true, data: workspace });
    } catch (err) { next(err); }
};


export const updateWorkspace = async (req , res , next) => {
    try {
      const { name, logoUrl } = req.body;
      const workspace = await client.workspace.update({
        where: { id: req.params.id },
        data: {
          ...(name !== undefined && { name }),
          ...(logoUrl !== undefined && { logoUrl }),
        },
      });
      res.json({ success: true, data: workspace });
    } catch (err) { next(err); }
  };

  export const deleteWorkspace = async (req , res , next) => {
    try {
      await client.workspace.delete({ where: { id: req.params.id } });
      res.json({ success: true, message: "Workspace deleted" });
    } catch (err) { next(err); }
  };


  export const addMember = async (req , res , next) => {
    try {
      const { userId, role } = req.body;
      if (!userId) throw new AppError("userId is required", 400);
  
      const member = await client.workspaceMember.create({
        data: { workspaceId: req.params.id, userId, role: role || "VIEWER" },
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      });
      res.status(201).json({ success: true, data: member });
    } catch (err) { next(err); }
  };


  export const removeMember = async (req , res , next) => {
    try {
      await prisma.workspaceMember.delete({
        where: { workspaceId_userId: { workspaceId: req.params.id, userId: req.params.userId } },
      });
      res.json({ success: true, message: "Member removed" });
    } catch (err) { next(err); }
  };
